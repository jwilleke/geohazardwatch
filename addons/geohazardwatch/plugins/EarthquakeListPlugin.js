'use strict';

/**
 * EarthquakeListPlugin
 *
 * Renders a paginated table of recent earthquakes.
 *
 * Usage:
 *   [{EarthquakeList}]
 *   [{EarthquakeList minMagnitude='5' nearVolcano='true'}]
 *   [{EarthquakeList tsunamiOnly='true' limit='10'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'EarthquakeList',

  execute(context, params) {
    const mgr = context.engine.getManager('EarthquakeDataManager');
    if (!mgr) {
      return '<span class="plugin-error">EarthquakeList: EarthquakeDataManager not available</span>';
    }

    const limit  = Number(params.limit)  || 25;
    const offset = Number(params.offset) || 0;

    const filters = {
      minMagnitude:  params.minMagnitude  ? Number(params.minMagnitude)  : undefined,
      maxMagnitude:  params.maxMagnitude  ? Number(params.maxMagnitude)  : undefined,
      minDepth:      params.minDepth      ? Number(params.minDepth)      : undefined,
      maxDepth:      params.maxDepth      ? Number(params.maxDepth)      : undefined,
      nearVolcano:   params.nearVolcano   === 'true' ? true : undefined,
      tsunamiOnly:   params.tsunamiOnly   === 'true' ? true : undefined,
      alert:         params.alert         || undefined,
      volcanoNumber: params.volcanoNumber ? Number(params.volcanoNumber) : undefined,
      limit,
      offset,
    };

    const { earthquakes, total } = mgr.search(filters);

    if (earthquakes.length === 0) {
      return '<p class="eq-empty">No earthquakes match the specified criteria.</p>';
    }

    // Build API filter params (exclude undefined values)
    const apiFilters = {};
    if (filters.minMagnitude  != null) apiFilters.minMagnitude  = filters.minMagnitude;
    if (filters.maxMagnitude  != null) apiFilters.maxMagnitude  = filters.maxMagnitude;
    if (filters.minDepth      != null) apiFilters.minDepth      = filters.minDepth;
    if (filters.maxDepth      != null) apiFilters.maxDepth      = filters.maxDepth;
    if (filters.nearVolcano)           apiFilters.nearVolcano   = 'true';
    if (filters.tsunamiOnly)           apiFilters.tsunamiOnly   = 'true';
    if (filters.alert)                 apiFilters.alert         = filters.alert;
    if (filters.volcanoNumber != null) apiFilters.volcanoNumber = filters.volcanoNumber;

    const wid = 'eq-' + Math.random().toString(36).slice(2, 9);

    const rows = buildRows(earthquakes);
    const caption = formatCaption(offset, earthquakes.length, total);
    const prevDisabled = offset === 0 ? ' disabled' : '';
    const nextDisabled = offset + limit >= total ? ' disabled' : '';

    return `
<div class="earthquake-list" id="${wid}">
  <table class="eq-table">
    <thead>
      <tr><th>Mag</th><th>Location</th><th>Time (UTC)</th><th>Depth</th><th>Alert</th><th>Nearest Volcano</th></tr>
    </thead>
    <tbody id="${wid}-tbody">${rows}</tbody>
  </table>
  <div class="vl-pagination">
    <button class="vl-page-btn" id="${wid}-prev"${prevDisabled}>&#8592; Prev</button>
    <span class="eq-caption" id="${wid}-caption">${esc(caption)}</span>
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

  function buildRows(earthquakes) {
    return earthquakes.map(function (e) {
      var alert = e.alert
        ? '<span class="eq-alert eq-alert-' + esc(e.alert) + '">' + esc(e.alert.toUpperCase()) + '</span>'
        : '';
      var tsunami = e.tsunami ? '<span class="eq-tsunami">\uD83C\uDF0A</span>' : '';
      var volcano = e.nearestVolcano
        ? esc(e.nearestVolcano.volcanoName) + ' (' + e.nearestVolcano.distanceKm + '\u00a0km)'
        : '';
      var time = new Date(e.time).toUTCString().slice(0, 16);
      return '<tr>' +
        '<td><strong>M' + esc(e.magnitude.toFixed(1)) + '</strong></td>' +
        '<td>' + esc(e.place) + '</td>' +
        '<td>' + esc(time) + '</td>' +
        '<td>' + esc(e.depth) + '\u00a0km</td>' +
        '<td>' + alert + tsunami + '</td>' +
        '<td>' + volcano + '</td>' +
        '</tr>';
    }).join('');
  }

  function goTo(newOffset) {
    var params = Object.assign({}, apiFilters, { limit: limit, offset: newOffset });
    fetch('/api/geohazardwatch/earthquakes/search?' + new URLSearchParams(params))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        offset = newOffset;
        total = data.total;
        document.getElementById(wid + '-tbody').innerHTML = buildRows(data.earthquakes);
        var showing = offset + data.earthquakes.length;
        var caption = total > data.earthquakes.length
          ? 'Showing ' + (offset + 1) + '\u2013' + showing + ' of ' + total
          : total + ' earthquake' + (total !== 1 ? 's' : '');
        document.getElementById(wid + '-caption').textContent = caption;
        document.getElementById(wid + '-prev').disabled = offset === 0;
        document.getElementById(wid + '-next').disabled = offset + limit >= total;
        document.getElementById(wid).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(function (err) { console.error('EarthquakeList fetch error:', err); });
  }

  document.getElementById(wid + '-prev').onclick = function () { goTo(Math.max(0, offset - limit)); };
  document.getElementById(wid + '-next').onclick = function () { goTo(offset + limit); };
})();
</script>`.trim();
  }
};

function buildRows(earthquakes) {
  return earthquakes.map(e => {
    const alert = e.alert ? `<span class="eq-alert eq-alert-${esc(e.alert)}">${esc(e.alert.toUpperCase())}</span>` : '';
    const tsunami = e.tsunami ? '<span class="eq-tsunami">🌊</span>' : '';
    const volcano = e.nearestVolcano
      ? `${esc(e.nearestVolcano.volcanoName)} (${e.nearestVolcano.distanceKm}\u00a0km)`
      : '';
    return `<tr>
      <td><strong>M${esc(String(e.magnitude.toFixed(1)))}</strong></td>
      <td>${esc(e.place)}</td>
      <td>${esc(new Date(e.time).toUTCString().slice(0, 16))}</td>
      <td>${esc(String(e.depth))}\u00a0km</td>
      <td>${alert}${tsunami}</td>
      <td>${volcano}</td>
    </tr>`;
  }).join('');
}

function formatCaption(offset, count, total) {
  if (total > count) {
    return `Showing ${offset + 1}\u2013${offset + count} of ${total}`;
  }
  return `${total} earthquake${total !== 1 ? 's' : ''}`;
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
