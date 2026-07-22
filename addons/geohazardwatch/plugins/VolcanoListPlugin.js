'use strict';

/**
 * VolcanoListPlugin
 *
 * Renders a paginated table of volcanoes inline in a page.
 *
 * Usage:
 *   [{VolcanoList country='United States'}]
 *   [{VolcanoList region='Alaska Peninsula and Aleutian Islands' limit='20'}]
 *   [{VolcanoList epoch='Holocene' volcanoType='Stratovolcano' limit='10'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'VolcanoList',

  /**
   * @param {{ engine: import('../../../src/types/WikiEngine').WikiEngine }} context
   * @param {Record<string, string>} params
   * @returns {string}
   */
  execute(context, params) {
    const mgr = context.engine.getManager('VolcanoDataManager');
    if (!mgr) {
      return '<span class="plugin-error">VolcanoList: VolcanoDataManager not available</span>';
    }

    const limit  = Number(params.limit)  || 25;
    const offset = Number(params.offset) || 0;

    const filters = {
      query:           params.query           || undefined,
      country:         params.country         || undefined,
      region:          params.region          || undefined,
      volcanoType:     params.volcanoType     || undefined,
      rockType:        params.rockType        || undefined,
      tectonicSetting: params.tectonicSetting || undefined,
      epoch:           params.epoch           || undefined,
      limit,
      offset,
    };

    const { volcanoes, total } = mgr.search(filters);

    if (volcanoes.length === 0) {
      return '<p class="vl-empty">No volcanoes match the specified criteria.</p>';
    }

    // Build API filter params (exclude undefined values)
    const apiFilters = {};
    if (filters.query)           apiFilters.query           = filters.query;
    if (filters.country)         apiFilters.country         = filters.country;
    if (filters.region)          apiFilters.region          = filters.region;
    if (filters.volcanoType)     apiFilters.volcanoType     = filters.volcanoType;
    if (filters.rockType)        apiFilters.rockType        = filters.rockType;
    if (filters.tectonicSetting) apiFilters.tectonicSetting = filters.tectonicSetting;
    if (filters.epoch)           apiFilters.epoch           = filters.epoch;

    const wid = 'vl-' + Math.random().toString(36).slice(2, 9);

    const rows = buildRows(volcanoes);
    const caption = formatCaption(offset, volcanoes.length, total, 'volcano', 'volcanoes');
    const prevDisabled = offset === 0 ? ' disabled' : '';
    const nextDisabled = offset + limit >= total ? ' disabled' : '';

    return `
<div class="volcano-list" id="${wid}">
  <table class="vl-table">
    <thead>
      <tr>
        <th>GVP #</th><th>Name</th><th>Country</th><th>Region</th>
        <th>Type</th><th>Epoch</th><th>Elev (m)</th><th>Last Eruption</th>
      </tr>
    </thead>
    <tbody id="${wid}-tbody">${rows}</tbody>
  </table>
  <div class="vl-pagination">
    <button class="vl-page-btn" id="${wid}-prev"${prevDisabled}>&#8592; Prev</button>
    <span class="vl-caption" id="${wid}-caption">${esc(caption)}</span>
    <button class="vl-page-btn" id="${wid}-next"${nextDisabled}>Next &#8594;</button>
  </div>
</div>
<script>
(function () {
  var wid = ${JSON.stringify(wid)};
  var limit = ${limit};
  var offset = ${offset};
  var total = ${total};
  var apiFilters = ${JSON.stringify(apiFilters)};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildRows(volcanoes) {
    return volcanoes.map(function (v) {
      var gvpUrl = 'https://volcano.si.edu/volcano.cfm?vn=' + v.volcanoNumber;
      return '<tr>' +
        '<td><a href="' + gvpUrl + '" target="_blank" rel="noopener">' + esc(v.volcanoNumber) + '</a></td>' +
        '<td>' + esc(v.volcanoName) + '</td>' +
        '<td>' + esc(v.country) + '</td>' +
        '<td>' + esc(v.volcanicRegion) + '</td>' +
        '<td>' + esc(v.primaryVolcanoType) + '</td>' +
        '<td>' + esc(v.epoch) + '</td>' +
        '<td>' + (v.elevation != null ? esc(v.elevation) : '') + '</td>' +
        '<td>' + esc(v.lastKnownEruption) + '</td>' +
        '</tr>';
    }).join('');
  }

  function goTo(newOffset) {
    var params = Object.assign({}, apiFilters, { limit: limit, offset: newOffset });
    fetch('/api/geohazardwatch/search?' + new URLSearchParams(params))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        offset = newOffset;
        total = data.total;
        document.getElementById(wid + '-tbody').innerHTML = buildRows(data.volcanoes);
        var showing = offset + data.volcanoes.length;
        var caption = total > data.volcanoes.length
          ? 'Showing ' + (offset + 1) + '\u2013' + showing + ' of ' + total
          : total + ' volcano' + (total !== 1 ? 's' : '');
        document.getElementById(wid + '-caption').textContent = caption;
        document.getElementById(wid + '-prev').disabled = offset === 0;
        document.getElementById(wid + '-next').disabled = offset + limit >= total;
        document.getElementById(wid).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(function (err) { console.error('VolcanoList fetch error:', err); });
  }

  document.getElementById(wid + '-prev').onclick = function () { goTo(Math.max(0, offset - limit)); };
  document.getElementById(wid + '-next').onclick = function () { goTo(offset + limit); };
})();
</script>`.trim();
  }
};

function buildRows(volcanoes) {
  return volcanoes.map(v => {
    const gvpUrl = `https://volcano.si.edu/volcano.cfm?vn=${v.volcanoNumber}`;
    return `
  <tr>
    <td><a href="${gvpUrl}" target="_blank" rel="noopener">${esc(String(v.volcanoNumber))}</a></td>
    <td>${esc(v.volcanoName)}</td>
    <td>${esc(v.country)}</td>
    <td>${esc(v.volcanicRegion)}</td>
    <td>${esc(v.primaryVolcanoType)}</td>
    <td>${esc(v.epoch)}</td>
    <td>${v.elevation != null ? esc(String(v.elevation)) : ''}</td>
    <td>${esc(v.lastKnownEruption)}</td>
  </tr>`;
  }).join('');
}

function formatCaption(offset, count, total, singular, plural) {
  if (total > count) {
    return `Showing ${offset + 1}\u2013${offset + count} of ${total}`;
  }
  return `${total} ${total !== 1 ? plural : singular}`;
}

/** @param {string} str */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
