'use strict';

const express = require('express');

/**
 * Admin routes for the geohazardwatch add-on.
 * Mounted at /addons/geohazardwatch in register().
 *
 * GET  /                 — status dashboard (authenticated)
 * POST /jobs/hans        — trigger HANS import (admin only)
 * POST /jobs/earthquakes — trigger earthquake import (admin only)
 * POST /jobs/vaac        — trigger VAAC advisory import (admin only)
 *
 * @param {import('../../../src/types/WikiEngine').WikiEngine} engine
 * @returns {express.Router}
 */
module.exports = function adminRoutes(engine) {
  const router = express.Router();

  function requireAuthenticated(req, res) {
    const uc = req.userContext ?? {};
    if (!uc.isAuthenticated) {
      res.status(401).send('Authentication required');
      return false;
    }
    return true;
  }

  function requireAdmin(req, res) {
    const uc = req.userContext ?? {};
    if (!uc.isAuthenticated) {
      res.status(401).send('Authentication required');
      return false;
    }
    if (!Array.isArray(uc.roles) || !uc.roles.includes('admin')) {
      res.status(403).send('Admin access required');
      return false;
    }
    return true;
  }

  // ── GET / — status dashboard ─────────────────────────────────────────────
  router.get('/', (req, res) => {
    if (!requireAuthenticated(req, res)) return;

    const uc = req.userContext ?? {};
    const isAdmin = Array.isArray(uc.roles) && uc.roles.includes('admin');

    const dm  = engine.getManager('VolcanoDataManager');
    const em  = engine.getManager('EarthquakeDataManager');
    const hm  = engine.getManager('HansDataManager');
    const vm  = engine.getManager('VaacDataManager');

    const volcanoCount    = dm  ? dm.volcanoCount()             : 0;
    const eruptionCount   = dm  ? dm.eruptionCount()            : 0;
    const earthquakeCount = em  ? em.count()                    : 0;
    const nearVolcanoCount = em ? em.nearVolcanoCount()         : 0;
    const hansStatus      = hm  ? hm.status()                   : { fetchedUtc: null, monitoredCount: 0, elevatedCount: 0 };
    const elevatedAlerts  = hm  ? hm.getElevated().slice(0, 10) : [];
    const vaacStatus      = vm  ? vm.status()                    : { fetchedUtc: null, totalCount: 0 };
    const activeAdvisories = vm ? vm.getActive().slice(0, 10)   : [];

    res.render('admin-geohazardwatch', {
      currentUser: req.userContext,
      isAdmin,
      volcanoCount,
      eruptionCount,
      earthquakeCount,
      nearVolcanoCount,
      hansStatus,
      elevatedAlerts,
      vaacStatus,
      activeAdvisories,
      flash: typeof req.query.flash === 'string' ? req.query.flash : null
    });
  });

  // ── POST /jobs/hans — trigger HANS refresh ───────────────────────────────
  router.post('/jobs/hans', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const jm = engine.getManager('BackgroundJobManager');
    if (!jm) { res.status(503).send('BackgroundJobManager not available'); return; }
    jm.enqueue('geohazardwatch.import-hans');
    res.redirect('/addons/geohazardwatch?flash=hans-queued');
  });

  // ── POST /jobs/earthquakes — trigger earthquake refresh ──────────────────
  router.post('/jobs/earthquakes', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const jm = engine.getManager('BackgroundJobManager');
    if (!jm) { res.status(503).send('BackgroundJobManager not available'); return; }
    jm.enqueue('geohazardwatch.import-earthquakes');
    res.redirect('/addons/geohazardwatch?flash=eq-queued');
  });

  // ── POST /jobs/vaac — trigger VAAC advisory refresh ───────────────────────
  router.post('/jobs/vaac', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const jm = engine.getManager('BackgroundJobManager');
    if (!jm) { res.status(503).send('BackgroundJobManager not available'); return; }
    jm.enqueue('geohazardwatch.import-vaac');
    res.redirect('/addons/geohazardwatch?flash=vaac-queued');
  });

  return router;
};
