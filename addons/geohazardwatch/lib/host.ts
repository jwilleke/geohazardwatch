/**
 * Runtime imports of ngdpbase helpers. Packaged addons cannot use the
 * bundled-addon relative `../../dist/...` path: this package lives at
 * `node_modules/@jwilleke/geohazardwatch-addon`, while the host `dist/`
 * is at the process cwd (`/app` in the image). Type-only imports use
 * `#ngdpbase/*` (tsconfig paths → `.ngdpbase-src`).
 */
import path from 'path';
import { pathToFileURL } from 'url';
import type { Request } from 'express';
import type * as BootActions from '#ngdpbase/context/bootActions.js';
import type * as JobContextMod from '#ngdpbase/context/JobContext.js';
import type * as ApiContextMod from '#ngdpbase/context/ApiContext.js';

const distSrc = path.join(process.cwd(), 'dist/src');

const boot = (await import(
  pathToFileURL(path.join(distSrc, 'context/bootActions.js')).href
)) as typeof BootActions;

const job = (await import(
  pathToFileURL(path.join(distSrc, 'context/JobContext.js')).href
)) as typeof JobContextMod;

const api = (await import(
  pathToFileURL(path.join(distSrc, 'context/ApiContext.js')).href
)) as typeof ApiContextMod;

export const scheduleContext = boot.scheduleContext;
export const jobContextFromRequest = job.jobContextFromRequest;
export const ApiContext = api.ApiContext;
export const ApiError = api.ApiError;

/**
 * ngdpbase's Express augmentation (`req.userContext`, `req.session`) is a
 * `.d.ts` in its `src/types/` that is not shipped in `dist/`, so a packaged
 * addon's typecheck cannot see it (geohazardwatch#348; upstream issue linked
 * there). These read the two fields the admin view needs without restating
 * ngdpbase's types. Drop them once the augmentation ships with `dist/`.
 */
type HostRequest = Request & {
  userContext?: unknown;
  session?: { csrfToken?: string };
};

/** The request's identity, forwarded untouched to the view (never rebuilt). */
export function requestUserContext(req: Request): unknown {
  return (req as HostRequest).userContext;
}

/** The session's CSRF token for forms that POST back to this addon. */
export function requestCsrfToken(req: Request): string | undefined {
  return (req as HostRequest).session?.csrfToken;
}
