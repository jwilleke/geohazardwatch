#!/usr/bin/env node
'use strict';

/**
 * Import active Volcanic Ash Advisories from the Washington VAAC
 * (Volcano Observatory Notification for Aviation Advisory Center — one of
 * nine ICAO-mandated regional centers; Washington covers the Americas,
 * E. Pacific, and Caribbean).
 *
 * No formal API. The archive index page lists every advisory issued this
 * year, grouped by volcano, newest first. This import takes only the most
 * recent advisory per volcano and discards it if older than MAX_AGE_HOURS
 * (an advisory not superseded within that window is treated as stale —
 * Washington reissues every ~6 hours while ash is still being tracked).
 *
 * Requires volcanoes.json to already exist (run import-volcanoes.js first)
 * for GVP cross-referencing — the advisory XML embeds the GVP number
 * directly in the volcano name field (e.g. "FUEGO 342090").
 *
 * Usage:
 *   node import/import-vaac.js
 *   node import/import-vaac.js --data-dir /custom/path
 *
 * Programmatic:
 *   const { runImport } = require('./import-vaac');
 *   const result = await runImport('/path/to/data');
 *   // result: { total }
 *
 * No auth required. Washington VAAC only — see geohazardwatch#5 for the
 * other 8 ICAO VAACs (not yet integrated).
 *
 * Output: {dataDir}/vaac.json
 */

const fs   = require('fs');
const path = require('path');

const ARCHIVE_URL   = 'https://www.ospo.noaa.gov/products/atmosphere/vaac/archive.html';
const BASE_URL       = 'https://www.ospo.noaa.gov';
const MAX_AGE_HOURS  = 48;

// ── HTML index parsing ───────────────────────────────────────────────────────

/**
 * Parse the archive index HTML and return the single most recent advisory
 * entry per volcano (the listing is newest-first within each volcano block).
 *
 * @param {string} html
 * @returns {{ volcanoName: string, xmlUrl: string, issuedUtc: string }[]}
 */
function parseLatestPerVolcano(html) {
  const entries = [];
  // Each volcano section: <dt>NAME</dt> followed by one or more <dd>...</dd>
  const sectionRe = /<dt>([^<]+)<\/dt>\s*((?:<dd>.*?<\/dd>\s*)+)/gs;
  let sectionMatch;
  while ((sectionMatch = sectionRe.exec(html)) !== null) {
    const volcanoName = sectionMatch[1].trim();
    const ddBlock      = sectionMatch[2];

    // First <dd> in the block is the most recent advisory for this volcano.
    const ddRe = /<dd>(.*?)<\/dd>/s;
    const ddMatch = ddRe.exec(ddBlock);
    if (!ddMatch) continue;

    const dd = ddMatch[1];
    const xmlMatch = /href="([^"]+xml_files\/[^"]+\.xml)"/.exec(dd);
    if (!xmlMatch) continue;

    const xmlPath = xmlMatch[1];
    const xmlUrl  = xmlPath.startsWith('http') ? xmlPath : `${BASE_URL}${xmlPath}`;

    // Filenames encode the issue time: FVxxNN_YYYYMMDD_HHMM.xml
    const tsMatch = /_(\d{8})_(\d{4})\.xml$/.exec(xmlPath);
    let issuedUtc = null;
    if (tsMatch) {
      const [, ymd, hm] = tsMatch;
      issuedUtc = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hm.slice(0, 2)}:${hm.slice(2, 4)}:00Z`;
    }

    entries.push({ volcanoName, xmlUrl, issuedUtc });
  }
  return entries;
}

// ── Advisory XML parsing ─────────────────────────────────────────────────────

/** Extract the text content of the first match of `tag` (namespace-agnostic). */
function tagText(xml, tag) {
  const re = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([^<]*)<`, 's');
  const m = re.exec(xml);
  return m ? m[1].trim() : null;
}

/**
 * Parse one VolcanicAshAdvisory XML (ICAO IWXXM 3.0) into a flat record.
 * @param {string} xml
 * @returns {object}
 */
function parseAdvisoryXml(xml) {
  // The document has more than one <name> element (the issuing VAAC unit
  // has one too) — scope to the <EruptingVolcano> block specifically.
  const volcanoBlockMatch = /<(?:\w+:)?EruptingVolcano\b.*?<\/(?:\w+:)?EruptingVolcano>/s.exec(xml);
  const volcanoBlock = volcanoBlockMatch ? volcanoBlockMatch[0] : xml;

  const rawName = tagText(volcanoBlock, 'name') || '';
  const nameMatch = /^(.*\S)\s+(\d{4,6})$/.exec(rawName);
  const volcanoName = nameMatch ? nameMatch[1] : rawName;
  const gvpNumber    = nameMatch ? Number(nameMatch[2]) : null;

  const posText = tagText(volcanoBlock, 'gml:pos') || tagText(volcanoBlock, 'pos');
  const [lat, lon] = posText
    ? posText.split(/\s+/).map(Number)
    : [null, null];

  return {
    vaac:                 'WASHINGTON',
    volcanoName,
    gvpNumber,
    latitude:             lat,
    longitude:            lon,
    region:               tagText(xml, 'stateOrRegion'),
    summitElevationFt:    Number(tagText(xml, 'summitElevation')) || null,
    advisoryNumber:       tagText(xml, 'advisoryNumber'),
    issueTimeUtc:         extractTimePosition(xml, 'issueTime'),
    informationSource:    tagText(xml, 'informationSource'),
    eruptionDetails:      tagText(xml, 'eruptionDetails'),
    ashCloudTopFl:        Number(tagText(xml, 'upperLimit')) || null,
    directionOfMotionDeg: Number(tagText(xml, 'directionOfMotion')) || null,
    speedOfMotionKt:      Number(tagText(xml, 'speedOfMotion')) || null,
    remarks:              (tagText(xml, 'remarks') || '').trim(),
    nextAdvisoryTimeUtc:  extractTimePosition(xml, 'nextAdvisoryTime'),
  };
}

