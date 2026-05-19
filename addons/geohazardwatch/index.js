'use strict';

/**
 * geohazardwatch Add-on
 *
 * Volcano & geology data platform built on ngdpbase.
 * Loads GVP volcano and eruption data, exposes search/filter API routes,
 * and registers wiki markup plugins for infoboxes, lists, and maps.
 *
 * Wire into your ngdpbase instance config:
 *   "ngdpbase.managers.addons-manager.addons-path": "/path/to/geohazardwatch/addons",
 *   "ngdpbase.addons.geohazardwatch.enabled": true,
 *   "ngdpbase.addons.geohazardwatch.dataPath": "./data/geohazardwatch"
 *
 * Optional polling config (set to 0 to disable):
 *   "ngdpbase.addons.geohazardwatch.hansIntervalMs": 600000   (default 10 min)
 *   "ngdpbase.addons.geohazardwatch.eqIntervalMs":  1200000  (default 20 min)
 *
 * Import data first:
 *   node addons/geohazardwatch/import/import-volcanoes.js
 *   node addons/geohazardwatch/import/import-volcanoes.js --eruptions
 *   node addons/geohazardwatch/import/import-volcanoes.js --activity
 *
 * @type {import('../../src/managers/AddonsManager').AddonModule}
 */

const path = require('path');
const express = require('express');

const VolcanoDataManager    = require('./managers/VolcanoDataManager');
const EarthquakeDataManager = require('./managers/EarthquakeDataManager');
const HansDataManager       = require('./managers/HansDataManager');
const VolcanoInfoboxPlugin   = require('./plugins/VolcanoInfoboxPlugin');
const VolcanoListPlugin      = require('./plugins/VolcanoListPlugin');
const VolcanoSearchPlugin    = require('./plugins/VolcanoSearchPlugin');
const VolcanoMapPlugin       = require('./plugins/VolcanoMapPlugin');
const EarthquakeListPlugin   = require('./plugins/EarthquakeListPlugin');
const EarthquakeMapPlugin    = require('./plugins/EarthquakeMapPlugin');
const HansAlertPlugin        = require('./plugins/HansAlertPlugin');
const { runImport: runHansImport }       = require('./import/import-hans');
const { runImport: runEarthquakeImport } = require('./import/import-earthquakes');

/** @type {VolcanoDataManager | null} */
let dataManager = null;
/** @type {EarthquakeDataManager | null} */
let earthquakeManager = null;
/** @type {HansDataManager | null} */
let hansManager = null;

/** @type {ReturnType<typeof setInterval>[]} */
const _intervals = [];

