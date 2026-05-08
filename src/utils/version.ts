#!/usr/bin/env tsx
/**
 * Version bump utility for geohazardwatch.
 *
 * Updates the version consistently across:
 *   - package.json
 *   - addons/geohazardwatch/index.js
 *   - CHANGELOG.md  (prepends a new [x.y.z] section)
 *
 * Usage:
 *   npx tsx src/utils/version.ts patch
 *   npx tsx src/utils/version.ts minor
 *   npx tsx src/utils/version.ts major
 *   npx tsx src/utils/version.ts 2.1.0      # explicit version
 *
 * Or via npm script:
 *   npm run version -- patch
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function writeFile(rel: string, content: string): void {
  fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
}

function currentVersion(): string {
  const pkg = JSON.parse(readFile('package.json')) as { version: string };
  return pkg.version;
}

function bumpVersion(current: string, bump: string): string {
  // Explicit semver supplied
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;

  const [major, minor, patch] = current.split('.').map(Number);
  switch (bump) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${bump}. Use major, minor, patch, or an explicit x.y.z.`);
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Updaters ──────────────────────────────────────────────────────────────────

function updatePackageJson(next: string): void {
  const pkg = JSON.parse(readFile('package.json')) as Record<string, unknown>;
  pkg.version = next;
  writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  package.json              ${next}`);
}

function updateIndexJs(next: string): void {
  const rel = 'addons/geohazardwatch/index.js';
  const content = readFile(rel);
  const updated = content.replace(
    /(\bversion:\s*['"])\d+\.\d+\.\d+(['"])/,
    `$1${next}$2`
  );
  if (updated === content) {
    console.warn('  addons/geohazardwatch/index.js  — version string not found, skipped');
    return;
  }
  writeFile(rel, updated);
  console.log(`  addons/geohazardwatch/index.js  ${next}`);
}

function updateChangelog(next: string, prev: string): void {
  const rel = 'CHANGELOG.md';
  const content = readFile(rel);

  const newSection = [
    `## [${next}] - ${today()}`,
    '',
    '### Added',
    '',
    '### Changed',
    '',
    '### Fixed',
    '',
  ].join('\n');

  const linkLine = `[${next}]: https://github.com/jwilleke/geohazardwatch/compare/v${prev}...v${next}`;

  // Insert new section before the first ## [x.y.z] heading
  const updated = content
    .replace(/^(## \[\d)/m, `${newSection}\n$1`)
    .replace(/(\[1\.0\.0\]:.*)/m, `${linkLine}\n$1`);

  writeFile(rel, updated);
  console.log(`  CHANGELOG.md              added [${next}] section`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  const bump = process.argv[2];
  if (!bump) {
    console.error('Usage: npm run version -- <major|minor|patch|x.y.z>');
    process.exit(1);
  }

  const prev = currentVersion();
  const next = bumpVersion(prev, bump);

  if (next === prev) {
    console.error(`Version is already ${prev}`);
    process.exit(1);
  }

  console.log(`\nBumping ${prev} → ${next}\n`);
  updatePackageJson(next);
  updateIndexJs(next);
  updateChangelog(next, prev);

  console.log(`\nNext steps:`);
  console.log(`  1. Fill in the [${next}] section in CHANGELOG.md`);
  console.log(`  2. git add -A && git commit -m "chore: release v${next}"`);
  console.log(`  3. git tag -a v${next} -m "geohazardwatch v${next}"`);
}

main();
