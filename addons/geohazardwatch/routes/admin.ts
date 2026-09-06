/**
 * Admin routes for the geohazardwatch add-on.
 * Mounted at /addons/geohazardwatch in register().
 */

import { Router, type Request, type Response } from 'express';
import { ApiContext, ApiError, jobContextFromRequest } from '../lib/host.js';
import type { WikiEngine } from '#ngdpbase/types/WikiEngine.js';
import type BackgroundJobManager from '#ngdpbase/managers/BackgroundJobManager.js';
import type VolcanoDataManager from '../managers/VolcanoDataManager.js';
import type EarthquakeDataManager from '../managers/EarthquakeDataManager.js';
import type HansDataManager from '../managers/HansDataManager.js';

export default function adminRoutes(engine: WikiEngine): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    void (async () => {
      try {
        const ctx = ApiContext.from(req, engine);
        ctx.requireAuthenticated();

        const isAdmin = ctx.roles.includes('admin');
        const dm = engine.getManager<VolcanoDataManager>('VolcanoDataManager');
        const em = engine.getManager<EarthquakeDataManager>('EarthquakeDataManager');
        const hm = engine.getManager<HansDataManager>('HansDataManager');

        res.render('admin-geohazardwatch', {
          currentUser: { username: ctx.username, roles: ctx.roles, isAuthenticated: ctx.isAuthenticated },
          isAdmin,
          volcanoCount: dm ? dm.volcanoCount() : 0,
          eruptionCount: dm ? dm.eruptionCount() : 0,
          earthquakeCount: em ? em.count() : 0,
          nearVolcanoCount: em ? em.nearVolcanoCount() : 0,
          hansStatus: hm ? hm.status() : { fetchedUtc: null, monitoredCount: 0, elevatedCount: 0 },
          elevatedAlerts: hm ? hm.getElevated().slice(0, 10) : [],
          flash: typeof req.query['flash'] === 'string' ? req.query['flash'] : null
        });
      } catch (err) {
        if (err instanceof ApiError) {
          res.status((err as { status: number }).status).send(err.message);
          return;
        }
        res.status(500).send(err instanceof Error ? err.message : String(err));
      }
    })();
  });

  router.post('/jobs/hans', (req: Request, res: Response) => {
    void (async () => {
      try {
        const ctx = ApiContext.from(req, engine);
        ctx.requireAuthenticated();
        await ctx.requirePermission('admin-system');
        const jm = engine.getManager<BackgroundJobManager>('BackgroundJobManager');
        if (!jm) {
          res.status(503).send('BackgroundJobManager not available');
          return;
        }
        jm.enqueue('geohazardwatch.import-hans', jobContextFromRequest({
          username: ctx.username ?? undefined,
          viaToken: ctx.viaToken,
          viaShare: ctx.viaShare
        })).catch((err: unknown) => {
          console.error('[geohazardwatch] enqueue of geohazardwatch.import-hans failed:', err);
        });
        res.redirect('/addons/geohazardwatch?flash=hans-queued');
      } catch (err) {
        if (err instanceof ApiError) {
          res.status((err as { status: number }).status).send(err.message);
          return;
        }
        res.status(500).send(err instanceof Error ? err.message : String(err));
      }
    })();
  });

  router.post('/jobs/earthquakes', (req: Request, res: Response) => {
    void (async () => {
      try {
        const ctx = ApiContext.from(req, engine);
        ctx.requireAuthenticated();
        await ctx.requirePermission('admin-system');
        const jm = engine.getManager<BackgroundJobManager>('BackgroundJobManager');
        if (!jm) {
          res.status(503).send('BackgroundJobManager not available');
          return;
        }
        jm.enqueue('geohazardwatch.import-earthquakes', jobContextFromRequest({
          username: ctx.username ?? undefined,
          viaToken: ctx.viaToken,
          viaShare: ctx.viaShare
        })).catch((err: unknown) => {
          console.error('[geohazardwatch] enqueue of geohazardwatch.import-earthquakes failed:', err);
        });
        res.redirect('/addons/geohazardwatch?flash=eq-queued');
      } catch (err) {
        if (err instanceof ApiError) {
          res.status((err as { status: number }).status).send(err.message);
          return;
        }
        res.status(500).send(err instanceof Error ? err.message : String(err));
      }
    })();
  });

  return router;
}