module.exports = {
  name: 'geohazardwatch',
  version: '1.2.14',
  description: 'Volcano & geology data platform — GVP structured records, search, infoboxes, maps',
  author: 'jwilleke',
  dependencies: [],

  /**
   * @param {import('../../src/types/WikiEngine').WikiEngine} engine
   * @param {Record<string, unknown>} config
   */
  async register(engine, config) {
    // ── 1. Initialize data manager ───────────────────────────────────────────
    const dataPath = String(config.dataPath || './data/geohazardwatch');
    dataManager = new VolcanoDataManager(dataPath);
    await dataManager.load();
    engine.registerManager('VolcanoDataManager', dataManager);

    // ── 1b. Initialize earthquake manager ───────────────────────────────────
    earthquakeManager = new EarthquakeDataManager(dataPath);
    await earthquakeManager.load();
    engine.registerManager('EarthquakeDataManager', earthquakeManager);

    // ── 1c. Initialize HANS manager (optional — loads if activity.json exists)
    hansManager = new HansDataManager(dataPath);
    await hansManager.load();
    engine.registerManager('HansDataManager', hansManager);

    // ── 2. Register markup plugins ───────────────────────────────────────────
    const pluginManager = engine.getManager('PluginManager');
    if (pluginManager) {
      await pluginManager.registerPlugin('VolcanoInfobox',   VolcanoInfoboxPlugin);
      await pluginManager.registerPlugin('VolcanoList',      VolcanoListPlugin);
      await pluginManager.registerPlugin('VolcanoSearch',    VolcanoSearchPlugin);
      await pluginManager.registerPlugin('VolcanoMap',       VolcanoMapPlugin);
      await pluginManager.registerPlugin('EarthquakeList',   EarthquakeListPlugin);
      await pluginManager.registerPlugin('EarthquakeMap',    EarthquakeMapPlugin);
      await pluginManager.registerPlugin('HansAlerts',       HansAlertPlugin);
    }

    // ── 3. Serve static assets ───────────────────────────────────────────────
    engine.app.use(
      '/addons/geohazardwatch',
      express.static(path.join(__dirname, 'public'))
    );

    // ── 4. Register stylesheet ───────────────────────────────────────────────
    const addonsManager = engine.getManager('AddonsManager');
    if (addonsManager) {
      addonsManager.registerStylesheet(
        '/addons/geohazardwatch/css/geohazardwatch.css',
        'geohazardwatch'
      );
    }

    // ── 5. Mount API routes ──────────────────────────────────────────────────
    const apiRouter = require('./routes/api')(engine, config);
    engine.app.use('/api/geohazardwatch', apiRouter);

    // ── 5b. Register addon-local views directory ─────────────────────────────
    const existingViews = engine.app.get('views') ?? [];
    engine.app.set('views', [...[existingViews].flat(), path.join(__dirname, 'views')]);

    // ── 5c. Mount admin routes ───────────────────────────────────────────────
    const adminRouter = require('./routes/admin')(engine);
    engine.app.use('/addons/geohazardwatch', adminRouter);

    // ── 6. Register background refresh jobs ─────────────────────────────────
    const jobManager = engine.getManager('BackgroundJobManager');
    if (jobManager) {
      jobManager.registerJob({
        id: 'geohazardwatch.import-hans',
        displayName: 'Refresh HANS volcano alerts',
        run: async (reportProgress) => {
          reportProgress('Fetching USGS HANS API…');
          const result = await runHansImport(dataPath);
          await hansManager.load();
          return {
            success: true,
            summary: `${result.elevatedCount} elevated of ${result.monitoredCount} monitored`
          };
        }
      });

      jobManager.registerJob({
        id: 'geohazardwatch.import-earthquakes',
        displayName: 'Refresh earthquake data',
        run: async (reportProgress) => {
          reportProgress('Fetching USGS earthquake feed…');
          const result = await runEarthquakeImport(dataPath);
          await earthquakeManager.load();
          return {
            success: true,
            summary: `${result.total} earthquakes (${result.nearVolcano} near volcanoes)`
          };
        }
      });

      // Schedule polling intervals (0 = disabled)
      const hansIntervalMs = Number(config.hansIntervalMs ?? 10 * 60 * 1000);
      const eqIntervalMs   = Number(config.eqIntervalMs   ?? 20 * 60 * 1000);

      if (hansIntervalMs > 0) {
        _intervals.push(
          setInterval(() => jobManager.enqueue('geohazardwatch.import-hans'), hansIntervalMs)
        );
      }
      if (eqIntervalMs > 0) {
        _intervals.push(
          setInterval(() => jobManager.enqueue('geohazardwatch.import-earthquakes'), eqIntervalMs)
        );
      }
    }

    // ── 7. Dashboard card ────────────────────────────────────────────────────
    if (addonsManager) {
      addonsManager.registerDashboardCard({
        addonName: 'geohazardwatch',
        title: 'GeoHazardWatch',
        icon: 'fas fa-mountain',
        adminUrl: '/addons/geohazardwatch'
      });
    }

    // ── 8. Announce optional capability ─────────────────────────────────────
    engine.setCapability('geohazardwatch', true);
  },

  async status() {
    const volcanoCount    = dataManager       ? dataManager.volcanoCount()          : 0;
    const eruptionCount   = dataManager       ? dataManager.eruptionCount()         : 0;
    const earthquakeCount = earthquakeManager ? earthquakeManager.count()           : 0;
    const nearVolcano     = earthquakeManager ? earthquakeManager.nearVolcanoCount() : 0;
    const hansElevated    = hansManager       ? hansManager.count()                 : 0;
    return {
      healthy: true,
      records: volcanoCount,
      message: `${volcanoCount} volcanoes, ${eruptionCount} eruptions, ${earthquakeCount} earthquakes (${nearVolcano} near volcanoes), ${hansElevated} HANS elevated`
    };
  },

  async shutdown() {
    for (const id of _intervals) clearInterval(id);
    _intervals.length = 0;
    dataManager       = null;
    earthquakeManager = null;
    hansManager       = null;
  }
};
