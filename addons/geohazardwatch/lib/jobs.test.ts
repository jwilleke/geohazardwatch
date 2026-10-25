/**
 * The data refresh as core scheduled jobs (ngdpbase#2054): registration with
 * the default schedules, a run through the host's guarded fetch, no timer of
 * the add-on's own, and a failed fetch reported as a failed run.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { JobDefinition, JobRunContext } from '#ngdpbase/managers/BackgroundJobManager.js';
import type { GuardedResponse } from '#ngdpbase/http/guardedFetch.js';
import type { EgressPolicy } from '#ngdpbase/http/ssrf.js';
import { JOB_IDS, registerJobs, type JobDeps } from './jobs.js';
import { guardedFetchJson, type GuardedFetch } from './fetch.js';

const ADDON = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'ngdpbase.addons.geohazardwatch.';

/** The add-on's config as core hands it to register(): its shipped defaults, prefix stripped. */
function shippedConfig(): Record<string, unknown> {
  const defaults = JSON.parse(
    fs.readFileSync(path.join(ADDON, 'config/default-config.json'), 'utf8')
  ) as Record<string, unknown>;
  const config: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (key.startsWith(PREFIX)) config[key.slice(PREFIX.length)] = value;
  }
  return config;
}

interface FakeJobManager {
  defs: Map<string, JobDefinition>;
  registerJob(def: JobDefinition): void;
}

function fakeJobManager(): FakeJobManager {
  const defs = new Map<string, JobDefinition>();
  return {
    defs,
    registerJob: (def: JobDefinition) => {
      defs.set(def.id, def);
    }
  };
}

const ctx = {} as JobRunContext;
const policy = { deniedRanges: [], allowedRanges: [] } as unknown as EgressPolicy;

function respond(status: number, body: unknown): GuardedResponse {
  return {
    status,
    headers: {},
    body: Buffer.from(JSON.stringify(body)),
    url: ''
  } as unknown as GuardedResponse;
}

/** A stand-in for host.guardedFetch: answers each upstream with a small fixture and records what was asked. */
function mockGuardedFetch(
  calls: Array<{ url: string; policy: unknown; maxBytes?: number }>
): GuardedFetch {
  return (async (url: string, options: { policy: EgressPolicy; maxBytes?: number }) => {
    calls.push({ url, policy: options.policy, maxBytes: options.maxBytes });
    if (url.includes('Holocene_Volcanoes')) {
      return respond(200, {
        totalFeatures: 1,
        features: [
          {
            properties: {
              Volcano_Number: 211060,
              Volcano_Name: 'Etna',
              Country: 'Italy',
              Latitude: 37.75,
              Longitude: 14.99
            }
          }
        ]
      });
    }
    if (url.includes('Pleistocene_Volcanoes')) {
      return respond(200, {
        totalFeatures: 1,
        features: [
          { properties: { Volcano_Number: 999001, Volcano_Name: 'Old One', Country: 'Nowhere' } }
        ]
      });
    }
    if (url.includes('Holocene_Eruptions')) {
      return respond(200, {
        totalFeatures: 1,
        features: [
          { properties: { Volcano_Number: 211060, Volcano_Name: 'Etna', Eruption_Number: 1 } }
        ]
      });
    }
    if (url.includes('E3WebApp_Eruptions1960')) {
      return respond(200, {
        totalFeatures: 1,
        features: [
          {
            properties: {
              VolcanoNumber: 211060,
              VolcanoName: 'Etna',
              ContinuingEruption: 'True',
              StartDateYear: 2026
            }
          }
        ]
      });
    }
    if (url.includes('earthquake.usgs.gov')) {
      return respond(200, {
        metadata: { title: 'M4.5+ past week' },
        features: [
          {
            id: 'q1',
            properties: { mag: 4.6, time: 0, updated: 0 },
            geometry: { coordinates: [15.0, 37.7, 10] }
          }
        ]
      });
    }
    if (url.includes('getElevatedVolcanoes')) {
      return respond(200, [
        { vnum: '211060', volcano_name: 'Etna', alert_level: 'WATCH', color_code: 'ORANGE' }
      ]);
    }
    if (url.includes('getDailySummaryData')) return respond(200, []);
    if (url.includes('getMonitoredVolcanoes'))
      return respond(200, [{ vnum: '211060' }, { vnum: '311240' }]);
    return respond(404, {});
  }) as unknown as GuardedFetch;
}

