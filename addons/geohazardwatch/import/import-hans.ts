#!/usr/bin/env node
/**
 * Import volcano alert data from the USGS HANS API.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { HansAlert } from '../lib/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANS_API = 'https://volcanoes.usgs.gov/hans-public/api';

interface HansElevatedRaw {
  vnum?: string;
  volcano_name?: string;
  alert_level?: string;
  color_code?: string;
  obs_fullname?: string;
  obs_abbr?: string;
  sent_utc?: string;
  notice_url?: string;
}

interface HansSummaryRaw {
  vnum?: string;
  synopsis?: string;
  prevAlertLevel?: string;
  prevColorCode?: string;
}

interface HansMonitoredRaw {
  vnum?: string;
}

async function fetchJson<T>(endpoint: string, label: string): Promise<T> {
  const url = `${HANS_API}${endpoint}`;
  console.log(`Fetching ${label}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${label}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function runImport(dataDir: string): Promise<{ elevatedCount: number; monitoredCount: number }> {
  console.log('Importing volcano activity from USGS HANS API...\n');

  const [elevated, dailySummary, monitored] = await Promise.all([
    fetchJson<HansElevatedRaw[]>('/volcano/getElevatedVolcanoes', 'elevated volcanoes'),
    fetchJson<HansSummaryRaw[]>('/notice/getDailySummaryData', 'daily summary'),
    fetchJson<HansMonitoredRaw[]>('/volcano/getMonitoredVolcanoes', 'monitored volcanoes')
  ]);

  const synopsisMap = new Map<string, HansSummaryRaw>();
  for (const item of dailySummary) {
    if (item.vnum) synopsisMap.set(item.vnum, item);
  }

  const elevatedVolcanoes: HansAlert[] = elevated
    .filter((e) => e.vnum)
    .map((e) => {
      const summary = synopsisMap.get(e.vnum ?? '');
      return {
        volcanoNumber: e.vnum ?? '',
        volcanoName: e.volcano_name ?? '',
        alertLevel: e.alert_level ?? '',
        colorCode: e.color_code ?? '',
        synopsis: summary?.synopsis || '',
        observatory: e.obs_fullname ?? '',
        observatoryAbbr: e.obs_abbr ?? '',
        sentUtc: e.sent_utc,
        noticeUrl: e.notice_url ?? '',
        previousAlertLevel: summary?.prevAlertLevel || null,
        previousColorCode: summary?.prevColorCode || null
      };
    });

  const monitoredCount = monitored.filter((m) => m.vnum).length;

  const snapshot = {
    fetchedUtc: new Date().toISOString(),
    elevatedVolcanoes,
    monitoredCount,
    elevatedCount: elevatedVolcanoes.length
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

const isCli =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const args = process.argv.slice(2);
  const dataDirIdx = args.indexOf('--data-dir');
  const dataDir =
    dataDirIdx >= 0 && args[dataDirIdx + 1]
      ? args[dataDirIdx + 1]
      : path.join(__dirname, '..', 'data');

  runImport(dataDir).catch((err: unknown) => {
    console.error('HANS import failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
