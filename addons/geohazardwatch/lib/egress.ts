/**
 * Outbound HTTP for the import scripts (#349). ngdpbase's `check-http-boundary`
 * forbids global `fetch()` in addons: requests go through core's `guardedFetch`
 * under the operator's egress policy. Loaded from the host `dist/` at runtime,
 * as in ./host.ts, but kept apart from it so the CLI importers do not pull in
 * core's boot and request contexts.
 */
import path from 'path';
import { pathToFileURL } from 'url';
import type * as GuardedFetchMod from '#ngdpbase/http/guardedFetch.js';
import type * as EgressPolicyMod from '#ngdpbase/http/egressPolicy.js';
import type { EgressPolicy } from '#ngdpbase/http/ssrf.js';

export type { EgressPolicy };
export type ConfigReader = EgressPolicyMod.ConfigReader;

const distSrc = path.join(process.cwd(), 'dist/src');

const guarded = (await import(
  pathToFileURL(path.join(distSrc, 'http/guardedFetch.js')).href
)) as typeof GuardedFetchMod;

const egress = (await import(
  pathToFileURL(path.join(distSrc, 'http/egressPolicy.js')).href
)) as typeof EgressPolicyMod;

/** The site's egress policy; with no reader (a CLI run), core's defaults. */
export function egressPolicy(read: ConfigReader = (_key, fallback) => fallback): EgressPolicy {
  return egress.resolveEgressPolicy(read).policy;
}

/** GET `url` and parse it as JSON; a non-2xx status throws, naming `label`. */
export async function fetchJson<T>(url: string, label: string, policy: EgressPolicy): Promise<T> {
  const res = await guarded.guardedFetch(url, { policy });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to fetch ${label}: HTTP ${res.status}`);
  }
  return JSON.parse(res.body.toString('utf8')) as T;
}
