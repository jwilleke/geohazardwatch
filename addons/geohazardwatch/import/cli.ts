/**
 * The guarded fetch for a manual run of an import script from a shell
 * (ngdpbase#2054). Only the scripts' command-line entry points load this, and
 * only when run as a command: the add-on's jobs use `host.guardedFetch` and
 * never import it. It loads core's `guardedFetch` and the default egress
 * policy from the built ngdpbase in the current directory, since a shell has
 * no host to hand them over.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type * as GuardedFetchMod from '#ngdpbase/http/guardedFetch.js';
import type * as EgressPolicyMod from '#ngdpbase/http/egressPolicy.js';
import { guardedFetchJson, type FetchJson } from '../lib/fetch.js';

const distSrc = path.join(process.cwd(), 'dist/src');
const defaultsFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'config',
  'default-config.json'
);

/** Core's guarded fetch under its default egress policy and the add-on's shipped size limit, as JSON. */
export async function cliFetchJson(): Promise<FetchJson> {
  const guarded = (await import(
    pathToFileURL(path.join(distSrc, 'http/guardedFetch.js')).href
  )) as typeof GuardedFetchMod;
  const egress = (await import(
    pathToFileURL(path.join(distSrc, 'http/egressPolicy.js')).href
  )) as typeof EgressPolicyMod;
  const policy = egress.resolveEgressPolicy((_key, fallback) => fallback).policy;
  const defaults = JSON.parse(fs.readFileSync(defaultsFile, 'utf8')) as Record<string, unknown>;
  const maxBytes = Number(defaults['ngdpbase.addons.geohazardwatch.maxResponseBytes']) || undefined;
  return guardedFetchJson(guarded.guardedFetch, policy, maxBytes);
}

/** The value after `--data-dir`, or `fallback`. */
export function dataDirArg(args: string[], fallback: string): string {
  const i = args.indexOf('--data-dir');
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
