'use strict';

/**
 * VolcanoMapPlugin
 *
 * Renders a Leaflet map of filtered volcanoes.
 * Leaflet is loaded from a CDN; no bundling required.
 *
 * Usage:
 *   [{VolcanoMap}]
 *   [{VolcanoMap country='Japan' height='500'}]
 *   [{VolcanoMap epoch='Holocene' lat='35' lon='138' zoom='5'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'VolcanoMap',

  /**
   * @param {{ engine: import('../../../src/types/WikiEngine').WikiEngine }} context
   * @param {Record<string, string>} params
   * @returns {string}
   */
  execute(context, params) {
    const mapId    = 'vm-map-' + Math.random().toString(36).slice(2, 8);
    const height   = Number(params.height) || 450;
    const centerLat = Number(params.lat) || 20;
    const centerLon = Number(params.lon) || 0;
    const zoom     = Number(params.zoom) || 2;

    // Build query string for the API call
    const apiParams = new URLSearchParams();
    if (params.country)        apiParams.set('country', params.country);
    if (params.region)         apiParams.set('region', params.region);
    if (params.volcanoType)    apiParams.set('volcanoType', params.volcanoType);
    if (params.epoch)          apiParams.set('epoch', params.epoch);
    if (params.minElevation)   apiParams.set('minElevation', params.minElevation);
    if (params.maxElevation)   apiParams.set('maxElevation', params.maxElevation);
    apiParams.set('limit', String(Number(params.limit) || 5000));

    return `
<div class="volcano-map">
  <div id="${mapId}" style="height:${height}px; width:100%;"></div>
</div>
<link rel="stylesheet" href="/addons/geohazardwatch/vendor/leaflet/leaflet.css">
<script src="/addons/geohazardwatch/vendor/leaflet/leaflet.js"></script>
<script>
(function () {
  function initMap() {
    if (typeof L === 'undefined') { setTimeout(initMap, 100); return; }

    var map = L.map('${mapId}').setView([${centerLat}, ${centerLon}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    fetch('/api/geohazardwatch/search?${apiParams.toString()}')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        data.volcanoes.forEach(function (v) {
          if (v.latitude == null || v.longitude == null) return;
          var popup = '<strong>' + escHtml(v.volcanoName) + '</strong>'
            + '<br>' + escHtml(v.country)
            + ' — ' + escHtml(v.primaryVolcanoType)
            + '<br>Elevation: ' + (v.elevation != null ? v.elevation + ' m' : 'unknown')
            + '<br>Epoch: ' + escHtml(v.epoch)
            + '<br>Last eruption: ' + escHtml(v.lastKnownEruption);
          L.circleMarker([v.latitude, v.longitude], {
            radius: 5,
            color: v.epoch === 'Holocene' ? '#e63946' : '#457b9d',
            fillOpacity: 0.7,
            weight: 1
          }).bindPopup(popup).addTo(map);
        });
      })
      .catch(function (err) {
        console.error('VolcanoMap fetch error:', err);
      });
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
</script>`.trim();
  }
};
