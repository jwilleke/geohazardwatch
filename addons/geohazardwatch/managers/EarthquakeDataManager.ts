import fs from 'fs';
import path from 'path';
import type { EarthquakeRecord, EarthquakeSearchFilters } from '../lib/types.js';

class EarthquakeDataManager {
  dataPath: string;
  earthquakes: EarthquakeRecord[];
  fetchedUtc: string | null;
  feed: string | null;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
    this.earthquakes = [];
    this.fetchedUtc = null;
    this.feed = null;
  }

  async load(): Promise<void> {
    const file = path.join(this.dataPath, 'earthquakes.json');
    if (!fs.existsSync(file)) return;

    const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      earthquakes?: EarthquakeRecord[];
      fetchedUtc?: string;
      feed?: string;
    };
    this.earthquakes = snapshot.earthquakes ?? [];
    this.fetchedUtc = snapshot.fetchedUtc ?? null;
    this.feed = snapshot.feed ?? null;
  }

  count(): number {
    return this.earthquakes.length;
  }

  nearVolcanoCount(): number {
    return this.earthquakes.filter((e) => e.nearestVolcano).length;
  }

  search(filters: EarthquakeSearchFilters = {}): {
    earthquakes: EarthquakeRecord[];
    total: number;
    filters: EarthquakeSearchFilters;
  } {
    const matched = this.earthquakes.filter((e) => {
      if (filters.minMagnitude != null && e.magnitude < filters.minMagnitude) return false;
      if (filters.maxMagnitude != null && e.magnitude > filters.maxMagnitude) return false;
      if (filters.minDepth != null && e.depth < filters.minDepth) return false;
      if (filters.maxDepth != null && e.depth > filters.maxDepth) return false;
      if (filters.tsunamiOnly && !e.tsunami) return false;
      if (filters.nearVolcano && !e.nearestVolcano) return false;
      if (filters.alert && e.alert !== filters.alert) return false;
      if (
        filters.volcanoNumber != null &&
        e.nearestVolcano?.volcanoNumber !== Number(filters.volcanoNumber)
      ) {
        return false;
      }
      return true;
    });

    const offset = Number(filters.offset) || 0;
    const limit = Number(filters.limit) || 100;
    return { earthquakes: matched.slice(offset, offset + limit), total: matched.length, filters };
  }

  nearVolcano(volcanoNumber: number): EarthquakeRecord[] {
    const n = Number(volcanoNumber);
    return this.earthquakes.filter((e) => e.nearestVolcano?.volcanoNumber === n);
  }
}

export default EarthquakeDataManager;
