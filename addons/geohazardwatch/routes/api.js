'use strict';

const express = require('express');

/**
 * API routes for the geohazardwatch add-on.
 * Mounted at /api/geohazardwatch in register().
 *
 * Endpoints:
 *   GET /api/geohazardwatch/search                  Search/filter volcanoes
 *   GET /api/geohazardwatch/distinct/:field          Distinct values for a field
 *   GET /api/geohazardwatch/volcano/:number          Single volcano by GVP number
 *   GET /api/geohazardwatch/eruptions/:number        Eruptions for a volcano
 *   GET /api/geohazardwatch/earthquakes/search       Search/filter earthquakes
 *   GET /api/geohazardwatch/earthquakes/near/:number Earthquakes near a volcano
 *   GET /api/geohazardwatch/hans/elevated            Currently elevated US volcanoes
 *   GET /api/geohazardwatch/hans/volcano/:number     HANS alert for a single volcano
 *   GET /api/geohazardwatch/hans/status              HANS snapshot metadata
 *
 * @param {import('../../../src/types/WikiEngine').WikiEngine} engine
 * @param {Record<string, unknown>} _config
 * @returns {express.Router}
 */
module.exports = function apiRoutes(engine, _config) {
  const router = express.Router();

  // GET /api/geohazardwatch/search?q=&country=&region=&volcanoType=&rockType=
  //   &tectonicSetting=&epoch=&minElevation=&maxElevation=
  //   &minLatitude=&maxLatitude=&minLongitude=&maxLongitude=
  //   &limit=100&offset=0
  router.get('/search', (req, res) => {
    try {
      const mgr = engine.getManager('VolcanoDataManager');
      if (!mgr) return res.status(503).json({ error: 'VolcanoDataManager not available' });

      const filters = parseFilters(req.query);
      const result = mgr.search(filters);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // GET /api/geohazardwatch/distinct/:field
  router.get('/distinct/:field', (req, res) => {
    try {
      const mgr = engine.getManager('VolcanoDataManager');
      if (!mgr) return res.status(503).json({ error: 'VolcanoDataManager not available' });

      const values = mgr.distinctValues(req.params.field);
      res.json({ field: req.params.field, values });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // GET /api/geohazardwatch/volcano/:number
  router.get('/volcano/:number', (req, res) => {
    const mgr = engine.getManager('VolcanoDataManager');
    if (!mgr) return res.status(503).json({ error: 'VolcanoDataManager not available' });

    const volcano = mgr.getByNumber(Number(req.params.number));
    if (!volcano) return res.status(404).json({ error: 'Volcano not found' });
    res.json(volcano);
  });

  // GET /api/geohazardwatch/eruptions/:number
  router.get('/eruptions/:number', (req, res) => {
    const mgr = engine.getManager('VolcanoDataManager');
    if (!mgr) return res.status(503).json({ error: 'VolcanoDataManager not available' });

    const eruptions = mgr.getEruptions(Number(req.params.number));
    res.json({ volcanoNumber: Number(req.params.number), eruptions });
  });

  // GET /api/geohazardwatch/earthquakes/search?minMagnitude=&maxMagnitude=
  //   &minDepth=&maxDepth=&nearVolcano=true&tsunamiOnly=true
  //   &alert=&volcanoNumber=&limit=100&offset=0
  router.get('/earthquakes/search', (req, res) => {
    try {
      const mgr = engine.getManager('EarthquakeDataManager');
      if (!mgr) return res.status(503).json({ error: 'EarthquakeDataManager not available' });

      const filters = parseEqFilters(req.query);
      const result  = mgr.search(filters);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // GET /api/geohazardwatch/earthquakes/near/:number
  router.get('/earthquakes/near/:number', (req, res) => {
    const mgr = engine.getManager('EarthquakeDataManager');
    if (!mgr) return res.status(503).json({ error: 'EarthquakeDataManager not available' });

    const earthquakes = mgr.nearVolcano(Number(req.params.number));
    res.json({ volcanoNumber: Number(req.params.number), earthquakes });
  });

  // GET /api/geohazardwatch/earthquakes/status
  router.get('/earthquakes/status', (req, res) => {
    const mgr = engine.getManager('EarthquakeDataManager');
    if (!mgr) return res.status(503).json({ error: 'EarthquakeDataManager not available' });

    res.json({
      fetchedUtc:      mgr.fetchedUtc,
      feed:            mgr.feed,
      totalCount:      mgr.count(),
      nearVolcanoCount: mgr.nearVolcanoCount(),
    });
  });

  // ── HANS alert routes ──────────────────────────────────────────────────────

  // GET /api/geohazardwatch/hans/elevated?alertLevel=&colorCode=&observatory=
  router.get('/hans/elevated', (req, res) => {
    const mgr = engine.getManager('HansDataManager');
    if (!mgr) return res.status(503).json({ error: 'HansDataManager not available — run npm run import:hans' });

    const filters = {};
    if (req.query.alertLevel)  filters.alertLevel  = String(req.query.alertLevel);
    if (req.query.colorCode)   filters.colorCode   = String(req.query.colorCode);
    if (req.query.observatory) filters.observatory = String(req.query.observatory);

    const alerts = mgr.getElevated(filters);
    res.json({ elevated: alerts, total: alerts.length });
  });

  // GET /api/geohazardwatch/hans/volcano/:number
  router.get('/hans/volcano/:number', (req, res) => {
    const mgr = engine.getManager('HansDataManager');
    if (!mgr) return res.status(503).json({ error: 'HansDataManager not available' });

    const alert = mgr.getAlert(req.params.number);
    if (!alert) return res.json({ volcanoNumber: req.params.number, alert: null, elevated: false });
    res.json({ volcanoNumber: req.params.number, alert, elevated: true });
  });

  // GET /api/geohazardwatch/hans/status
  router.get('/hans/status', (req, res) => {
    const mgr = engine.getManager('HansDataManager');
    if (!mgr) return res.status(503).json({ error: 'HansDataManager not available' });

    res.json(mgr.status());
  });

  return router;
};

/** @param {Record<string, unknown>} q */
function parseEqFilters(q) {
  const f = {};
  if (q.minMagnitude)  f.minMagnitude  = Number(q.minMagnitude);
  if (q.maxMagnitude)  f.maxMagnitude  = Number(q.maxMagnitude);
  if (q.minDepth)      f.minDepth      = Number(q.minDepth);
  if (q.maxDepth)      f.maxDepth      = Number(q.maxDepth);
  if (q.nearVolcano === 'true')  f.nearVolcano  = true;
  if (q.tsunamiOnly === 'true')  f.tsunamiOnly  = true;
  if (q.alert)         f.alert         = String(q.alert);
  if (q.volcanoNumber) f.volcanoNumber = Number(q.volcanoNumber);
  if (q.limit)         f.limit         = Number(q.limit);
  if (q.offset)        f.offset        = Number(q.offset);
  return f;
}

/** @param {Record<string, unknown>} q */
function parseFilters(q) {
  const filters = {};
  if (q.q)               filters.query = String(q.q);
  if (q.query)           filters.query = String(q.query);
  if (q.country)         filters.country = String(q.country);
  if (q.region)          filters.region = String(q.region);
  if (q.volcanoType)     filters.volcanoType = String(q.volcanoType);
  if (q.rockType)        filters.rockType = String(q.rockType);
  if (q.tectonicSetting) filters.tectonicSetting = String(q.tectonicSetting);
  if (q.epoch)           filters.epoch = String(q.epoch);
  if (q.minElevation)    filters.minElevation = Number(q.minElevation);
  if (q.maxElevation)    filters.maxElevation = Number(q.maxElevation);
  if (q.minLatitude)     filters.minLatitude = Number(q.minLatitude);
  if (q.maxLatitude)     filters.maxLatitude = Number(q.maxLatitude);
  if (q.minLongitude)    filters.minLongitude = Number(q.minLongitude);
  if (q.maxLongitude)    filters.maxLongitude = Number(q.maxLongitude);
  if (q.limit)           filters.limit = Number(q.limit);
  if (q.offset)          filters.offset = Number(q.offset);
  return filters;
}
