/**
 * Outbound HTTP for the importers (ngdpbase#2054). Requests go through core's
 * `guardedFetch` under the site's egress policy; this module only turns a
 * response into parsed JSON. It never loads core: the caller hands it the
 * guarded fetch (`host.guardedFetch` in the add-on, ../import/cli.ts for a
 * manual run) and the policy.
 *
 * No User-Agent and no timeout of our own: a request that names none is sent
 * with the site's User-Agent (`ngdpbase.http.user-agent`) and core's 30 s
 * timeout, as the add-on guide asks. The size limit is the add-on's
 * `maxResponseBytes`: GVP's Holocene eruptions alone are larger than core's
 * 8 MiB default.
 */
import type { guardedFetch } from '#ngdpbase/http/guardedFetch.js';
import type { EgressPolicy } from '#ngdpbase/http/ssrf.js';

export type GuardedFetch = typeof guardedFetch;

/** GET `url` and parse it as JSON; a non-2xx status throws, naming `label`. */
export type FetchJson = <T>(url: string, label: string) => Promise<T>;

export function guardedFetchJson(
  fetch: GuardedFetch,
  policy: EgressPolicy,
  maxBytes?: number
): FetchJson {
  return async <T>(url: string, label: string): Promise<T> => {
    const res = await fetch(url, maxBytes ? { policy, maxBytes } : { policy });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to fetch ${label}: HTTP ${res.status}`);
    }
    return JSON.parse(res.body.toString('utf8')) as T;
  };
}
