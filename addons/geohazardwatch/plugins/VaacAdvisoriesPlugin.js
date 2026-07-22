'use strict';

/**
 * VaacAdvisoriesPlugin
 *
 * Renders a table of active Volcanic Ash Advisories from the Washington
 * VAAC (Americas, E. Pacific, Caribbean — see geohazardwatch#5 for the
 * other 8 ICAO VAACs, not yet integrated).
 *
 * Usage:
 *   [{VaacAdvisories}]
 *   [{VaacAdvisories region='GUATEMALA'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'VaacAdvisories',

  execute(context, params) {
    const mgr = context.engine.getManager('VaacDataManager');
    if (!mgr) {
      return '<span class="plugin-error">VaacAdvisories: VaacDataManager not available — run npm run import:vaac</span>';
    }

    const filters = {};
    if (params.region) filters.region = params.region;
    if (params.vaac)   filters.vaac   = params.vaac;

    const advisories = mgr.getActive(filters);
    const status = mgr.status();
    const lastUpdated = status.fetchedUtc ? new Date(status.fetchedUtc).toUTCString() : 'unknown';

    if (advisories.length === 0) {
      const noAdvisoryMsg = Object.keys(filters).length > 0
        ? 'No active advisories match the specified criteria.'
        : 'No active volcanic ash advisories.';
      return `
        <div class="vaac-advisories vaac-advisories--none">
          <p class="vaac-all-clear">${noAdvisoryMsg}</p>
          <p class="vaac-meta">Washington VAAC. Last updated: ${lastUpdated}</p>
        </div>`;
    }

    const rows = advisories.map(a => {
      const gvpUrl = a.matchedVolcanoNumber
        ? `<a href="https://volcano.si.edu/volcano.cfm?vn=${a.matchedVolcanoNumber}" target="_blank" rel="noopener">${escapeHtml(a.volcanoName)}</a>`
        : escapeHtml(a.volcanoName);
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
        <p class="vaac-meta">Washington VAAC — ${advisories.length} active advisor${advisories.length === 1 ? 'y' : 'ies'}.
          Last updated: ${lastUpdated}</p>
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
