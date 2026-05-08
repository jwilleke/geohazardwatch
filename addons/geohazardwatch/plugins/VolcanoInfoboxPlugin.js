'use strict';

/**
 * VolcanoInfoboxPlugin
 *
 * Renders a structured infobox for a single volcano by GVP volcano number.
 *
 * Usage in wiki markup:
 *   [{VolcanoInfobox number='211060'}]
 *   [{VolcanoInfobox number='211060' style='compact'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'VolcanoInfobox',

  /**
   * @param {{ engine: import('../../../src/types/WikiEngine').WikiEngine }} context
   * @param {{ number?: string, style?: string }} params
   * @returns {string}
   */
  execute(context, params) {
    const number = params.number || '';
    if (!number) {
      return '<span class="plugin-error">VolcanoInfobox: number parameter is required</span>';
    }

    const mgr = context.engine.getManager('VolcanoDataManager');
    if (!mgr) {
      return '<span class="plugin-error">VolcanoInfobox: VolcanoDataManager not available</span>';
    }

    const v = mgr.getByNumber(Number(number));
    if (!v) {
      return `<span class="plugin-error">VolcanoInfobox: volcano not found (number=${esc(number)})</span>`;
    }

    if (params.style === 'compact') {
      return renderCompact(v);
    }

    return renderFull(v);
  }
};

function renderFull(v) {
  const photo = v.primaryPhotoLink
    ? `<div class="vib-photo"><img src="${esc(v.primaryPhotoLink)}" alt="${esc(v.volcanoName)}"${v.primaryPhotoCaption ? ` title="${esc(v.primaryPhotoCaption)}"` : ''}></div>`
    : '';

  const gvpUrl = `https://volcano.si.edu/volcano.cfm?vn=${v.volcanoNumber}`;
  const rows = [
    ['GVP Number', `<a href="${gvpUrl}" target="_blank" rel="noopener">${esc(String(v.volcanoNumber))}</a>`],
    ['Country',        v.country],
    ['Region',         v.volcanicRegion],
    ['Region Group',   v.volcanicRegionGroup],
    ['Type',           v.primaryVolcanoType],
    ['Landform',       v.volcanoLandform],
    ['Epoch',          v.epoch],
    ['Elevation',      v.elevation != null ? `${v.elevation} m` : ''],
    ['Coordinates',    `${v.latitude}, ${v.longitude}`],
    ['Rock Type',      v.dominantRockType],
    ['Tectonic',       v.tectonicSetting],
    ['Activity',       v.activityEvidence],
    ['Last Eruption',  v.lastKnownEruption],
  ].filter(([, val]) => val).map(([label, val]) => {
    // GVP Number row contains a pre-built anchor — render it raw
    const tdContent = label === 'GVP Number' ? String(val) : esc(String(val));
    return `<tr><th>${esc(String(label))}</th><td>${tdContent}</td></tr>`;
  }).join('\n');

  const summary = v.geologicalSummary
    ? `<div class="vib-summary"><p>${esc(v.geologicalSummary)}</p></div>`
    : '';

  const credit = v.primaryPhotoCredit
    ? `<div class="vib-photo-credit">Photo: ${esc(v.primaryPhotoCredit)}</div>`
    : '';

  return `
<div class="volcano-infobox">
  ${photo}
  <div class="vib-title">${esc(v.volcanoName)}</div>
  <table class="vib-table">
    <tbody>${rows}</tbody>
  </table>
  ${summary}
  ${credit}
</div>`.trim();
}

function renderCompact(v) {
  return `<span class="volcano-inline" title="${esc(v.country)}, ${esc(v.volcanicRegion)}">${esc(v.volcanoName)}</span>`;
}

/** @param {string} str */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