function deps(
  dataPath: string,
  fetch: GuardedFetch,
  reloaded: string[] = [],
  errors: string[] = []
): JobDeps {
  return {
    dataPath,
    config: shippedConfig(),
    fetchJson: () => guardedFetchJson(fetch, policy),
    reload: {
      volcanoes: async () => {
        reloaded.push('volcanoes');
      },
      earthquakes: async () => {
        reloaded.push('earthquakes');
      },
      hans: async () => {
        reloaded.push('hans');
      }
    },
    log: {
      error: (m: string) => {
        errors.push(m);
      }
    }
  };
}

// Only the folders these tests made are removed, never anything else.
const made: string[] = [];
function tmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghw-jobs-'));
  made.push(dir);
  return dir;
}
after(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
});

describe('geohazardwatch jobs (ngdpbase#2054)', () => {
  it('registers each job with its default schedule from config/default-config.json', () => {
    const jm = fakeJobManager();
    const errors: string[] = [];
    registerJobs(jm, deps(tmp(), mockGuardedFetch([]), [], errors));
    assert.deepEqual([...jm.defs.keys()].sort(), Object.values(JOB_IDS).sort());
    assert.deepEqual(jm.defs.get(JOB_IDS.volcanoes)?.schedule, {
      rrule: 'daily 08:00',
      tz: 'America/New_York'
    });
    assert.equal(jm.defs.get(JOB_IDS.earthquakes)?.schedule, 'every 20m');
    assert.equal(jm.defs.get(JOB_IDS.hans)?.schedule, 'every 10m');
    for (const def of jm.defs.values()) {
      assert.equal(def.persist, true, def.id);
      assert.equal(def.permission, 'admin-system', def.id);
      assert.equal(def.overlap, 'skip', def.id);
    }
    assert.deepEqual(errors, []);
  });

  it('registers a job with no schedule configured unscheduled, and says so', () => {
    const jm = fakeJobManager();
    const errors: string[] = [];
    const d = deps(tmp(), mockGuardedFetch([]), [], errors);
    delete d.config['hansSchedule'];
    registerJobs(jm, d);
    assert.equal(jm.defs.get(JOB_IDS.hans)?.schedule, undefined);
    assert.ok(jm.defs.has(JOB_IDS.hans));
    assert.match(errors.join('\n'), /geohazardwatch\.import-hans is not scheduled/);
  });

  it('a run imports through the guarded fetch it is handed and writes where the managers read', async () => {
    const dir = tmp();
    const calls: Array<{ url: string; policy: unknown }> = [];
    const reloaded: string[] = [];
    const jm = fakeJobManager();
    registerJobs(jm, deps(dir, mockGuardedFetch(calls), reloaded));

    const volcano = await jm.defs.get(JOB_IDS.volcanoes)!.run(() => undefined, ctx);
    assert.equal(volcano.success, true, volcano.error);
    assert.match(volcano.summary ?? '', /^2 volcanoes/);
    for (const file of ['volcanoes.json', 'eruptions.json', 'global-activity.json']) {
      assert.ok(fs.existsSync(path.join(dir, file)), file);
    }

    const quakes = await jm.defs.get(JOB_IDS.earthquakes)!.run(() => undefined, ctx);
    assert.equal(quakes.success, true, quakes.error);
    assert.equal(quakes.summary, '1 earthquakes (1 near volcanoes)');

    const hans = await jm.defs.get(JOB_IDS.hans)!.run(() => undefined, ctx);
    assert.equal(hans.success, true, hans.error);
    assert.equal(hans.summary, '1 elevated of 2 monitored');
    assert.ok(fs.existsSync(path.join(dir, 'activity.json')));

    assert.ok(calls.length >= 8, `${calls.length} requests`);
    for (const c of calls) assert.equal(c.policy, policy, c.url);
    assert.deepEqual(reloaded, ['volcanoes', 'earthquakes', 'hans']);
  });

  it('a failed fetch is a failed run, reported, not an exception; the old snapshot stays', async () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, 'activity.json'), '{"previous":true}');
    const reloaded: string[] = [];
    const jm = fakeJobManager();
    const down = (async () => respond(503, {})) as unknown as GuardedFetch;
    registerJobs(jm, deps(dir, down, reloaded));
    const result = await jm.defs.get(JOB_IDS.hans)!.run(() => undefined, ctx);
    assert.equal(result.success, false);
    assert.match(result.error ?? '', /USGS HANS import failed: Failed to fetch .*HTTP 503/);
    assert.equal(fs.readFileSync(path.join(dir, 'activity.json'), 'utf8'), '{"previous":true}');
    assert.deepEqual(reloaded, []);

    const refused = (async () => {
      throw new Error('egress refused');
    }) as unknown as GuardedFetch;
    const jm2 = fakeJobManager();
    registerJobs(jm2, deps(dir, refused));
    const r2 = await jm2.defs.get(JOB_IDS.earthquakes)!.run(() => undefined, ctx);
    assert.equal(r2.success, false);
    assert.match(r2.error ?? '', /egress refused/);
  });
});

