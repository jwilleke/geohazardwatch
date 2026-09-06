import fs from 'fs';
import path from 'path';
import type { EruptionRecord, VolcanoRecord, VolcanoSearchFilters } from '../lib/types.js';

class VolcanoDataManager {
  dataPath: string;
  volcanoes: Map<number, VolcanoRecord>;
  eruptions: EruptionRecord[];

  constructor(dataPath: string) {
    this.dataPath = dataPath;
    this.volcanoes = new Map();
    this.eruptions = [];
  }

  async load(): Promise<void> {
    const volcanoesFile = path.join(this.dataPath, 'volcanoes.json');
    const eruptionsFile = path.join(this.dataPath, 'eruptions.json');

    if (fs.existsSync(volcanoesFile)) {
      const arr = JSON.parse(fs.readFileSync(volcanoesFile, 'utf8')) as VolcanoRecord[];
      this.volcanoes.clear();
      for (const v of arr) {
        this.volcanoes.set(v.volcanoNumber, v);
      }
    }

    if (fs.existsSync(eruptionsFile)) {
      this.eruptions = JSON.parse(fs.readFileSync(eruptionsFile, 'utf8')) as EruptionRecord[];
    }
  }

  volcanoCount(): number {
    return this.volcanoes.size;
  }

  eruptionCount(): number {
    return this.eruptions.length;
  }

  getByNumber(volcanoNumber: number): VolcanoRecord | undefined {
    return this.volcanoes.get(Number(volcanoNumber));
  }

  search(filters: VolcanoSearchFilters = {}): {
    volcanoes: VolcanoRecord[];
    total: number;
    filters: VolcanoSearchFilters;
  } {
    const all = Array.from(this.volcanoes.values());
    const matched = all.filter((v) => matchesFilters(v, filters));
    const offset = Number(filters.offset) || 0;
    const limit = Number(filters.limit) || 100;
    return { volcanoes: matched.slice(offset, offset + limit), total: matched.length, filters };
  }

  distinctValues(field: string): string[] {
    const values = new Set<string>();
    for (const v of this.volcanoes.values()) {
      const val = String((v as unknown as Record<string, unknown>)[field] ?? '').trim();
      if (val) values.add(val);
    }
    return Array.from(values).sort();
  }

  getEruptions(volcanoNumber: number): EruptionRecord[] {
    const n = Number(volcanoNumber);
    return this.eruptions.filter((e) => e.volcanoNumber === n);
  }
}

function matchesText(value: unknown, query: string): boolean {
  return String(value ?? '').toLowerCase().includes(query.toLowerCase());
}

function matchesExact(value: unknown, filter: string | undefined): boolean {
  if (!filter) return true;
  return String(value ?? '').toLowerCase() === filter.toLowerCase();
}

function matchesRange(value: unknown, min: number | undefined, max: number | undefined): boolean {
  const n = Number(value);
  if (min !== undefined && n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
}

function matchesFilters(v: VolcanoRecord, filters: VolcanoSearchFilters): boolean {
  if (filters.query) {
    const q = filters.query;
    const hit =
      matchesText(v.volcanoName, q) ||
      matchesText(v.country, q) ||
      matchesText(v.volcanicRegion, q) ||
      matchesText(v.volcanicRegionGroup, q) ||
      matchesText(v.primaryVolcanoType, q) ||
      matchesText(v.dominantRockType, q) ||
      matchesText(v.tectonicSetting, q) ||
      matchesText(v.lastKnownEruption, q) ||
      matchesText(String(v.volcanoNumber), q);
    if (!hit) return false;
  }

  if (!matchesExact(v.country, filters.country)) return false;
  if (!matchesExact(v.volcanicRegion, filters.region)) return false;
  if (!matchesExact(v.primaryVolcanoType, filters.volcanoType)) return false;
  if (!matchesExact(v.dominantRockType, filters.rockType)) return false;
  if (!matchesExact(v.tectonicSetting, filters.tectonicSetting)) return false;
  if (filters.epoch && v.epoch !== filters.epoch) return false;

  if (!matchesRange(v.elevation, filters.minElevation, filters.maxElevation)) return false;
  if (!matchesRange(v.latitude, filters.minLatitude, filters.maxLatitude)) return false;
  if (!matchesRange(v.longitude, filters.minLongitude, filters.maxLongitude)) return false;

  return true;
}

export default VolcanoDataManager;
