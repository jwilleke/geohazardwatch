#!/usr/bin/env node
'use strict';

/**
 * Import volcano data from the GVP (Global Volcanism Program) WFS API.
 *
 * Outputs:
 *   data/volcanoes.json       — always generated
 *   data/eruptions.json       — requires eruptions: true
 *   data/global-activity.json — requires activity: true
 *
 * Usage:
 *   node import/import-volcanoes.js
 *   node import/import-volcanoes.js --eruptions
 *   node import/import-volcanoes.js --activity
 *   node import/import-volcanoes.js --eruptions --activity
 *   node import/import-volcanoes.js --data-dir /custom/path
 *
 * Programmatic:
 *   const { runImport } = require('./import-volcanoes');
 *   const result = await runImport('/path/to/data', { eruptions: true });
 *   // result: { total, holocene, pleistocene }
 */

const fs   = require('fs');
const path = require('path');

const WFS_BASE = 'https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows';

const ENDPOINTS = {
  holoceneVolcanoes:   'Smithsonian_VOTW_Holocene_Volcanoes',
  pleistoceneVolcanoes:'Smithsonian_VOTW_Pleistocene_Volcanoes',
  holoceneEruptions:   'Smithsonian_VOTW_Holocene_Eruptions',
  eruptionsSince1960:  'E3WebApp_Eruptions1960',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildWfsUrl(typeName, maxFeatures = 50000) {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: `GVP-VOTW:${typeName}`,
    maxFeatures: String(maxFeatures),
    outputFormat: 'application/json',
  });
  return `${WFS_BASE}?${params}`;
}

