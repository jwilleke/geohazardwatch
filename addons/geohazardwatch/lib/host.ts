/**
 * Runtime imports of ngdpbase helpers. Packaged addons cannot use the
 * bundled-addon relative `../../dist/...` path: this package lives at
 * `node_modules/@jwilleke/geohazardwatch-addon`, while the host `dist/`
 * is at the process cwd (`/app` in the image). Type-only imports use
 * `#ngdpbase/*` (tsconfig paths → `.ngdpbase-src`).
 */
import path from 'path';
import { pathToFileURL } from 'url';
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