describe('register() (ngdpbase#2054)', () => {
  const cwd = process.cwd();
  let stubRoot = '';

  before(() => {
    // lib/host.ts loads core's request contexts from dist/ in the working
    // directory; stand them in, so register() can be called without a site.
    stubRoot = tmp();
    const ctxDir = path.join(stubRoot, 'dist/src/context');
    fs.mkdirSync(ctxDir, { recursive: true });
    fs.writeFileSync(
      path.join(ctxDir, 'JobContext.js'),
      'export const jobContextFromRequest = () => ({});\n'
    );
    fs.writeFileSync(
      path.join(ctxDir, 'ApiContext.js'),
      'export class ApiContext {}\nexport class ApiError extends Error {}\n'
    );
    process.chdir(stubRoot);
  });

  after(() => {
    process.chdir(cwd);
  });

  it('registers the jobs on their schedules and starts no timer of its own', async () => {
    const { default: addon } = await import('../index.js');
    const jm = fakeJobManager();
    const managers = new Map<string, unknown>([['BackgroundJobManager', jm]]);
    const app = { use: () => undefined, get: () => [], set: () => undefined };
    const engine = {
      app,
      registerManager: (name: string, m: unknown) => {
        managers.set(name, m);
      },
      getManager: (name: string) => managers.get(name),
      setCapability: () => undefined
    };
    const fetchCalls: Array<{ url: string; policy: unknown; maxBytes?: number }> = [];
    const host = {
      guardedFetch: mockGuardedFetch(fetchCalls),
      resolveEgressPolicy: () => ({ policy }),
      logger: { error: () => undefined }
    };

    const realSetInterval = globalThis.setInterval;
    let timers = 0;
    globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
      timers++;
      return realSetInterval(...args);
    }) as typeof setInterval;
    try {
      await addon.register(engine as never, { ...shippedConfig(), dataPath: tmp() }, host as never);
    } finally {
      globalThis.setInterval = realSetInterval;
    }

    assert.equal(timers, 0, 'register() started a timer');
    assert.equal(jm.defs.get(JOB_IDS.hans)?.schedule, 'every 10m');
    assert.equal(jm.defs.get(JOB_IDS.earthquakes)?.schedule, 'every 20m');
    assert.deepEqual(jm.defs.get(JOB_IDS.volcanoes)?.schedule, {
      rrule: 'daily 08:00',
      tz: 'America/New_York'
    });

    // The job registered by register() fetches through host.guardedFetch.
    const hans = await jm.defs.get(JOB_IDS.hans)!.run(() => undefined, ctx);
    assert.equal(hans.success, true, hans.error);
    assert.ok(fetchCalls.some((c) => c.url.includes('volcanoes.usgs.gov/hans-public')));
    // GVP's eruptions exceed core's 8 MiB default; the shipped limit is passed on.
    for (const c of fetchCalls)
      assert.equal(c.maxBytes, shippedConfig()['maxResponseBytes'], c.url);
    await addon.shutdown?.();
  });
});
