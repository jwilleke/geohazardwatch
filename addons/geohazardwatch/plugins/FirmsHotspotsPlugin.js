'use strict';

/**
 * FirmsHotspotsPlugin
 *
 * Renders volcanoes currently showing a NASA FIRMS thermal anomaly within
 * PROXIMITY_KM of the summit. FIRMS itself is ingested by ngdpbase's generic
 * `feeds` addon (adapter: 'csv', source id configurable via `source` param,
 * default 'firms-viirs') — this plugin does NOT fetch/import/schedule
 * anything itself. It only reads already-ingested records via
 * `FeedManager.getRecords()` and joins them against the volcano catalog.
 *
 * That join (~59k global hotspots × ~2,600 volcanoes) has no home in the
 * feeds addon's per-record adapter contract (see geohazardwatch#4, ngdpbase#911)
 * — it happens here, at render time, with the result cached and only
 * recomputed when the feed's `fetchedAt` actually advances (i.e. once per
 * poll interval, not once per page view).
 *
 * Usage:
 *   [{FirmsHotspots}]
 *   [{FirmsHotspots source='firms-viirs' limit='10'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */

const PROXIMITY_KM = 5;
const GRID_DEGREES = 1; // ≈111 km at the equator — comfortably larger than PROXIMITY_KM

/** @type {{ fetchedAt: string, results: object[] } | null} */
let cache = null;

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

function gridKey(lat, lon) {
  return `${Math.round(lat / GRID_DEGREES)},${Math.round(lon / GRID_DEGREES)}`;
}

/** Bucket volcanoes by ~1° grid cell so each hotspot only checks nearby cells. */
function buildVolcanoGrid(volcanoes) {
  const grid = new Map();
  for (const v of volcanoes) {
    const key = gridKey(v.latitude, v.longitude);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(v);
  }
  return grid;
}

function findNearestVolcano(lat, lon, grid) {
  const cellLat = Math.round(lat / GRID_DEGREES);
  const cellLon = Math.round(lon / GRID_DEGREES);
  let nearest = null;
  for (let dLat = -1; dLat <= 1; dLat++) {
    for (let dLon = -1; dLon <= 1; dLon++) {
      const candidates = grid.get(`${cellLat + dLat},${cellLon + dLon}`);
      if (!candidates) continue;
      for (const v of candidates) {
        const dist = distanceKm(lat, lon, v.latitude, v.longitude);
        if (dist <= PROXIMITY_KM && (!nearest || dist < nearest.distanceKm)) {
          nearest = { volcanoNumber: v.volcanoNumber, volcanoName: v.volcanoName, distanceKm: Math.round(dist * 10) / 10 };
        }
      }
    }
  }
  return nearest;
}

/** Volcanoes currently showing a hotspot, strongest FRP first. Cached per feed refresh. */
async function computeActiveVolcanoes(feedManager, volcanoManager, sourceId) {
  const records = await feedManager.getRecords(sourceId);
  if (records.length === 0) return { fetchedAt: '', results: [] };

  const latestFetchedAt = records.reduce((max, r) => (r.fetchedAt > max ? r.fetchedAt : max), '');
  if (cache && cache.sourceId === sourceId && cache.fetchedAt === latestFetchedAt) {
    return cache;
  }

  const allVolcanoes = volcanoManager.search({ limit: volcanoManager.volcanoCount() }).volcanoes;
  const grid = buildVolcanoGrid(allVolcanoes);

  const byVolcano = new Map();
  for (const r of records) {
    const p = r.properties;
    const lat = Number(p.latitude);
    const lon = Number(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const nearest = findNearestVolcano(lat, lon, grid);
    if (!nearest) continue;

    const frp = Number(p.frp) || 0;
    const existing = byVolcano.get(nearest.volcanoNumber);
    if (!existing || frp > existing.frp) {
      byVolcano.set(nearest.volcanoNumber, {
        volcanoNumber: nearest.volcanoNumber,
        volcanoName: nearest.volcanoName,
        distanceKm: nearest.distanceKm,
        frp,
        confidence: p.confidence ?? null,
        acqDateUtc: p.acq_date && p.acq_time
          ? `${p.acq_date}T${String(p.acq_time).padStart(4, '0').replace(/^(\d{2})(\d{2})$/, '$1:$2')}:00Z`
          : null
      });
    }
  }

  const results = [...byVolcano.values()].sort((a, b) => b.frp - a.frp);
  cache = { sourceId, fetchedAt: latestFetchedAt, results };
  return cache;
}

module.exports = {
  name: 'FirmsHotspots',

  async execute(context, params) {
    const feedManager = context.engine.getManager('FeedManager');
    const volcanoManager = context.engine.getManager('VolcanoDataManager');
    if (!feedManager) {
      return '<span class="plugin-error">FirmsHotspots: FeedManager not available — enable the feeds addon</span>';
    }
    if (!volcanoManager) {
      return '<span class="plugin-error">FirmsHotspots: VolcanoDataManager not available</span>';
    }

    const sourceId = params.source || 'firms-viirs';
    if (!feedManager.getSourceIds().includes(sourceId)) {
      return `<span class="plugin-error">FirmsHotspots: source '${escapeHtml(sourceId)}' not configured — add ngdpbase.addons.feeds.sources.${escapeHtml(sourceId)}.*</span>`;
    }

    const active = await computeActiveVolcanoes(feedManager, volcanoManager, sourceId);

    let volcanoes = active.results;
    const limit = params.limit !== undefined ? parseInt(params.limit, 10) : 0;
    if (limit > 0) volcanoes = volcanoes.slice(0, limit);

    const lastUpdated = active.fetchedAt ? new Date(active.fetchedAt).toUTCString() : 'unknown';

    if (volcanoes.length === 0) {
      return `
        <div class="firms-hotspots firms-hotspots--none">
          <p class="firms-all-clear">No thermal anomalies detected near a known volcano.</p>
          <p class="firms-meta">NASA FIRMS. Last updated: ${lastUpdated}</p>
        </div>`;
    }

    const rows = volcanoes.map(h => {
      const gvpUrl = `<a href="https://volcano.si.edu/volcano.cfm?vn=${h.volcanoNumber}" target="_blank" rel="noopener">${escapeHtml(h.volcanoName)}</a>`;
      return `
        <tr class="firms-row">
          <td>${gvpUrl}</td>
          <td>${h.distanceKm} km</td>
          <td><span class="firms-frp">${h.frp} MW</span></td>
          <td>${h.confidence ?? '—'}</td>
          <td>${h.acqDateUtc ? new Date(h.acqDateUtc).toUTCString() : 'unknown'}</td>
        </tr>`;
    }).join('');

    return `
      <div class="firms-hotspots">
        <table class="firms-table">
          <thead>
            <tr>
              <th>Volcano</th>
              <th>Distance</th>
              <th>Radiative Power</th>
              <th>Confidence</th>
              <th>Detected (UTC)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="firms-meta">NASA FIRMS — ${volcanoes.length} volcano(es) with a thermal anomaly.
          Last updated: ${lastUpdated}. Satellite-detected heat, not a confirmed eruption — cross-check with VolcanoInfobox/HansAlerts.</p>
      </div>`;
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
