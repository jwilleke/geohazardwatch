'use strict';

/**
 * VolcanoSearchPlugin
 *
 * Renders an interactive faceted search widget that calls the geohazardwatch API.
 * Embed on any wiki page to get a live filterable volcano table.
 *
 * Usage:
 *   [{VolcanoSearch}]
 *   [{VolcanoSearch defaultEpoch='Holocene' defaultLimit='50'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'VolcanoSearch',

  /**
   * @param {{ engine: import('../../../src/types/WikiEngine').WikiEngine }} context
   * @param {Record<string, string>} params
   * @returns {string}
   */
  execute(context, params) {
    const defaultEpoch = params.defaultEpoch || '';
    const defaultLimit = params.defaultLimit || '50';

    const mgr = context.engine.getManager('VolcanoDataManager');
    const countries = mgr ? JSON.stringify(mgr.distinctValues('country')) : '[]';
    const regions   = mgr ? JSON.stringify(mgr.distinctValues('volcanicRegion')) : '[]';
    const types     = mgr ? JSON.stringify(mgr.distinctValues('primaryVolcanoType')) : '[]';

    return `
<div class="volcano-search" id="vs-widget">
  <div class="vs-filters">
    <input type="text" id="vs-q" placeholder="Search name, country, region…" class="vs-input vs-text">
    <select id="vs-epoch" class="vs-input vs-select">
      <option value="">All epochs</option>
      <option value="Holocene"${defaultEpoch === 'Holocene' ? ' selected' : ''}>Holocene</option>
      <option value="Pleistocene"${defaultEpoch === 'Pleistocene' ? ' selected' : ''}>Pleistocene</option>
    </select>
    <select id="vs-country" class="vs-input vs-select"><option value="">All countries</option></select>
    <select id="vs-region"  class="vs-input vs-select"><option value="">All regions</option></select>
    <select id="vs-type"    class="vs-input vs-select"><option value="">All types</option></select>
    <button id="vs-btn" class="vs-btn">Search</button>
    <button id="vs-clear" class="vs-btn vs-btn-secondary">Clear</button>
  </div>
  <div id="vs-status" class="vs-status"></div>
  <div id="vs-results"></div>
</div>
<script>
(function () {
  var COUNTRIES = ${countries};
  var REGIONS   = ${regions};
  var TYPES     = ${types};
  var LIMIT     = ${defaultLimit};

  function populate(selectId, values) {
    var sel = document.getElementById(selectId);
    values.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      sel.appendChild(opt);
    });
  }

  populate('vs-country', COUNTRIES);
  populate('vs-region',  REGIONS);
  populate('vs-type',    TYPES);

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function runSearch() {
    var params = new URLSearchParams();
    var q = document.getElementById('vs-q').value.trim();
    if (q)  params.set('q', q);
    var epoch   = document.getElementById('vs-epoch').value;
    if (epoch)  params.set('epoch', epoch);
    var country = document.getElementById('vs-country').value;
    if (country) params.set('country', country);
    var region  = document.getElementById('vs-region').value;
    if (region)  params.set('region', region);
    var type    = document.getElementById('vs-type').value;
    if (type)    params.set('volcanoType', type);
    params.set('limit', LIMIT);

    document.getElementById('vs-status').textContent = 'Searching…';
    document.getElementById('vs-results').innerHTML = '';

    fetch('/api/geohazardwatch/search?' + params.toString())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        document.getElementById('vs-status').textContent =
          'Showing ' + data.volcanoes.length + ' of ' + data.total + ' volcanoes';
        var rows = data.volcanoes.map(function (v) {
          var gvpUrl = 'https://volcano.si.edu/volcano.cfm?vn=' + v.volcanoNumber;
          return '<tr>'
            + '<td><a href="' + gvpUrl + '" target="_blank" rel="noopener">' + escHtml(v.volcanoNumber) + '</a></td>'
            + '<td>' + escHtml(v.volcanoName)   + '</td>'
            + '<td>' + escHtml(v.country)        + '</td>'
            + '<td>' + escHtml(v.volcanicRegion) + '</td>'
            + '<td>' + escHtml(v.primaryVolcanoType) + '</td>'
            + '<td>' + escHtml(v.epoch)          + '</td>'
            + '<td>' + escHtml(v.elevation != null ? v.elevation + ' m' : '') + '</td>'
            + '<td>' + escHtml(v.lastKnownEruption) + '</td>'
            + '</tr>';
        }).join('');
        document.getElementById('vs-results').innerHTML =
          '<table class="vl-table"><thead><tr>'
          + '<th>GVP #</th><th>Name</th><th>Country</th><th>Region</th>'
          + '<th>Type</th><th>Epoch</th><th>Elev (m)</th><th>Last Eruption</th>'
          + '</tr></thead><tbody>' + rows + '</tbody></table>';
      })
      .catch(function (err) {
        document.getElementById('vs-status').textContent = 'Error: ' + err.message;
      });
  }

  document.getElementById('vs-btn').addEventListener('click', runSearch);
  document.getElementById('vs-clear').addEventListener('click', function () {
    document.getElementById('vs-q').value = '';
    document.getElementById('vs-epoch').value = '';
    document.getElementById('vs-country').value = '';
    document.getElementById('vs-region').value = '';
    document.getElementById('vs-type').value = '';
    document.getElementById('vs-results').innerHTML = '';
    document.getElementById('vs-status').textContent = '';
  });
  document.getElementById('vs-q').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') runSearch();
  });
})();
</script>`.trim();
  }
};
