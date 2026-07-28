'use strict';

/**
 * VaacAdvisoriesPlugin
 *
 * Renders a table of active Volcanic Ash Advisories from the Washington
 * VAAC (Americas, E. Pacific, Caribbean — see geohazardwatch#5 for the
 * other 8 ICAO VAACs, not yet integrated).
 *
 * Reads from the ngdpbase `feeds` addon's `vaac-advisories` source
 * (adapter: 'xml-index') via FeedManager — see docs/volcano-sources.md
 * for the source config. This addon does its own fetching for nothing;
 * FeedManager owns polling, change-detection and the per-volcano
 * latest-only / 48h-staleness shaping (`dedupeBy`/`maxAgeHours`, #989).
 *
 * One piece the generic adapter can't do: each advisory's volcano name
 * arrives from NOAA as a single combined field — e.g. "FUEGO 342090" —
 * embedding the GVP catalog number with no separate tag to map. The
 * `xml`/`xml-index` adapters only support structural dot-path field
 * extraction (see ngdpbase's `getByPath`), not string transforms, so
 * that split has to happen here, at render time, rather than in feed
 * config (#141).
 *
 * Usage:
 *   [{VaacAdvisories}]
 *   [{VaacAdvisories region='GUATEMALA'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */

/** "FUEGO 342090" -> { name: 'FUEGO', gvpNumber: 342090 }. No match: name only. */
function splitVolcanoName(raw) {
  const s = String(raw || '');
  const m = /^(.*\S)\s+(\d{4,6})$/.exec(s);
  return m ? { name: m[1], gvpNumber: Number(m[2]) } : { name: s, gvpNumber: null };
}

module.exports = {
  name: 'VaacAdvisories',

  async execute(context, params) {
    const feedManager = context.engine.getManager('FeedManager');
    if (!feedManager?.getRecords) {
      return '<span class="plugin-error">VaacAdvisories: feeds addon not available</span>';
    }

    const records = await feedManager.getRecords('vaac-advisories');

    const filters = {};
    if (params.region) filters.region = params.region;

    const advisories = records
      .map(r => r.properties)
      .filter(a => !filters.region || (a.region || '').toUpperCase() === filters.region.toUpperCase());

    const lastUpdated = records.length
      ? new Date(Math.max(...records.map(r => new Date(r.fetchedAt).getTime()))).toUTCString()
      : null;

    if (advisories.length === 0) {
      const noAdvisoryMsg = Object.keys(filters).length > 0
        ? 'No active advisories match the specified criteria.'
        : 'No active volcanic ash advisories.';
      return `
        <div class="vaac-advisories vaac-advisories--none">
          <p class="vaac-all-clear">${noAdvisoryMsg}</p>
        </div>`;
    }

    const rows = advisories.map(a => {
      const { name: volcanoName, gvpNumber } = splitVolcanoName(a.volcanoName);
      const gvpUrl = gvpNumber
        ? `<a href="https://volcano.si.edu/volcano.cfm?vn=${gvpNumber}" target="_blank" rel="noopener">${escapeHtml(volcanoName)}</a>`
        : escapeHtml(volcanoName);
      const motion = (a.directionOfMotionDeg != null && a.speedOfMotionKt != null)
        ? `${a.directionOfMotionDeg}° @ ${a.speedOfMotionKt} kt`
        : '—';

      return `
        <tr class="vaac-row">
          <td>${gvpUrl}</td>
          <td>${escapeHtml(a.region || '')}</td>
          <td><span class="vaac-fl">FL${a.ashCloudTopFl ?? '?'}</span></td>
          <td>${motion}</td>
          <td>${a.issueTimeUtc ? new Date(a.issueTimeUtc).toUTCString() : 'unknown'}</td>
          <td><a href="${a.sourceXmlUrl}" target="_blank" rel="noopener">Advisory ${escapeHtml(a.advisoryNumber || '')}</a></td>
        </tr>
        ${a.remarks ? `<tr class="vaac-remarks-row"><td colspan="6" class="vaac-remarks">${escapeHtml(a.remarks)}</td></tr>` : ''}`;
    }).join('');

    return `
      <div class="vaac-advisories">
        <table class="vaac-table">
          <thead>
            <tr>
              <th>Volcano</th>
              <th>Region</th>
              <th>Ash Top</th>
              <th>Cloud Motion</th>
              <th>Issued (UTC)</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="vaac-meta">Washington VAAC — ${advisories.length} active advisor${advisories.length === 1 ? 'y' : 'ies'}.${lastUpdated ? ` Last updated: ${lastUpdated}.` : ''}</p>
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
