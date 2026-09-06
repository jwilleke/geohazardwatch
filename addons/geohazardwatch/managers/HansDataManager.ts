import fs from 'fs';
import path from 'path';
import type { HansAlert, HansFilters, HansStatus } from '../lib/types.js';

class HansDataManager {
  dataPath: string;
  alertsByNumber: Map<string, HansAlert>;
  fetchedUtc: string | null;
  monitoredCount: number;
  elevatedCount: number;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
    this.alertsByNumber = new Map();
    this.fetchedUtc = null;
    this.monitoredCount = 0;
    this.elevatedCount = 0;
  }

  async load(): Promise<void> {
    const file = path.join(this.dataPath, 'activity.json');
    if (!fs.existsSync(file)) return;

    const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      fetchedUtc?: string;
      monitoredCount?: number;
      elevatedCount?: number;
      elevatedVolcanoes?: HansAlert[];
    };
    this.fetchedUtc = snapshot.fetchedUtc ?? null;
    this.monitoredCount = snapshot.monitoredCount ?? 0;
    this.elevatedCount = snapshot.elevatedCount ?? 0;

    this.alertsByNumber.clear();
    for (const alert of snapshot.elevatedVolcanoes ?? []) {
      if (alert.volcanoNumber) {
        this.alertsByNumber.set(String(alert.volcanoNumber), alert);
      }
    }
  }

  count(): number {
    return this.alertsByNumber.size;
  }

  getAlert(volcanoNumber: string | number): HansAlert | null {
    return this.alertsByNumber.get(String(volcanoNumber)) ?? null;
  }

  getElevated(filters: HansFilters = {}): HansAlert[] {
    let results = [...this.alertsByNumber.values()];

    if (filters.alertLevel) {
      const want = filters.alertLevel.toUpperCase();
      results = results.filter((a) => a.alertLevel?.toUpperCase() === want);
    }
    if (filters.colorCode) {
      const want = filters.colorCode.toUpperCase();
      results = results.filter((a) => a.colorCode?.toUpperCase() === want);
    }
    if (filters.observatory) {
      const want = filters.observatory.toLowerCase();
      results = results.filter((a) => a.observatoryAbbr?.toLowerCase() === want);
    }

    return results;
  }

  toMarqueeText(options: Record<string, string> = {}): string {
    const { limit, alertLevel, colorCode, observatory } = options;
    const order: Record<string, number> = { WARNING: 0, WATCH: 1, ADVISORY: 2 };
    let alerts = [...this.alertsByNumber.values()].sort(
      (a, b) => (order[a.alertLevel] ?? 9) - (order[b.alertLevel] ?? 9)
    );

    if (alertLevel) {
      alerts = alerts.filter((a) => a.alertLevel?.toUpperCase() === alertLevel.toUpperCase());
    }
    if (colorCode) {
      alerts = alerts.filter((a) => a.colorCode?.toUpperCase() === colorCode.toUpperCase());
    }
    if (observatory) {
      alerts = alerts.filter((a) => a.observatoryAbbr?.toLowerCase() === observatory.toLowerCase());
    }

    const n = limit !== undefined ? parseInt(limit, 10) : 0;
    if (n > 0) alerts = alerts.slice(0, n);

    if (alerts.length === 0) return 'No US volcanoes currently elevated above NORMAL.';
    return (
      'VOLCANO ALERTS: ' +
      alerts.map((a) => `${a.volcanoName} \u2014 ${a.alertLevel} (${a.colorCode})`).join('  \u2022  ')
    );
  }

  status(): HansStatus {
    return {
      fetchedUtc: this.fetchedUtc,
      monitoredCount: this.monitoredCount,
      elevatedCount: this.elevatedCount
    };
  }
}

export default HansDataManager;
