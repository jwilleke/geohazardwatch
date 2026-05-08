#!/usr/bin/env node
'use strict';

/**
 * Import volcano alert data from the USGS HANS API
 * (Hazard Alert Notification System).
 *
 * Fetches elevated volcanoes, daily synopsis, and monitored volcano count
 * and writes a snapshot to activity.json.
 *
 * Usage:
 *   node import/import-hans.js
 *   node import/import-hans.js --data-dir /custom/path
 *
 * Programmatic:
 *   const { runImport } = require('./import-hans');
 *   const result = await runImport('/path/to/data');
 *   // result: { elevatedCount, monitoredCount }
 *
 * No auth required. US volcanoes only (65 monitored).
 *
 * Output: {dataDir}/activity.json
 */

const fs   = require('fs');
const path = require('path');

const HANS_API = 'https://volcanoes.usgs.gov/hans-public/api';

async function fetchJson(endpoint, label) {
  const url = `${HANS_API}${endpoint}`;
  console.log(`Fetching ${label}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${label}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Import HANS volcano alert data and write activity.json.
 *
 * @param {string} dataDir  Path to the geohazardwatch data directory
 * @returns {{ elevatedCount: number, monitoredCount: number }}
 */
async function runImport(dataDir) {
  console.log('Importing volcano activity from USGS HANS API...\n');

  const [elevated, dailySummary, monitored] = await Promise.all([
    fetchJson('/volcano/getElevatedVolcanoes', 'elevated volcanoes'),
    fetchJson('/notice/getDailySummaryData',   'daily summary'),
    fetchJson('/volcano/getMonitoredVolcanoes', 'monitored volcanoes'),
  ]);

  // Build synopsis map keyed by vnum
  const synopsisMap = new Map();
  for (const item of dailySummary) {
    if (item.vnum) synopsisMap.set(item.vnum, item);
  }

  // Merge elevated list with synopsis data
  const elevatedVolcanoes = elevated
    .filter(e => e.vnum)
    .map(e => {
      const summary = synopsisMap.get(e.vnum);
      return {
        volcanoNumber:       e.vnum,
        volcanoName:         e.volcano_name,
        alertLevel:          e.alert_level,
        colorCode:           e.color_code,
        synopsis:            summary?.synopsis || '',
        observatory:         e.obs_fullname,
        observatoryAbbr:     e.obs_abbr,
        sentUtc:             e.sent_utc,
        noticeUrl:           e.notice_url,
        previousAlertLevel:  summary?.prevAlertLevel  || null,
        previousColorCode:   summary?.prevColorCode   || null,
      };
    });

  const monitoredCount = monitored.filter(m => m.vnum).length;

  const snapshot = {
    fetchedUtc:        new Date().toISOString(),
    elevatedVolcanoes,
    monitoredCount,
    elevatedCount:     elevatedVolcanoes.length,
  };

  fs.mkdirSync(dataDir, { recursive: true });
  const outputPath = path.join(dataDir, 'activity.json');
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));

  console.log('\nHANS import complete:');
  console.log(`  Elevated volcanoes : ${elevatedVolcanoes.length}`);
  console.log(`  Monitored volcanoes: ${monitoredCount}`);
  console.log(`  Fetched at         : ${snapshot.fetchedUtc}`);
  console.log(`  Written to         : ${outputPath}`);

  if (elevatedVolcanoes.length > 0) {
    console.log('\nCurrent alerts:');
    for (const a of elevatedVolcanoes) {
      console.log(`  ${a.colorCode.padEnd(6)} ${a.alertLevel.padEnd(8)} ${a.volcanoName} (${a.observatoryAbbr.toUpperCase()})`);
    }
  }

  return { elevatedCount: elevatedVolcanoes.length, monitoredCount };
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
    console.error('HANS import failed:', err.message);
    process.exit(1);
  });
}
