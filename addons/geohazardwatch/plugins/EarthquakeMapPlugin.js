'use strict';

/**
 * EarthquakeMapPlugin
 *
 * Renders a Leaflet map of recent earthquakes, optionally overlaid
 * with volcano markers.
 *
 * Usage:
 *   [{EarthquakeMap}]
 *   [{EarthquakeMap minMagnitude='5' showVolcanoes='true' height='500'}]
 *   [{EarthquakeMap nearVolcano='true'}]
 *
 * @type {import('../../../src/managers/PluginManager').PluginObject}
 */
module.exports = {
  name: 'EarthquakeMap',

  execute(context, params) {
    const mapId       = 'em-map-' + Math.random().toString(36).slice(2, 8);
    const height      = Number(params.height) || 450;
    const centerLat   = Number(params.lat)    || 20;
    const centerLon   = Number(params.lon)    || 0;
    const zoom        = Number(params.zoom)   || 2;
    const showVolcanoes = params.showVolcanoes === 'true';

    const eqParams = new URLSearchParams();
    if (params.minMagnitude)  eqParams.set('minMagnitude',  params.minMagnitude);
    if (params.maxMagnitude)  eqParams.set('maxMagnitude',  params.maxMagnitude);
    if (params.nearVolcano)   eqParams.set('nearVolcano',   params.nearVolcano);
    if (params.tsunamiOnly)   eqParams.set('tsunamiOnly',   params.tsunamiOnly);
    if (params.volcanoNumber) eqParams.set('volcanoNumber', params.volcanoNumber);
    eqParams.set('limit', String(Number(params.limit) || 5000));

    const volcParams = new URLSearchParams({ limit: '5000' });
    if (params.epoch) volcParams.set('epoch', params.epoch);

    return `
<div class="earthquake-map">
  <div id="${mapId}" style="height:${height}px;width:100%;"></div>
</div>
<link rel="stylesheet" href="/addons/geohazardwatch/vendor/leaflet/leaflet.css">
<script src="/addons/geohazardwatch/vendor/leaflet/leaflet.js"></script>
<script>
(function () {
  var SHOW_VOLCANOES = ${showVolcanoes};

  function alertColor(alert) {
    return { green: '#2dc653', yellow: '#f6c90e', orange: '#f4811f', red: '#e63946' }[alert] || '#457b9d';
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function initMap() {
    if (typeof L === 'undefined') { setTimeout(initMap, 100); return; }

    var map = L.map('${mapId}').setView([${centerLat}, ${centerLon}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Earthquake markers
    fetch('/api/geohazardwatch/earthquakes/search?${eqParams.toString()}')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        data.earthquakes.forEach(function (e) {
          if (e.latitude == null || e.longitude == null) return;
          var radius = Math.max(4, e.magnitude * 2);
          var color  = alertColor(e.alert);
          var popup  = '<strong>M' + escHtml(e.magnitude.toFixed(1)) + ' — ' + escHtml(e.place) + '</strong>'
            + '<br>Depth: ' + escHtml(String(e.depth)) + ' km'
            + '<br>' + escHtml(new Date(e.time).toUTCString())
            + (e.tsunami ? '<br><strong>⚠ Tsunami advisory</strong>' : '')
            + (e.nearestVolcano ? '<br>Near: ' + escHtml(e.nearestVolcano.volcanoName)
               + ' (' + e.nearestVolcano.distanceKm + ' km)' : '');
          L.circleMarker([e.latitude, e.longitude], {
            radius: radius, color: color, fillColor: color,
            fillOpacity: 0.6, weight: 1
          }).bindPopup(popup).addTo(map);
        });
      })
      .catch(function (err) { console.error('EarthquakeMap eq fetch error:', err); });

    // Optional volcano markers
    if (SHOW_VOLCANOES) {
      fetch('/api/geohazardwatch/search?${volcParams.toString()}')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          data.volcanoes.forEach(function (v) {
            if (v.latitude == null || v.longitude == null) return;
            L.circleMarker([v.latitude, v.longitude], {
              radius: 4, color: '#6c757d', fillColor: '#adb5bd',
              fillOpacity: 0.5, weight: 1
            }).bindTooltip(escHtml(v.volcanoName)).addTo(map);
          });
        })
        .catch(function (err) { console.error('EarthquakeMap volcano fetch error:', err); });
    }
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
