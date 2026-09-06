/**
 * Domain records this addon stores. Host types (WikiEngine, JobContext, …)
 * come from ngdpbase; these are ours.
 */

export interface VolcanoRecord {
  volcanoNumber: number;
  volcanoName: string;
  country: string;
  volcanicRegionGroup: string;
  volcanicRegion: string;
  volcanoLandform: string;
  primaryVolcanoType: string;
  activityEvidence: string;
  lastKnownEruption: string;
  latitude: number;
  longitude: number;
  elevation: number;
  dominantRockType: string;
  tectonicSetting: string;
  epoch: 'Holocene' | 'Pleistocene' | string;
  geologicalSummary?: string;
  primaryPhotoLink?: string;
  primaryPhotoCaption?: string;
  primaryPhotoCredit?: string;
}

export interface EruptionRecord {
  volcanoNumber: number;
  volcanoName: string;
  eruptionNumber?: number;
  activityType?: string;
  activityArea?: string;
  explosivityIndexMax?: number;
  startDateYear?: number;
  startDateYearUncertainty?: number;
  startDateMonth?: number | null;
  startDateDay?: number | null;
  startEvidenceMethod?: string;
}

export interface VolcanoSearchFilters {
  query?: string;
  country?: string;
  region?: string;
  volcanoType?: string;
  rockType?: string;
  tectonicSetting?: string;
  epoch?: string;
  minElevation?: number;
  maxElevation?: number;
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
  limit?: number;
  offset?: number;
}

export interface NearestVolcano {
  volcanoNumber: number;
  volcanoName: string;
  distanceKm: number;
}

export interface EarthquakeRecord {
  id: string;
  magnitude: number;
  magnitudeType: string;
  place: string;
  time: string;
  updated: string;
  url: string;
  latitude: number;
  longitude: number;
  depth: number;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  tsunami: boolean;
  significance: number;
  status: string;
  type: string;
  title: string;
  nearestVolcano?: NearestVolcano;
}

export interface EarthquakeSearchFilters {
  minMagnitude?: number;
  maxMagnitude?: number;
  minDepth?: number;
  maxDepth?: number;
  nearVolcano?: boolean;
  tsunamiOnly?: boolean;
  alert?: string;
  volcanoNumber?: number;
  limit?: number;
  offset?: number;
}

export interface HansAlert {
  volcanoNumber: string | number;
  volcanoName: string;
  alertLevel: string;
  colorCode: string;
  synopsis: string;
  observatory: string;
  observatoryAbbr: string;
  sentUtc?: string;
  noticeUrl: string;
  previousAlertLevel?: string | null;
  previousColorCode?: string | null;
}

export interface HansStatus {
  fetchedUtc: string | null;
  monitoredCount: number;
  elevatedCount: number;
}

export interface HansFilters {
  alertLevel?: string;
  colorCode?: string;
  observatory?: string;
}

/** Minimal FeedManager surface used by VAAC / FIRMS plugins. */
export interface FeedRecord {
  properties: Record<string, unknown>;
  fetchedAt: string;
}

export interface FeedManagerLike {
  getRecords(sourceId: string): Promise<FeedRecord[]>;
  getSourceIds(): string[];
}

export function asParamString(value: string | number | boolean | undefined): string | undefined {
  if (value === undefined || value === false) return undefined;
  const s = String(value);
  return s === '' ? undefined : s;
}

export function escHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
