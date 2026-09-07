/**
 * geohazardwatch Add-on
 *
 * Volcano & geology data platform built on ngdpbase.
 * Loads GVP volcano and eruption data, exposes search/filter API routes,
 * and registers markup plugins for infoboxes, lists, and maps.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { WikiEngine } from '#ngdpbase/types/WikiEngine.js';
import type { AddonModule } from '#ngdpbase/managers/AddonsManager.js';
import type PluginManager from '#ngdpbase/managers/PluginManager.js';
import type AddonsManager from '#ngdpbase/managers/AddonsManager.js';
import type BackgroundJobManager from '#ngdpbase/managers/BackgroundJobManager.js';
import type { JobContext } from '#ngdpbase/context/JobContext.js';
import { scheduleContext } from './lib/host.js';

import VolcanoDataManager from './managers/VolcanoDataManager.js';
import EarthquakeDataManager from './managers/EarthquakeDataManager.js';
import HansDataManager from './managers/HansDataManager.js';
import VolcanoInfoboxPlugin from './plugins/VolcanoInfoboxPlugin.js';
import VolcanoListPlugin from './plugins/VolcanoListPlugin.js';
import VolcanoSearchPlugin from './plugins/VolcanoSearchPlugin.js';
import VolcanoMapPlugin from './plugins/VolcanoMapPlugin.js';
import EarthquakeListPlugin from './plugins/EarthquakeListPlugin.js';
import EarthquakeMapPlugin from './plugins/EarthquakeMapPlugin.js';
import HansAlertPlugin from './plugins/HansAlertPlugin.js';
import VaacAdvisoriesPlugin from './plugins/VaacAdvisoriesPlugin.js';
import FirmsHotspotsPlugin from './plugins/FirmsHotspotsPlugin.js';
import { runImport as runHansImport } from './import/import-hans.js';
import { runImport as runEarthquakeImport } from './import/import-earthquakes.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dataManager: VolcanoDataManager | null = null;
let earthquakeManager: EarthquakeDataManager | null = null;
let hansManager: HansDataManager | null = null;

const _intervals: ReturnType<typeof setInterval>[] = [];

function enqueueScheduled(
  jobManager: BackgroundJobManager,
  engine: WikiEngine,
  jobId: string,
  reason: string
): void {
  jobManager.enqueue(jobId, scheduleContext(engine, reason)).catch((err: unknown) => {
    console.error(`[geohazardwatch] scheduled enqueue of ${jobId} failed:`, err);
  });
}

const geohazardwatchAddon: AddonModule = {
  name: 'geohazardwatch',
  version: '1.2.207',
  description: 'Volcano & geology data platform — GVP structured records, search, infoboxes, maps',
  author: 'jwilleke',
  dependencies: [],

  async register(engine: WikiEngine, config: Record<string, unknown>): Promise<void> {
    const dataPath = String(config['dataPath'] || './data/geohazardwatch');
    dataManager = new VolcanoDataManager(dataPath);
    await dataManager.load();
    engine.registerManager('VolcanoDataManager', dataManager);

    earthquakeManager = new EarthquakeDataManager(dataPath);
    await earthquakeManager.load();
    engine.registerManager('EarthquakeDataManager', earthquakeManager);

    hansManager = new HansDataManager(dataPath);
    await hansManager.load();
    engine.registerManager('HansDataManager', hansManager);

    const pluginManager = engine.getManager<PluginManager>('PluginManager');
    if (pluginManager) {
      await pluginManager.registerPlugin('VolcanoInfobox', VolcanoInfoboxPlugin);
      await pluginManager.registerPlugin('VolcanoList', VolcanoListPlugin);
      await pluginManager.registerPlugin('VolcanoSearch', VolcanoSearchPlugin);
      await pluginManager.registerPlugin('VolcanoMap', VolcanoMapPlugin);
      await pluginManager.registerPlugin('EarthquakeList', EarthquakeListPlugin);
      await pluginManager.registerPlugin('EarthquakeMap', EarthquakeMapPlugin);
      await pluginManager.registerPlugin('HansAlerts', HansAlertPlugin);
      await pluginManager.registerPlugin('VaacAdvisories', VaacAdvisoriesPlugin);
      await pluginManager.registerPlugin('FirmsHotspots', FirmsHotspotsPlugin);
    }

    const app = engine.app;
    if (!app) {
      throw new Error('geohazardwatch: engine.app is not set');
    }
    app.use('/addons/geohazardwatch', express.static(path.join(__dirname, 'public')));

    const addonsManager = engine.getManager<AddonsManager>('AddonsManager');
    if (addonsManager) {
      addonsManager.registerStylesheet(
        '/addons/geohazardwatch/css/geohazardwatch.css',
        'geohazardwatch'
      );
    }

    app.use('/api/geohazardwatch', apiRoutes(engine, config));

    const existingViews = app.get('views') ?? [];
    app.set('views', [...[existingViews].flat(), path.join(__dirname, 'views')]);

    app.use('/addons/geohazardwatch', adminRoutes(engine));

    const jobManager = engine.getManager<BackgroundJobManager>('BackgroundJobManager');
    if (jobManager) {
      const hans = hansManager;
      const earthquakes = earthquakeManager;
      jobManager.registerJob({
        id: 'geohazardwatch.import-hans',
        displayName: 'Refresh HANS volcano alerts',
        run: async (reportProgress: (msg: string) => void, _ctx: JobContext) => {
          reportProgress('Fetching USGS HANS API…');
          const result = await runHansImport(dataPath);
          await hans?.load();
          return {
            success: true,
            summary: `${result.elevatedCount} elevated of ${result.monitoredCount} monitored`
          };
        }
      });

      jobManager.registerJob({
        id: 'geohazardwatch.import-earthquakes',
        displayName: 'Refresh earthquake data',
        run: async (reportProgress: (msg: string) => void, _ctx: JobContext) => {
          reportProgress('Fetching USGS earthquake feed…');
          const result = await runEarthquakeImport(dataPath);
          await earthquakes?.load();
          return {
            success: true,
            summary: `${result.total} earthquakes (${result.nearVolcano} near volcanoes)`
          };
        }
      });

      const hansIntervalMs = Number(config['hansIntervalMs'] ?? 10 * 60 * 1000);
      const eqIntervalMs = Number(config['eqIntervalMs'] ?? 20 * 60 * 1000);

      if (hansIntervalMs > 0) {
        _intervals.push(
          setInterval(
            () => enqueueScheduled(jobManager, engine, 'geohazardwatch.import-hans', 'geohazardwatch: scheduled HANS import'),
            hansIntervalMs
          )
        );
      }
      if (eqIntervalMs > 0) {
        _intervals.push(
          setInterval(
            () => enqueueScheduled(jobManager, engine, 'geohazardwatch.import-earthquakes', 'geohazardwatch: scheduled USGS earthquake import'),
            eqIntervalMs
          )
        );
      }
    }

    if (addonsManager) {
      addonsManager.registerDashboardCard({
        addonName: 'geohazardwatch',
        title: 'GeoHazardWatch',
        icon: 'fas fa-mountain',
        adminUrl: '/addons/geohazardwatch'
      });
    }

    engine.setCapability('geohazardwatch', true);
  },

  async status() {
    const volcanoCount = dataManager ? dataManager.volcanoCount() : 0;
    const eruptionCount = dataManager ? dataManager.eruptionCount() : 0;
    const earthquakeCount = earthquakeManager ? earthquakeManager.count() : 0;
    const nearVolcano = earthquakeManager ? earthquakeManager.nearVolcanoCount() : 0;
    const hansElevated = hansManager ? hansManager.count() : 0;
    return {
      healthy: true,
      records: volcanoCount,
      message: `${volcanoCount} volcanoes, ${eruptionCount} eruptions, ${earthquakeCount} earthquakes (${nearVolcano} near volcanoes), ${hansElevated} HANS elevated`
    };
  },

  async shutdown() {
    for (const id of _intervals) clearInterval(id);
    _intervals.length = 0;
    dataManager = null;
    earthquakeManager = null;
    hansManager = null;
  }
};

export default geohazardwatchAddon;
