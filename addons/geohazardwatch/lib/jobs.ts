/**
 * The add-on's data refresh as core scheduled jobs (ngdpbase#2054).
 *
 * Each import is a job on core's BackgroundJobManager with a schedule read from
 * the add-on's configuration (`ngdpbase.addons.geohazardwatch.<job>Schedule`,
 * defaults in ../config/default-config.json). Core runs each slot once as the
 * system principal, retries a failed one, audits and notifies, survives
 * restarts, and gives admins Run now under Admin → Scheduled Jobs. The add-on
 * keeps no timer of its own.
 *
 * The import code is the same `runImport` the scripts in ../import/ run; a job
 * hands it the host's guarded fetch, under the egress policy as it is at that
 * run.
 */
import type BackgroundJobManager from '#ngdpbase/managers/BackgroundJobManager.js';
import type { JobDefinition, JobResult } from '#ngdpbase/managers/BackgroundJobManager.js';
import type { ScheduleInput } from '#ngdpbase/utils/schedule.js';
import type { FetchJson } from './fetch.js';
import { runImport as runVolcanoImport } from '../import/import-volcanoes.js';
import { DEFAULT_FEED, runImport as runEarthquakeImport } from '../import/import-earthquakes.js';
import { runImport as runHansImport } from '../import/import-hans.js';

export const JOB_IDS = {
  volcanoes: 'geohazardwatch.import-volcanoes',
  earthquakes: 'geohazardwatch.import-earthquakes',
  hans: 'geohazardwatch.import-hans'
} as const;

/** The add-on config key (prefix stripped) that holds each job's schedule. */
export const SCHEDULE_KEYS = {
  volcanoes: 'volcanoesSchedule',
  earthquakes: 'earthquakesSchedule',
  hans: 'hansSchedule'
} as const;

type JobName = keyof typeof JOB_IDS;

export interface JobDeps {
  /** Where the add-on's managers read their files; the jobs write there. */
  dataPath: string;
  /** The add-on's configuration, as `register()` gets it. */
  config: Record<string, unknown>;
  /** A guarded JSON fetch, made at each run so a changed egress policy applies. */
  fetchJson: () => FetchJson;
  /** Re-read a manager's files once its import has written them. */
  reload: Record<JobName, () => Promise<void>>;
  log: { error(message: string): void };
}

/** The permission the add-on's own refresh routes ask for; a cut-off Run now restarts only for a holder. */
const RUN_PERMISSION = 'admin-system';

function scheduleOf(config: Record<string, unknown>, name: JobName): ScheduleInput | undefined {
  const value = config[SCHEDULE_KEYS[name]];
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { rrule?: unknown }).rrule === 'string'
  ) {
    return value as ScheduleInput;
  }
  return undefined;
}

/** A failed fetch or write is a failed run for core to retry and report, never an exception out of the job. */
async function outcome(label: string, work: () => Promise<string>): Promise<JobResult> {
  try {
    return { success: true, summary: await work() };
  } catch (err) {
    return {
      success: false,
      error: `${label} failed: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

export function jobDefinitions(deps: JobDeps): Record<JobName, JobDefinition> {
  const { dataPath, reload } = deps;
  return {
    volcanoes: {
      id: JOB_IDS.volcanoes,
      displayName: 'GeoHazardWatch: refresh GVP volcanoes, eruptions and global activity',
      run: (reportProgress) =>
        outcome('GVP import', async () => {
          reportProgress('Fetching GVP volcanoes, eruptions and global activity…');
          const r = await runVolcanoImport(
            dataPath,
            { eruptions: true, activity: true },
            deps.fetchJson()
          );
          await reload.volcanoes();
          return `${r.total} volcanoes (${r.holocene} Holocene, ${r.pleistocene} Pleistocene)`;
        })
    },
    earthquakes: {
      id: JOB_IDS.earthquakes,
      displayName: 'GeoHazardWatch: refresh USGS earthquakes',
      // Every 20 minutes: a success is neither audited nor notified; a failure still is.
      routine: true,
      run: (reportProgress) =>
        outcome('USGS earthquake import', async () => {
          reportProgress('Fetching USGS earthquake feed…');
          const r = await runEarthquakeImport(dataPath, DEFAULT_FEED, deps.fetchJson());
          await reload.earthquakes();
          return `${r.total} earthquakes (${r.nearVolcano} near volcanoes)`;
        })
    },
    hans: {
      id: JOB_IDS.hans,
      displayName: 'GeoHazardWatch: refresh USGS HANS volcano alerts',
      // Every 10 minutes: a success is neither audited nor notified; a failure still is.
      routine: true,
      run: (reportProgress) =>
        outcome('USGS HANS import', async () => {
          reportProgress('Fetching USGS HANS API…');
          const r = await runHansImport(dataPath, deps.fetchJson());
          await reload.hans();
          return `${r.elevatedCount} elevated of ${r.monitoredCount} monitored`;
        })
    }
  };
}

/**
 * Register the three jobs, each on its configured schedule. A job whose
 * schedule is missing or does not compile is still registered, unscheduled,
 * so Run now works; the reason is logged as an error.
 */
export function registerJobs(
  jobManager: Pick<BackgroundJobManager, 'registerJob'>,
  deps: JobDeps
): void {
  const defs = jobDefinitions(deps);
  for (const name of Object.keys(defs) as JobName[]) {
    const def: JobDefinition = { ...defs[name], persist: true, permission: RUN_PERMISSION };
    const schedule = scheduleOf(deps.config, name);
    if (schedule === undefined) {
      deps.log.error(
        `${def.id} is not scheduled: ngdpbase.addons.geohazardwatch.${SCHEDULE_KEYS[name]} is not set`
      );
      jobManager.registerJob(def);
      continue;
    }
    try {
      // Each run replaces a snapshot, so a repeat is harmless; a slot that came
      // due during a run is pointless once that run has fetched.
      jobManager.registerJob({ ...def, schedule, catchUp: 'latest', overlap: 'skip' });
    } catch (err) {
      deps.log.error(
        `${def.id} is not scheduled: ${err instanceof Error ? err.message : String(err)}`
      );
      jobManager.registerJob(def);
    }
  }
}