/**
 * Some fields wrap a gml:TimeInstant/gml:timePosition rather than plain text
 * (issueTime, nextAdvisoryTime) — extract from the specific enclosing element.
 */
function extractTimePosition(xml, enclosingTag) {
  const outerRe = new RegExp(`<${enclosingTag}>(.*?)<\\/${enclosingTag}>`, 's');
  const outer = outerRe.exec(xml);
  if (!outer) return null;
  const inner = /<gml:timePosition[^>]*>([^<]*)</.exec(outer[1]);
  return inner ? inner[1].trim() : null;
}

// ── Volcano cross-reference ──────────────────────────────────────────────────

function loadVolcanoes(dataDir) {
  const volcanoesPath = path.join(dataDir, 'volcanoes.json');
  if (!fs.existsSync(volcanoesPath)) {
    console.warn('Warning: volcanoes.json not found — run import-volcanoes.js first.');
    console.warn('VAAC import will proceed without volcano catalog cross-referencing.\n');
    return [];
  }
  return JSON.parse(fs.readFileSync(volcanoesPath, 'utf8'));
}

// ── Core import function ─────────────────────────────────────────────────────

/**
 * Import active Washington VAAC advisories and write vaac.json.
 *
 * @param {string} dataDir  Path to the geohazardwatch data directory
 * @returns {{ total: number }}
 */
async function runImport(dataDir) {
  console.log('Importing volcanic ash advisories from Washington VAAC…\n');

  const volcanoes = loadVolcanoes(dataDir);
  const byNumber = new Map(volcanoes.map(v => [Number(v.volcanoNumber), v]));

  console.log(`Fetching advisory archive index…\n  ${ARCHIVE_URL}`);
  const indexRes = await fetch(ARCHIVE_URL);
  if (!indexRes.ok) {
    throw new Error(`Failed to fetch archive index: ${indexRes.status} ${indexRes.statusText}`);
  }
  const indexHtml = await indexRes.text();

  const latestEntries = parseLatestPerVolcano(indexHtml);
  console.log(`Found ${latestEntries.length} volcano(es) with advisories on record this year.`);

  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  const active = latestEntries.filter(e => e.issuedUtc && new Date(e.issuedUtc).getTime() >= cutoff);
  console.log(`${active.length} within the last ${MAX_AGE_HOURS}h (treated as active).\n`);

  const advisories = [];
  for (const entry of active) {
    console.log(`  Fetching ${entry.volcanoName}…`);
    let xml;
    try {
      const res = await fetch(entry.xmlUrl);
      if (!res.ok) {
        console.warn(`    Skipped — ${res.status} ${res.statusText}`);
        continue;
      }
      xml = await res.text();
    } catch (err) {
      console.warn(`    Skipped — ${err.message}`);
      continue;
    }

    const parsed = parseAdvisoryXml(xml);
    if (!parsed.issueTimeUtc) parsed.issueTimeUtc = entry.issuedUtc;

    const gvpVolcano = parsed.gvpNumber ? byNumber.get(parsed.gvpNumber) : null;

    advisories.push({
      ...parsed,
      matchedVolcanoNumber: gvpVolcano ? gvpVolcano.volcanoNumber : null,
      sourceXmlUrl: entry.xmlUrl,
    });
  }

  const snapshot = {
    fetchedUtc: new Date().toISOString(),
    maxAgeHours: MAX_AGE_HOURS,
    advisories,
    totalCount: advisories.length,
  };

  fs.mkdirSync(dataDir, { recursive: true });
  const outputPath = path.join(dataDir, 'vaac.json');
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));

  console.log('\nVAAC import complete:');
  console.log(`  Active advisories: ${advisories.length}`);
  console.log(`  Written to:        ${outputPath}`);

  if (advisories.length > 0) {
    console.log('\nActive ash advisories:');
    for (const a of advisories) {
      console.log(`  ${a.volcanoName.padEnd(20)} FL${a.ashCloudTopFl ?? '?'} ${a.region || ''}`.trimEnd());
    }
  }

  return { total: advisories.length };
}

module.exports = { runImport };

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  const args      = process.argv.slice(2);
  const dataDirIdx = args.indexOf('--data-dir');
  const dataDir   = dataDirIdx >= 0 && args[dataDirIdx + 1]
    ? args[dataDirIdx + 1]
    : path.join(__dirname, '..', 'data');

  runImport(dataDir).catch(err => {
    console.error('VAAC import failed:', err.message);
    process.exit(1);
  });
}
