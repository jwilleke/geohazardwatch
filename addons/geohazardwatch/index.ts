/**
 * geohazardwatch Add-on
 *
 * Volcano & geology data platform built on ngdpbase.
 * Loads GVP volcano and eruption data, exposes search/filter API routes,
 * and registers markup plugins for infoboxes, lists, and maps.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import type { WikiEngine } from '#ngdpbase/types/WikiEngine.js';
import type { AddonModule } from '#ngdpbase/managers/AddonsManager.js';
import type PluginManager from '#ngdpbase/managers/PluginManager.js';
import type AddonsManager from '#ngdpbase/managers/AddonsManager.js';
import type BackgroundJobManager from '#ngdpbase/managers/BackgroundJobManager.js';
import type { AddonHost } from '#ngdpbase/utils/addonHost.js';
import { guardedFetchJson } from './lib/fetch.js';
import { registerJobs } from './lib/jobs.js';

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
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dataManager: VolcanoDataManager | null = null;
let earthquakeManager: EarthquakeDataManager | null = null;
let hansManager: HansDataManager | null = null;

const geohazardwatchAddon: AddonModule = {
  name: 'geohazardwatch',
  version: '1.2.287',
  description: 'Volcano & geology data platform — GVP structured records, search, infoboxes, maps',
  author: 'jwilleke',
  dependencies: [],

  async register(engine: WikiEngine, config: Record<string, unknown>, host?: AddonHost): Promise<void> {
    if (!host) {
      throw new Error('geohazardwatch: no host from core — this add-on needs the ngdpbase release named in its package.json ngdpbase.minVersion, or later');
    }
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
    app.use('/addons/geohazardwatch', engine.serveStatic(path.join(__dirname, 'public')));

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

    app.use('/addons/geohazardwatch', adminRoutes(engine, host));

    // ngdpbase#2054: the data refresh is core's scheduled jobs, not a timer here.
    const jobManager = engine.getManager<BackgroundJobManager>('BackgroundJobManager');
    if (jobManager) {
      const configManager = engine.getManager<{ getProperty?: (k: string, f?: unknown) => unknown }>(
        'ConfigurationManager'
      );
      const readConfig = (key: string, fallback?: unknown): unknown =>
        configManager?.getProperty?.(key, fallback) ?? fallback;
      const volcanoes = dataManager;
      const earthquakes = earthquakeManager;
      const hans = hansManager;
      registerJobs(jobManager, {
        dataPath,
        config,
        // The egress policy as it is at each run, so a config change applies.
        fetchJson: () => guardedFetchJson(
          host.guardedFetch,
          host.resolveEgressPolicy(readConfig).policy,
          Number(config['maxResponseBytes']) || undefined
        ),
        reload: {
          volcanoes: () => volcanoes.load(),
          earthquakes: () => earthquakes.load(),
          hans: () => hans.load()
        },
        log: { error: (message: string) => { host.logger.error(message); } }
      });
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
    dataManager = null;
    earthquakeManager = null;
    hansManager = null;
  }
};

export default geohazardwatchAddon;
