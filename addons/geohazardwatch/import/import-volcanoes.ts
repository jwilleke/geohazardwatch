#!/usr/bin/env node
/**
 * Import volcano data from the GVP (Global Volcanism Program) WFS API.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { EruptionRecord, VolcanoRecord } from '../lib/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WFS_BASE = 'https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows';

const ENDPOINTS = {
  holoceneVolcanoes: 'Smithsonian_VOTW_Holocene_Volcanoes',
  pleistoceneVolcanoes: 'Smithsonian_VOTW_Pleistocene_Volcanoes',
  holoceneEruptions: 'Smithsonian_VOTW_Holocene_Eruptions',
  eruptionsSince1960: 'E3WebApp_Eruptions1960'
};

interface GeoJsonFeature {
  properties: Record<string, unknown>;
}

interface GeoJson {
  features: GeoJsonFeature[];
  totalFeatures?: number;
}

function buildWfsUrl(typeName: string, maxFeatures = 50000): string {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: `GVP-VOTW:${typeName}`,
    maxFeatures: String(maxFeatures),
    outputFormat: 'application/json'
  });
  return `${WFS_BASE}?${params}`;
}

async function fetchGeoJSON(typeName: string, label: string): Promise<GeoJson> {
  const url = buildWfsUrl(typeName);
  console.log(`Fetching ${label}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${label}: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as GeoJson;
  console.log(`  Received ${data.features.length} of ${data.totalFeatures} features`);
  return data;
}

function formatEruptionYear(year: unknown): string {
  if (year == null) return 'Unknown';
  const n = Number(year);
  if (n < 0) return `${Math.abs(n)} BCE`;
  return `${n} CE`;
}

function str(props: Record<string, unknown>, key: string): string {
  return String(props[key] ?? '');
}

function num(props: Record<string, unknown>, key: string): number {
  return Number(props[key] || 0);
}

function mapHolocene(props: Record<string, unknown>): VolcanoRecord {
  return {
    volcanoNumber: Number(props['Volcano_Number']),
    volcanoName: str(props, 'Volcano_Name'),
    country: str(props, 'Country'),
    volcanicRegionGroup: str(props, 'Region'),
    volcanicRegion: str(props, 'Subregion'),
    volcanoLandform: str(props, 'Volcanic_Landform'),
    primaryVolcanoType: str(props, 'Primary_Volcano_Type'),
    activityEvidence: str(props, 'Evidence_Category'),
    lastKnownEruption: formatEruptionYear(props['Last_Eruption_Year']),
    latitude: num(props, 'Latitude'),
    longitude: num(props, 'Longitude'),
    elevation: num(props, 'Elevation'),
    dominantRockType: str(props, 'Major_Rock_Type'),
    tectonicSetting: str(props, 'Tectonic_Setting'),
    epoch: 'Holocene',
    geologicalSummary: (props['Geological_Summary'] as string | undefined) || undefined,
    primaryPhotoLink: (props['Primary_Photo_Link'] as string | undefined) || undefined,
    primaryPhotoCaption: (props['Primary_Photo_Caption'] as string | undefined) || undefined,
    primaryPhotoCredit: (props['Primary_Photo_Credit'] as string | undefined) || undefined
  };
}

function mapPleistocene(props: Record<string, unknown>): VolcanoRecord {
  return {
    volcanoNumber: Number(props['Volcano_Number']),
    volcanoName: str(props, 'Volcano_Name'),
    country: str(props, 'Country'),
    volcanicRegionGroup: str(props, 'Region'),
    volcanicRegion: str(props, 'Subregion'),
    volcanoLandform: str(props, 'Volcanic_Landform'),
    primaryVolcanoType: str(props, 'Primary_Volcano_Type'),
    activityEvidence: '',
    lastKnownEruption: 'Unknown',
    latitude: num(props, 'Latitude'),
    longitude: num(props, 'Longitude'),
    elevation: num(props, 'Elevation'),
    dominantRockType: '',
    tectonicSetting: '',
    epoch: 'Pleistocene',
    geologicalSummary: (props['Geological_Summary'] as string | undefined) || undefined
  };
}

function mapEruption(props: Record<string, unknown>): EruptionRecord {
  return {
    volcanoNumber: Number(props['Volcano_Number']),
    volcanoName: str(props, 'Volcano_Name'),
    eruptionNumber: Number(props['Eruption_Number']),
    activityType: str(props, 'Activity_Type'),
    activityArea: str(props, 'ActivityArea'),
    explosivityIndexMax: props['ExplosivityIndexMax'] as number | undefined,
    startDateYear: props['StartDateYear'] as number | undefined,
    startDateYearUncertainty: props['StartDateYearUncertainty'] as number | undefined,
    startDateMonth: (props['StartDateMonth'] as number | null) || null,
    startDateDay: (props['StartDateDay'] as number | null) || null,
    startEvidenceMethod: str(props, 'StartEvidenceMethod')
  };
}

interface ContinuingEruption {
  volcanoNumber: number;
  volcanoName: string;
  latitude: number;
  longitude: number;
  explosivityIndexMax?: number;
  startDate: string;
  startDateYear?: number;
  startDateMonth?: number | null;
  startDateDay?: number | null;
  endDate: string | null;
  endDateYear?: number;
  endDateMonth?: number | null;
  endDateDay?: number | null;
}

function mapContinuingEruption(props: Record<string, unknown>): ContinuingEruption {
  return {
    volcanoNumber: Number(props['VolcanoNumber']),
    volcanoName: str(props, 'VolcanoName'),
    latitude: Number(props['LatitudeDecimal'] || 0),
    longitude: Number(props['LongitudeDecimal'] || 0),
    explosivityIndexMax: props['ExplosivityIndexMax'] as number | undefined,
    startDate: str(props, 'StartDate'),
    startDateYear: props['StartDateYear'] as number | undefined,
    startDateMonth: (props['StartDateMonth'] as number | null) || null,
    startDateDay: (props['StartDateDay'] as number | null) || null,
    endDate: (props['EndDate'] as string | null) || null,
    endDateYear: props['EndDateYear'] as number | undefined,
    endDateMonth: (props['EndDateMonth'] as number | null) || null,
    endDateDay: (props['EndDateDay'] as number | null) || null
  };
}

export async function runImport(
  dataDir: string,
  flags: { eruptions?: boolean; activity?: boolean } = {}
): Promise<{ total: number; holocene: number; pleistocene: number }> {
  const includeEruptions = flags.eruptions === true;
  const includeActivity = flags.activity === true;

  console.log('Importing volcano data from GVP WFS API…\n');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const [holoceneData, pleistoceneData] = await Promise.all([
    fetchGeoJSON(ENDPOINTS.holoceneVolcanoes, 'Holocene volcanoes'),
    fetchGeoJSON(ENDPOINTS.pleistoceneVolcanoes, 'Pleistocene volcanoes')
  ]);

  const holoceneVolcanoes = holoceneData.features.map((f) => mapHolocene(f.properties));
  const pleistoceneVolcanoes = pleistoceneData.features.map((f) => mapPleistocene(f.properties));
  const allVolcanoes = [...holoceneVolcanoes, ...pleistoceneVolcanoes];

  const volcanoesPath = path.join(dataDir, 'volcanoes.json');
  fs.writeFileSync(volcanoesPath, JSON.stringify(allVolcanoes, null, 2), 'utf8');

  console.log('\nVolcano import complete:');
  console.log(`  Holocene:    ${holoceneVolcanoes.length}`);
  console.log(`  Pleistocene: ${pleistoceneVolcanoes.length}`);
  console.log(`  Total:       ${allVolcanoes.length}`);
  console.log(`  Written to:  ${volcanoesPath}`);

  if (includeEruptions) {
    const eruptionsData = await fetchGeoJSON(ENDPOINTS.holoceneEruptions, 'Holocene eruptions');
    const eruptions = eruptionsData.features.map((f) => mapEruption(f.properties));
    const eruptionsPath = path.join(dataDir, 'eruptions.json');
    fs.writeFileSync(eruptionsPath, JSON.stringify(eruptions, null, 2), 'utf8');
    console.log('\nEruption import complete:');
    console.log(`  Eruptions:  ${eruptions.length}`);
    console.log(`  Written to: ${eruptionsPath}`);
  }

  if (includeActivity) {
    const e3Data = await fetchGeoJSON(ENDPOINTS.eruptionsSince1960, 'eruptions since 1960 (global activity)');
    const continuing = e3Data.features
      .filter((f) => f.properties['ContinuingEruption'] === 'True')
      .map((f) => mapContinuingEruption(f.properties))
      .sort((a, b) => (b.startDateYear || 0) - (a.startDateYear || 0));

    const snapshot = {
      fetchedUtc: new Date().toISOString(),
      continuingEruptions: continuing,
      totalEruptionsSince1960: e3Data.features.length
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

const isCli =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const args = process.argv.slice(2);
  const includeEruptions = args.includes('--eruptions');
  const includeActivity = args.includes('--activity');
  const dataDirIdx = args.indexOf('--data-dir');
  const dataDir =
    dataDirIdx >= 0 && args[dataDirIdx + 1]
      ? args[dataDirIdx + 1]
      : path.join(__dirname, '..', 'data');

  runImport(dataDir, { eruptions: includeEruptions, activity: includeActivity }).catch((err: unknown) => {
    console.error('Import failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
