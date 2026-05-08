#!/usr/bin/env node
'use strict';

/**
 * Import earthquake data from the USGS Earthquake Hazards Program feeds.
 * Matches each earthquake to the nearest volcano within 50 km using
 * the Haversine formula and annotates it with nearestVolcano.
 *
 * Requires volcanoes.json to already exist (run import-volcanoes.js first).
 *
 * Usage:
 *   node import/import-earthquakes.js
 *   node import/import-earthquakes.js --feed=significant-week
 *   node import/import-earthquakes.js --feed=4.5-month
 *   node import/import-earthquakes.js --data-dir /custom/path
 *
 * Programmatic:
 *   const { runImport } = require('./import-earthquakes');
 *   const result = await runImport('/path/to/data', '4.5-week');
 *   // result: { total, nearVolcano }
 *
 * Available feeds:
 *   significant-week  (notable events)
 *   4.5-week          (default — M4.5+ past 7 days)
 *   2.5-week          (M2.5+ past 7 days)
 *   4.5-month         (M4.5+ past 30 days)
 *   significant-month (significant past 30 days)
 */

const fs   = require('fs');
const path = require('path');

const FEED_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

const FEEDS = {
  'significant-week':  `${FEED_BASE}/significant_week.geojson`,
  '4.5-week':          `${FEED_BASE}/4.5_week.geojson`,
  '2.5-week':          `${FEED_BASE}/2.5_week.geojson`,
  '4.5-month':         `${FEED_BASE}/4.5_month.geojson`,
  'significant-month': `${FEED_BASE}/significant_month.geojson`,
};

const DEFAULT_FEED = '4.5-week';
const PROXIMITY_KM = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestVolcano(lat, lon, volcanoes) {
  let nearest = null;
  for (const v of volcanoes) {
    const dist = distanceKm(lat, lon, v.latitude, v.longitude);
    if (dist <= PROXIMITY_KM && (!nearest || dist < nearest.distanceKm)) {
      nearest = {
        volcanoNumber: v.volcanoNumber,
        volcanoName:   v.volcanoName,
        distanceKm:    Math.round(dist * 10) / 10,
      };
    }
  }
  return nearest;
}

function mapEarthquake(feature, volcanoes) {
  const p = feature.properties;
  const [lon, lat, depth] = feature.geometry.coordinates;

  const eq = {
    id:            feature.id,
    magnitude:     p.mag,
    magnitudeType: p.magType || '',
    place:         p.place  || '',
    time:          new Date(p.time).toISOString(),
    updated:       new Date(p.updated).toISOString(),
    url:           p.url    || '',
    latitude:      lat,
    longitude:     lon,
    depth:         depth || 0,
    felt:          p.felt,
    cdi:           p.cdi,
    mmi:           p.mmi,
    alert:         p.alert,
    tsunami:       p.tsunami === 1,
    significance:  p.sig  || 0,
    status:        p.status || '',
    type:          p.type   || '',
    title:         p.title  || '',
  };

  const nearest = findNearestVolcano(lat, lon, volcanoes);
  if (nearest) eq.nearestVolcano = nearest;

  return eq;
}

function loadVolcanoes(dataDir) {
  const volcanoesPath = path.join(dataDir, 'volcanoes.json');
  if (!fs.existsSync(volcanoesPath)) {
    console.warn('Warning: volcanoes.json not found — run import-volcanoes.js first.');
    console.warn('Earthquake import will proceed without volcano proximity matching.\n');
    return [];
  }
  return JSON.parse(fs.readFileSync(volcanoesPath, 'utf8'));
}

// ── Core import function ─────────────────────────────────────────────────────

/**
 * Import earthquake data and write earthquakes.json.
 *
 * @param {string} dataDir   Path to the geohazardwatch data directory
 * @param {string} [feedName='4.5-week']  USGS feed name
 * @returns {{ total: number, nearVolcano: number }}
 */
async function runImport(dataDir, feedName = DEFAULT_FEED) {
  if (!FEEDS[feedName]) {
    throw new Error(`Unknown feed: ${feedName}. Available: ${Object.keys(FEEDS).join(', ')}`);
  }

  const feedUrl = FEEDS[feedName];
  console.log('Importing earthquake data from USGS…\n');
  console.log(`Feed: ${feedName}`);
  console.log(`URL:  ${feedUrl}\n`);

  const volcanoes = loadVolcanoes(dataDir);
  if (volcanoes.length > 0) {
    console.log(`Loaded ${volcanoes.length} volcanoes for proximity matching (${PROXIMITY_KM} km radius)\n`);
  }

  console.log('Fetching earthquake feed…');
  const response = await fetch(feedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`  Received ${data.features.length} earthquakes (${data.metadata.title})`);

  const earthquakes = data.features.map(f => mapEarthquake(f, volcanoes));
  const nearVolcanoList = earthquakes.filter(e => e.nearestVolcano);

  const snapshot = {
    fetchedUtc:      new Date().toISOString(),
    feed:            feedName,
    earthquakes,
    totalCount:      earthquakes.length,
    nearVolcanoCount: nearVolcanoList.length,
  };

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const outputPath = path.join(dataDir, 'earthquakes.json');
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log('\nEarthquake import complete:');
  console.log(`  Total earthquakes:        ${earthquakes.length}`);
  console.log(`  Near volcanoes (≤${PROXIMITY_KM} km):  ${nearVolcanoList.length}`);
  console.log(`  Written to:               ${outputPath}`);

  if (nearVolcanoList.length > 0) {
    console.log('\nEarthquakes near volcanoes:');
    for (const eq of nearVolcanoList.sort((a, b) => b.magnitude - a.magnitude)) {
      const v = eq.nearestVolcano;
      console.log(`  M${eq.magnitude.toFixed(1)} ${eq.place.padEnd(40)} ${v.distanceKm} km from ${v.volcanoName}`);
    }
  }

  const m6plus   = earthquakes.filter(e => e.magnitude >= 6).length;
  const m5plus   = earthquakes.filter(e => e.magnitude >= 5).length;
  const tsunamis = earthquakes.filter(e => e.tsunami).length;

  if (m6plus > 0 || tsunamis > 0) {
    console.log('\nNotable:');
    if (m6plus   > 0) console.log(`  M6+ earthquakes:    ${m6plus}`);
    if (m5plus   > 0) console.log(`  M5+ earthquakes:    ${m5plus}`);
    if (tsunamis > 0) console.log(`  Tsunami advisories: ${tsunamis}`);
  }

  return { total: earthquakes.length, nearVolcano: nearVolcanoList.length };
}

module.exports = { runImport, FEEDS, DEFAULT_FEED };

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const feedArg = args.find(a => a.startsWith('--feed='));
  const feedName = feedArg ? feedArg.split('=')[1] : DEFAULT_FEED;

  if (!FEEDS[feedName]) {
    console.error(`Unknown feed: ${feedName}`);
    console.error(`Available: ${Object.keys(FEEDS).join(', ')}`);
    process.exit(1);
  }

  const dataDirIdx = args.indexOf('--data-dir');
  const dataDir = dataDirIdx >= 0 && args[dataDirIdx + 1]
    ? args[dataDirIdx + 1]
    : path.join(__dirname, '..', 'data');

  runImport(dataDir, feedName).catch(err => {
    console.error('Earthquake import failed:', err.message);
    process.exit(1);
  });
}
