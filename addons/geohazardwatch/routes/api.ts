/**
 * API routes for the geohazardwatch add-on.
 * Mounted at /api/geohazardwatch in register().
 */

import { Router, type Request, type Response } from 'express';
import type { WikiEngine } from '#ngdpbase/types/WikiEngine.js';
import type VolcanoDataManager from '../managers/VolcanoDataManager.js';
import type EarthquakeDataManager from '../managers/EarthquakeDataManager.js';
import type HansDataManager from '../managers/HansDataManager.js';
import type {
  EarthquakeSearchFilters,
  HansFilters,
  VolcanoSearchFilters
} from '../lib/types.js';

function queryString(q: Request['query'], key: string): string | undefined {
  const v = q[key];
  if (typeof v === 'string' && v !== '') return v;
  return undefined;
}

function parseEqFilters(q: Request['query']): EarthquakeSearchFilters {
  const f: EarthquakeSearchFilters = {};
  const minMagnitude = queryString(q, 'minMagnitude');
  const maxMagnitude = queryString(q, 'maxMagnitude');
  const minDepth = queryString(q, 'minDepth');
  const maxDepth = queryString(q, 'maxDepth');
  const alert = queryString(q, 'alert');
  const volcanoNumber = queryString(q, 'volcanoNumber');
  const limit = queryString(q, 'limit');
  const offset = queryString(q, 'offset');
  if (minMagnitude) f.minMagnitude = Number(minMagnitude);
  if (maxMagnitude) f.maxMagnitude = Number(maxMagnitude);
  if (minDepth) f.minDepth = Number(minDepth);
  if (maxDepth) f.maxDepth = Number(maxDepth);
  if (q['nearVolcano'] === 'true') f.nearVolcano = true;
  if (q['tsunamiOnly'] === 'true') f.tsunamiOnly = true;
  if (alert) f.alert = alert;
  if (volcanoNumber) f.volcanoNumber = Number(volcanoNumber);
  if (limit) f.limit = Number(limit);
  if (offset) f.offset = Number(offset);
  return f;
}

function parseFilters(q: Request['query']): VolcanoSearchFilters {
  const filters: VolcanoSearchFilters = {};
  const qtext = queryString(q, 'q') ?? queryString(q, 'query');
  if (qtext) filters.query = qtext;
  const country = queryString(q, 'country');
  const region = queryString(q, 'region');
  const volcanoType = queryString(q, 'volcanoType');
  const rockType = queryString(q, 'rockType');
  const tectonicSetting = queryString(q, 'tectonicSetting');
  const epoch = queryString(q, 'epoch');
  if (country) filters.country = country;
  if (region) filters.region = region;
  if (volcanoType) filters.volcanoType = volcanoType;
  if (rockType) filters.rockType = rockType;
  if (tectonicSetting) filters.tectonicSetting = tectonicSetting;
  if (epoch) filters.epoch = epoch;
  const minElevation = queryString(q, 'minElevation');
  const maxElevation = queryString(q, 'maxElevation');
  const minLatitude = queryString(q, 'minLatitude');
  const maxLatitude = queryString(q, 'maxLatitude');
  const minLongitude = queryString(q, 'minLongitude');
  const maxLongitude = queryString(q, 'maxLongitude');
  const limit = queryString(q, 'limit');
  const offset = queryString(q, 'offset');
  if (minElevation) filters.minElevation = Number(minElevation);
  if (maxElevation) filters.maxElevation = Number(maxElevation);
  if (minLatitude) filters.minLatitude = Number(minLatitude);
  if (maxLatitude) filters.maxLatitude = Number(maxLatitude);
  if (minLongitude) filters.minLongitude = Number(minLongitude);
  if (maxLongitude) filters.maxLongitude = Number(maxLongitude);
  if (limit) filters.limit = Number(limit);
  if (offset) filters.offset = Number(offset);
  return filters;
}

