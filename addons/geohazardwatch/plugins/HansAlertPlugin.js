'use strict';

/**
 * HansAlertPlugin
 *
 * Renders a table of currently elevated US volcanoes from the USGS HANS API.
 * Colour-coded by aviation color code (GREEN/YELLOW/ORANGE/RED).
 *
 * Usage:
 *   [{HansAlerts}]
 *   [{HansAlerts alertLevel='WATCH'}]
 *   [{HansAlerts colorCode='ORANGE' observatory='avo'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'HansAlerts',

  execute(context, params) {
    const mgr = context.engine.getManager('HansDataManager');
    if (!mgr) {
      return '<span class="plugin-error">HansAlerts: HansDataManager not available — run npm run import:hans</span>';
    }

    const filters = {};
    if (params.alertLevel)  filters.alertLevel  = params.alertLevel;
    if (params.colorCode)   filters.colorCode   = params.colorCode;
    if (params.observatory) filters.observatory = params.observatory;

    const alerts = mgr.getElevated(filters);
    const status = mgr.status();

    if (alerts.length === 0) {
      const noAlertMsg = Object.keys(filters).length > 0
        ? 'No volcanoes match the specified alert criteria.'
        : 'No US volcanoes are currently elevated above NORMAL.';
      return `
        <div class="hans-alerts hans-alerts--none">
          <p class="hans-all-normal">${noAlertMsg}</p>
          <p class="hans-meta">USGS HANS — ${status.monitoredCount} volcanoes monitored.
            Last updated: ${status.fetchedUtc ? new Date(status.fetchedUtc).toUTCString() : 'unknown'}</p>
        </div>`;
    }

    // Sort: WARNING → WATCH → ADVISORY
    const order = { WARNING: 0, WATCH: 1, ADVISORY: 2 };
    alerts.sort((a, b) => (order[a.alertLevel] ?? 9) - (order[b.alertLevel] ?? 9));

    const rows = alerts.map(a => {
      const gvpUrl  = `https://volcano.si.edu/volcano.cfm?vn=${a.volcanoNumber}`;
      const prevBadge = a.previousAlertLevel && a.previousAlertLevel !== a.alertLevel
        ? `<span class="hans-prev">(was ${a.previousAlertLevel})</span>`
        : '';
      const synopsis = a.synopsis
        ? `<div class="hans-synopsis">${escapeHtml(a.synopsis)}</div>`
        : '';

      return `
        <tr class="hans-row hans-row--${a.colorCode.toLowerCase()}">
          <td><a href="${gvpUrl}" target="_blank" rel="noopener">${escapeHtml(a.volcanoName)}</a></td>
          <td><span class="hans-badge hans-badge--${a.colorCode.toLowerCase()}">${a.colorCode}</span></td>
          <td><span class="hans-alert-level hans-level--${a.alertLevel.toLowerCase()}">${a.alertLevel}</span> ${prevBadge}</td>
          <td>${escapeHtml(a.observatory)}</td>
          <td><a href="${a.noticeUrl}" target="_blank" rel="noopener">Notice</a></td>
        </tr>
        ${synopsis ? `<tr class="hans-synopsis-row"><td colspan="5">${synopsis}</td></tr>` : ''}`;
    }).join('');

    return `
      <div class="hans-alerts">
        <table class="hans-table">
          <thead>
            <tr>
              <th>Volcano</th>
              <th>Color Code</th>
              <th>Alert Level</th>
              <th>Observatory</th>
              <th>Notice</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="hans-meta">USGS HANS — ${alerts.length} of ${status.monitoredCount} monitored volcanoes elevated.
          Last updated: ${status.fetchedUtc ? new Date(status.fetchedUtc).toUTCString() : 'unknown'}</p>
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