async function fetchGeoJSON(typeName, label) {
  const url = buildWfsUrl(typeName);
  console.log(`Fetching ${label}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${label}: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`  Received ${data.features.length} of ${data.totalFeatures} features`);
  return data;
}

function formatEruptionYear(year) {
  if (year == null) return 'Unknown';
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

function mapHolocene(props) {
  return {
    volcanoNumber:       props.Volcano_Number,
    volcanoName:         props.Volcano_Name         || '',
    country:             props.Country              || '',
    volcanicRegionGroup: props.Region               || '',
    volcanicRegion:      props.Subregion            || '',
    volcanoLandform:     props.Volcanic_Landform     || '',
    primaryVolcanoType:  props.Primary_Volcano_Type  || '',
    activityEvidence:    props.Evidence_Category     || '',
    lastKnownEruption:   formatEruptionYear(props.Last_Eruption_Year),
    latitude:            props.Latitude             || 0,
    longitude:           props.Longitude            || 0,
    elevation:           props.Elevation            || 0,
    dominantRockType:    props.Major_Rock_Type       || '',
    tectonicSetting:     props.Tectonic_Setting      || '',
    epoch:               'Holocene',
    geologicalSummary:   props.Geological_Summary    || undefined,
    primaryPhotoLink:    props.Primary_Photo_Link    || undefined,
    primaryPhotoCaption: props.Primary_Photo_Caption || undefined,
    primaryPhotoCredit:  props.Primary_Photo_Credit  || undefined,
  };
}

function mapPleistocene(props) {
  return {
    volcanoNumber:       props.Volcano_Number,
    volcanoName:         props.Volcano_Name      || '',
    country:             props.Country           || '',
    volcanicRegionGroup: props.Region            || '',
    volcanicRegion:      props.Subregion         || '',
    volcanoLandform:     props.Volcanic_Landform  || '',
    primaryVolcanoType:  props.Primary_Volcano_Type || '',
    activityEvidence:    '',
    lastKnownEruption:   'Unknown',
    latitude:            props.Latitude          || 0,
    longitude:           props.Longitude         || 0,
    elevation:           props.Elevation         || 0,
    dominantRockType:    '',
    tectonicSetting:     '',
    epoch:               'Pleistocene',
    geologicalSummary:   props.Geological_Summary || undefined,
  };
}

function mapEruption(props) {
  return {
    volcanoNumber:            props.Volcano_Number,
    volcanoName:              props.Volcano_Name          || '',
    eruptionNumber:           props.Eruption_Number,
    activityType:             props.Activity_Type         || '',
    activityArea:             props.ActivityArea          || '',
    explosivityIndexMax:      props.ExplosivityIndexMax,
    startDateYear:            props.StartDateYear,
    startDateYearUncertainty: props.StartDateYearUncertainty,
    startDateMonth:           props.StartDateMonth        || null,
    startDateDay:             props.StartDateDay          || null,
    startEvidenceMethod:      props.StartEvidenceMethod   || '',
  };
}

function mapContinuingEruption(props) {
  return {
    volcanoNumber:      props.VolcanoNumber,
    volcanoName:        props.VolcanoName       || '',
    latitude:           props.LatitudeDecimal   || 0,
    longitude:          props.LongitudeDecimal  || 0,
    explosivityIndexMax: props.ExplosivityIndexMax,
    startDate:          props.StartDate         || '',
    startDateYear:      props.StartDateYear,
    startDateMonth:     props.StartDateMonth    || null,
    startDateDay:       props.StartDateDay      || null,
    endDate:            props.EndDate           || null,
    endDateYear:        props.EndDateYear,
    endDateMonth:       props.EndDateMonth      || null,
    endDateDay:         props.EndDateDay        || null,
  };
}

// ── Core import function ─────────────────────────────────────────────────────

/**
 * Import GVP volcano data and write volcanoes.json (always), eruptions.json,
 * and global-activity.json (when requested via flags).
 *
 * @param {string} dataDir
 * @param {{ eruptions?: boolean, activity?: boolean }} [flags]
 * @returns {{ total: number, holocene: number, pleistocene: number }}
 */
async function runImport(dataDir, flags = {}) {
  const { eruptions: includeEruptions = false, activity: includeActivity = false } = flags;

  console.log('Importing volcano data from GVP WFS API…\n');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Always import volcano records
  const [holoceneData, pleistoceneData] = await Promise.all([
    fetchGeoJSON(ENDPOINTS.holoceneVolcanoes,   'Holocene volcanoes'),
    fetchGeoJSON(ENDPOINTS.pleistoceneVolcanoes, 'Pleistocene volcanoes'),
  ]);

  const holoceneVolcanoes   = holoceneData.features.map(f => mapHolocene(f.properties));
  const pleistoceneVolcanoes = pleistoceneData.features.map(f => mapPleistocene(f.properties));
  const allVolcanoes         = [...holoceneVolcanoes, ...pleistoceneVolcanoes];

  const volcanoesPath = path.join(dataDir, 'volcanoes.json');
  fs.writeFileSync(volcanoesPath, JSON.stringify(allVolcanoes, null, 2), 'utf8');

  console.log('\nVolcano import complete:');
  console.log(`  Holocene:    ${holoceneVolcanoes.length}`);
  console.log(`  Pleistocene: ${pleistoceneVolcanoes.length}`);
  console.log(`  Total:       ${allVolcanoes.length}`);
  console.log(`  Written to:  ${volcanoesPath}`);

  // Optionally import eruption records
  if (includeEruptions) {
    const eruptionsData = await fetchGeoJSON(ENDPOINTS.holoceneEruptions, 'Holocene eruptions');
    const eruptions = eruptionsData.features.map(f => mapEruption(f.properties));

    const eruptionsPath = path.join(dataDir, 'eruptions.json');
    fs.writeFileSync(eruptionsPath, JSON.stringify(eruptions, null, 2), 'utf8');

    console.log('\nEruption import complete:');
    console.log(`  Eruptions:  ${eruptions.length}`);
    console.log(`  Written to: ${eruptionsPath}`);
  }

  // Optionally import global activity snapshot
  if (includeActivity) {
    const e3Data = await fetchGeoJSON(ENDPOINTS.eruptionsSince1960, 'eruptions since 1960 (global activity)');

    const continuing = e3Data.features
      .filter(f => f.properties.ContinuingEruption === 'True')
      .map(f => mapContinuingEruption(f.properties))
      .sort((a, b) => (b.startDateYear || 0) - (a.startDateYear || 0));

    const snapshot = {
      fetchedUtc: new Date().toISOString(),
      continuingEruptions: continuing,
      totalEruptionsSince1960: e3Data.features.length,
    };

    const activityPath = path.join(dataDir, 'global-activity.json');
    fs.writeFileSync(activityPath, JSON.stringify(snapshot, null, 2), 'utf8');

    console.log('\nGlobal activity import complete:');
    console.log(`  Continuing eruptions: ${continuing.length}`);
    console.log(`  Total since 1960:     ${e3Data.features.length}`);
    console.log(`  Written to:           ${activityPath}`);

    if (continuing.length > 0) {
      console.log('\nCurrently erupting:');
      for (const e of continuing) {
        const vei = e.explosivityIndexMax != null ? `VEI ${e.explosivityIndexMax}` : 'VEI ?';
        console.log(`  ${e.volcanoName.padEnd(30)} since ${e.startDate}  ${vei}`);
      }
    }
  }

  return { total: allVolcanoes.length, holocene: holoceneVolcanoes.length, pleistocene: pleistoceneVolcanoes.length };
}

module.exports = { runImport };

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const includeEruptions = args.includes('--eruptions');
  const includeActivity  = args.includes('--activity');
  const dataDirIdx = args.indexOf('--data-dir');
  const dataDir = dataDirIdx >= 0 && args[dataDirIdx + 1]
    ? args[dataDirIdx + 1]
    : path.join(__dirname, '..', 'data');

  runImport(dataDir, { eruptions: includeEruptions, activity: includeActivity }).catch(err => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
}
