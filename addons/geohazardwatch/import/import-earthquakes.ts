#!/usr/bin/env node
/**
 * Import earthquake data from the USGS Earthquake Hazards Program feeds.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { EarthquakeRecord, NearestVolcano, VolcanoRecord } from '../lib/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEED_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

export const FEEDS: Record<string, string> = {
  'significant-week': `${FEED_BASE}/significant_week.geojson`,
  '4.5-week': `${FEED_BASE}/4.5_week.geojson`,
  '2.5-week': `${FEED_BASE}/2.5_week.geojson`,
  '4.5-month': `${FEED_BASE}/4.5_month.geojson`,
  'significant-month': `${FEED_BASE}/significant_month.geojson`
};

export const DEFAULT_FEED = '4.5-week';
const PROXIMITY_KM = 50;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestVolcano(lat: number, lon: number, volcanoes: VolcanoRecord[]): NearestVolcano | null {
  let nearest: NearestVolcano | null = null;
  for (const v of volcanoes) {
    const dist = distanceKm(lat, lon, v.latitude, v.longitude);
    if (dist <= PROXIMITY_KM && (!nearest || dist < nearest.distanceKm)) {
      nearest = {
        volcanoNumber: v.volcanoNumber,
        volcanoName: v.volcanoName,
        distanceKm: Math.round(dist * 10) / 10
      };
    }
  }
  return nearest;
}

interface UsgsFeature {
  id: string;
  properties: Record<string, unknown>;
  geometry: { coordinates: [number, number, number] };
}

function mapEarthquake(feature: UsgsFeature, volcanoes: VolcanoRecord[]): EarthquakeRecord {
  const p = feature.properties;
  const [lon, lat, depth] = feature.geometry.coordinates;

  const eq: EarthquakeRecord = {
    id: feature.id,
    magnitude: Number(p['mag']),
    magnitudeType: String(p['magType'] || ''),
    place: String(p['place'] || ''),
    time: new Date(Number(p['time'])).toISOString(),
    updated: new Date(Number(p['updated'])).toISOString(),
    url: String(p['url'] || ''),
    latitude: lat,
    longitude: lon,
    depth: depth || 0,
    felt: (p['felt'] as number | null) ?? null,
    cdi: (p['cdi'] as number | null) ?? null,
    mmi: (p['mmi'] as number | null) ?? null,
    alert: (p['alert'] as string | null) ?? null,
    tsunami: p['tsunami'] === 1,
    significance: Number(p['sig'] || 0),
    status: String(p['status'] || ''),
    type: String(p['type'] || ''),
    title: String(p['title'] || '')
  };

  const nearest = findNearestVolcano(lat, lon, volcanoes);
  if (nearest) eq.nearestVolcano = nearest;
  return eq;
}

function loadVolcanoes(dataDir: string): VolcanoRecord[] {
  const volcanoesPath = path.join(dataDir, 'volcanoes.json');
  if (!fs.existsSync(volcanoesPath)) {
    console.warn('Warning: volcanoes.json not found — run import-volcanoes.js first.');
    console.warn('Earthquake import will proceed without volcano proximity matching.\n');
    return [];
  }
  return JSON.parse(fs.readFileSync(volcanoesPath, 'utf8')) as VolcanoRecord[];
}

export async function runImport(
  dataDir: string,
  feedName = DEFAULT_FEED
): Promise<{ total: number; nearVolcano: number }> {
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

  const data = (await response.json()) as { features: UsgsFeature[]; metadata: { title: string } };
  console.log(`  Received ${data.features.length} earthquakes (${data.metadata.title})`);

  const earthquakes = data.features.map((f) => mapEarthquake(f, volcanoes));
  const nearVolcanoList = earthquakes.filter((e) => e.nearestVolcano);

  const snapshot = {
    fetchedUtc: new Date().toISOString(),
    feed: feedName,
    earthquakes,
    totalCount: earthquakes.length,
    nearVolcanoCount: nearVolcanoList.length
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
      if (!v) continue;
      console.log(`  M${eq.magnitude.toFixed(1)} ${eq.place.padEnd(40)} ${v.distanceKm} km from ${v.volcanoName}`);
    }
  }

  const m6plus = earthquakes.filter((e) => e.magnitude >= 6).length;
  const m5plus = earthquakes.filter((e) => e.magnitude >= 5).length;
  const tsunamis = earthquakes.filter((e) => e.tsunami).length;

  if (m6plus > 0 || tsunamis > 0) {
    console.log('\nNotable:');
    if (m6plus > 0) console.log(`  M6+ earthquakes:    ${m6plus}`);
    if (m5plus > 0) console.log(`  M5+ earthquakes:    ${m5plus}`);
    if (tsunamis > 0) console.log(`  Tsunami advisories: ${tsunamis}`);
  }

  return { total: earthquakes.length, nearVolcano: nearVolcanoList.length };
}

const isCli =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const args = process.argv.slice(2);
  const feedArg = args.find((a) => a.startsWith('--feed='));
  const feedName = feedArg ? feedArg.split('=')[1] : DEFAULT_FEED;

  if (!feedName || !FEEDS[feedName]) {
    console.error(`Unknown feed: ${feedName}`);
    console.error(`Available: ${Object.keys(FEEDS).join(', ')}`);
    process.exit(1);
  }

  const dataDirIdx = args.indexOf('--data-dir');
  const dataDir =
    dataDirIdx >= 0 && args[dataDirIdx + 1]
      ? args[dataDirIdx + 1]
      : path.join(__dirname, '..', 'data');

  runImport(dataDir, feedName).catch((err: unknown) => {
    console.error('Earthquake import failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