export default function apiRoutes(engine: WikiEngine, _config: Record<string, unknown>): Router {
  const router = Router();

  router.get('/search', (req: Request, res: Response) => {
    try {
      const mgr = engine.getManager<VolcanoDataManager>('VolcanoDataManager');
      if (!mgr) {
        res.status(503).json({ error: 'VolcanoDataManager not available' });
        return;
      }
      res.json(mgr.search(parseFilters(req.query)));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.get('/distinct/:field', (req: Request, res: Response) => {
    try {
      const mgr = engine.getManager<VolcanoDataManager>('VolcanoDataManager');
      if (!mgr) {
        res.status(503).json({ error: 'VolcanoDataManager not available' });
        return;
      }
      const field = String(req.params['field']);
      res.json({ field, values: mgr.distinctValues(field) });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.get('/volcano/:number', (req: Request, res: Response) => {
    const mgr = engine.getManager<VolcanoDataManager>('VolcanoDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'VolcanoDataManager not available' });
      return;
    }
    const volcano = mgr.getByNumber(Number(req.params['number']));
    if (!volcano) {
      res.status(404).json({ error: 'Volcano not found' });
      return;
    }
    res.json(volcano);
  });

  router.get('/eruptions/:number', (req: Request, res: Response) => {
    const mgr = engine.getManager<VolcanoDataManager>('VolcanoDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'VolcanoDataManager not available' });
      return;
    }
    const volcanoNumber = Number(req.params['number']);
    res.json({ volcanoNumber, eruptions: mgr.getEruptions(volcanoNumber) });
  });

  router.get('/earthquakes/search', (req: Request, res: Response) => {
    try {
      const mgr = engine.getManager<EarthquakeDataManager>('EarthquakeDataManager');
      if (!mgr) {
        res.status(503).json({ error: 'EarthquakeDataManager not available' });
        return;
      }
      res.json(mgr.search(parseEqFilters(req.query)));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  router.get('/earthquakes/near/:number', (req: Request, res: Response) => {
    const mgr = engine.getManager<EarthquakeDataManager>('EarthquakeDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'EarthquakeDataManager not available' });
      return;
    }
    const volcanoNumber = Number(req.params['number']);
    res.json({ volcanoNumber, earthquakes: mgr.nearVolcano(volcanoNumber) });
  });

  router.get('/earthquakes/status', (_req: Request, res: Response) => {
    const mgr = engine.getManager<EarthquakeDataManager>('EarthquakeDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'EarthquakeDataManager not available' });
      return;
    }
    res.json({
      fetchedUtc: mgr.fetchedUtc,
      feed: mgr.feed,
      totalCount: mgr.count(),
      nearVolcanoCount: mgr.nearVolcanoCount()
    });
  });

  router.get('/hans/elevated', (req: Request, res: Response) => {
    const mgr = engine.getManager<HansDataManager>('HansDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'HansDataManager not available — run npm run import:hans' });
      return;
    }
    const filters: HansFilters = {};
    const alertLevel = queryString(req.query, 'alertLevel');
    const colorCode = queryString(req.query, 'colorCode');
    const observatory = queryString(req.query, 'observatory');
    if (alertLevel) filters.alertLevel = alertLevel;
    if (colorCode) filters.colorCode = colorCode;
    if (observatory) filters.observatory = observatory;
    const alerts = mgr.getElevated(filters);
    res.json({ elevated: alerts, total: alerts.length });
  });

  router.get('/hans/volcano/:number', (req: Request, res: Response) => {
    const mgr = engine.getManager<HansDataManager>('HansDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'HansDataManager not available' });
      return;
    }
    const volcanoNumber = String(req.params['number']);
    const alert = mgr.getAlert(volcanoNumber);
    if (!alert) {
      res.json({ volcanoNumber, alert: null, elevated: false });
      return;
    }
    res.json({ volcanoNumber, alert, elevated: true });
  });

  router.get('/hans/status', (_req: Request, res: Response) => {
    const mgr = engine.getManager<HansDataManager>('HansDataManager');
    if (!mgr) {
      res.status(503).json({ error: 'HansDataManager not available' });
      return;
    }
    res.json(mgr.status());
  });

  return router;
}
