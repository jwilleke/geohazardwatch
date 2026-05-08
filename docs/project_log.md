# Project Log

This document tracks ongoing work and session history for the ve-geology project.

## Format

```
### yyyy-MM-dd-##

- **Agent:** [Claude/Gemini/Other]
- **Subject:** [Brief description]
- **Work Done:**
  - [task 1]
  - [task 2]
- **Commits:** [hash list]
- **Files Modified:**
  - [file1.js]
  - [file2.md]
```

## Current Status

- **Phase:** Active development — core addon complete, data sources expanding
- **Build Status:** No build step (CommonJS JS). Lint passing (`npm run lint`)
- **Last Updated:** 2026-05-08
- **Overall Health:** Stable. v1.1.6 released; `[Unreleased]` carries the full rebadge from `ve-geology` to `geohazardwatch` (runtime identity, not just repo name). Lint clean.

## Next Steps

- ~~Add pagination to VolcanoList and EarthquakeList (ve-geology#1)~~ ✓ done
- ~~Add end-user plugin documentation wiki pages (ve-geology#9)~~ ✓ done
- ~~Implement periodic data refresh via BackgroundJobManager (ve-geology#8)~~ ✓ done
- Implement `system-category: addon` in ngdpbase seedAddonPages (ngdpbase#414)
- Implement Domain vs Additive addon type distinction (ngdpbase#415)
- Admin panel Add-ons section (ngdpbase#412)
- New data sources (ve-geology#4 FIRMS, #5 VAACs, #6 MIROVA, #7 VolcanoDiscovery) — require licensing/API key review

---

## Session Logs

### 2026-05-08-02

- **Agent:** Claude Opus 4.7
- **Subject:** Full rebadge from `ve-geology` to `geohazardwatch` (runtime identity, not just repo name)
- **Work Done:**
  - Renamed npm package name, addon directory, REST API and admin mount paths, config keys (`ngdpbase.addons.geohazardwatch.*`), background job IDs, capability flag, default `dataPath`, stylesheet path, and dashboard title.
  - Updated all 5 plugin files, both routes files, import scripts, EJS admin view, CSS banner comment, `default-config.json`, `Dockerfile`, `publish-image.yml`, `version.ts`, and `.gitignore`/`.dockerignore` paths and workspace pattern.
  - Swept top-level `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SETUP.md`, addon `README.md`, and all 7 seed pages.
  - CHANGELOG and this project_log left as historical record; new `[Unreleased]` CHANGELOG section and this session entry added describing the rename.

### 2026-05-08-01

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.6 — bump ngdpbase base image to 3.10.3 + seed `request-access` page
- **Current Issue:** PR #28 (merged)
- **Tests:** lint clean (`npm run lint`)
- **Work Done:**
  - Bumped `Dockerfile` `ARG NGDPBASE_VERSION` from `3.10.2` to `3.10.3` to pick up `jwilleke/ngdpbase#654` — adds the `ngdpbase.application.registration` config flag.
  - Added new seed page `addons/ve-geology/pages/ve-geology-request-access.md`
    (slug `request-access`, UUID v4 `2731a6b1-1ef6-465b-80b3-2f8ed148476b`).
    Destination for the **Request access** button shown when
    `ngdpbase.application.registration: false`. Page contains a starter
    contact instruction; operator edits in the wiki UI.
  - `npm run version:bump -- patch` → 1.1.5 → 1.1.6. Filled in CHANGELOG `[1.1.6]` under Added (new seed page) and Changed (base image bump).
  - Tagged and published `v1.1.6` to `ghcr.io/jwilleke/geohazardwatch:1.1.6` (publish workflow run `25547558465` green).
- **Commits:** `088e786` (squash-merged)
- **Files Modified:**
  - `Dockerfile`
  - `addons/ve-geology/pages/ve-geology-request-access.md` (new)
  - `package.json`
  - `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-06

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.4 — bump ngdpbase base image to 3.10.1
- **Symptom on cluster:** Logged-in `admin` user had no Edit button and no admin dashboard. The page showed `GeoHazardWatch v3.9.0`.
- **Root cause:** Cluster image was layered on `ghcr.io/jwilleke/ngdpbase:3.9.0`.
  ngdpbase 3.10 introduced OrganizationRole records in `data/roles/` (per
  `User.ts:78` deprecation note for the legacy `roles[]` field). 3.9's headless
  install never created those records, so `UserManager.resolveUserRoles('admin')`
  returned an empty role set and the policy evaluator treated the admin user as
  `Anonymous|All`.
- **Fix:** Bumped `Dockerfile` `ARG NGDPBASE_VERSION=3.9.0` → `3.10.1`. v3.10.0 was cut earlier today and v3.10.1 (just published) is the first release with the image landing in `ghcr.io/jwilleke/ngdpbase`.
- **Files Modified:**
  - `Dockerfile`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-05

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.3 — replace placeholder UUIDs with real v4 UUIDs in seed pages
- **Work Done:**
  - Live cluster boot logs (after the `addons-path` array fix in `mj-infra-flux#49`) showed all 8 seed pages skipped: `[AddonsManager] Skipping ve-geology/pages/ve-geology-*.md — missing or invalid uuid in frontmatter`.
  - Root cause: placeholder UUIDs of the form `a1b2c3d4-000N-4000-8000-ve0geology00N` contain non-hex characters (`v`, `g`, `l`, `o`, `y`) and fail ngdpbase's `AddonsManager` validator regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`.
  - Confirmed against ngdpbase's `docs/platform/addon-development-guide.md` (UUID requirements section) which states the rules and recommends `node -e "console.log(require('crypto').randomUUID())"` for generation.
  - Generated 8 fresh v4 UUIDs and replaced each page's frontmatter `uuid` field. Existing valid UUIDs on `left-menu-content.md` and `footer-content.md` were left as-is.
  - Bumped to v1.1.3 (patch — bug in seeded content).
- **Files Modified:**
  - `addons/ve-geology/pages/ve-geology-about.md`
  - `addons/ve-geology/pages/ve-geology-demo.md`
  - `addons/ve-geology/pages/ve-geology-earthquakes.md`
  - `addons/ve-geology/pages/ve-geology-hans.md`
  - `addons/ve-geology/pages/ve-geology-home.md`
  - `addons/ve-geology/pages/ve-geology-japan.md`
  - `addons/ve-geology/pages/ve-geology-plugins.md`
  - `addons/ve-geology/pages/ve-geology-volcanoes.md`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-04

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.2 — fix `npm ci --omit=dev` failure on husky prepare script
- **Work Done:**
  - v1.1.1 publish workflow failed at `RUN npm ci --omit=dev` with `sh: husky: not found, npm error code 127`.
  - Root cause: package.json `prepare` script calls `husky install`. With `--omit=dev`, husky (a devDependency) isn't installed, so the script fails. The container build doesn't need git hooks anyway.
  - Added `--ignore-scripts` to the npm ci invocation to skip lifecycle scripts during the runtime build.
  - Bumped to v1.1.2.
- **Files Modified:**
  - `Dockerfile`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-03

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.1 — fix broken Dockerfile base image reference
- **Work Done:**
  - v1.1.0 publish-image workflow failed at `FROM ghcr.io/jwilleke/ngdpbase:v3.10.0` — `not found`.
  - Two issues: ngdpbase's `docker/metadata-action` strips the `v` from published image tags (so the published tag is `3.10.0`, not `v3.10.0`), AND ngdpbase's latest *published* release is `v3.9.0` — `v3.10.0` is in-progress in `package.json` but not yet tagged on the ngdpbase repo.
  - Pinned base image to `3.9.0`. Renovate will auto-PR an upgrade once `ngdpbase` publishes `3.10.0`.
  - Bumped to v1.1.1 (patch — broken-on-arrival fix).
- **Files Modified:**
  - `Dockerfile`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-02

- **Agent:** Claude Opus 4.7
- **Subject:** Release v1.1.0 — first dockerized release
- **Work Done:**
  - Merged `#19` (Dockerfile, image-publish workflow, Renovate) onto `main`.
  - `npm run version:bump -- minor` → 1.0.1 → 1.1.0 (updated `package.json`, `addons/ve-geology/index.js`, `CHANGELOG.md`).
  - Filled in CHANGELOG `[1.1.0]` section with the new artifacts and the repo rename note.
  - Replaced stale `jwilleke/ve-geology` URLs in `src/utils/version.ts` and CHANGELOG link footers with the new `jwilleke/geohazardwatch` canonical URL.
  - Tag `v1.1.0` will trigger `publish-image.yml` to publish `ghcr.io/jwilleke/geohazardwatch:{1.1.0, 1.1, 1, latest}`.
- **Files Modified:**
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `src/utils/version.ts`
  - `docs/project_log.md` (this file)

### 2026-05-07-01

- **Agent:** Claude Opus 4.7
- **Subject:** Repo rename `ve-geology` → `geohazardwatch`, dockerization, image-publish workflow, Renovate
- **Key Decision:** Bake addon code into a per-release `ghcr.io/jwilleke/geohazardwatch` image layered on `ghcr.io/jwilleke/ngdpbase`. Data (volcanoes, eruptions, HANS) lives on a persistent volume in the cluster, refreshed by a CronJob — not in the image.
- **Work Done:**
  - Renamed GitHub repo `jwilleke/ve-geology` → `jwilleke/geohazardwatch`; old URLs redirect.
  - Updated local clone's origin URL.
  - Decided (with operator) to bypass Traefik on the public path for `geohazardwatch.com` (Cloudflare Tunnel → k8s Service direct). See sibling change in `mj-infra-flux`.
  - Decided to keep the addon in this repo (no separate addon repo). Repo's reason for existence is the addon.
  - Added `Dockerfile` (FROM `ghcr.io/jwilleke/ngdpbase:v3.10.0`, copies addon + root deps into `/opt/geohazardwatch/`).
  - Added `.dockerignore` (excludes `node_modules`, `private/`, `addons/ve-geology/data/`, etc.).
  - Added `.github/workflows/publish-image.yml` (mirrors ngdpbase pattern: tag-triggered, multi-tag semver, ghcr.io push, smoke test, Trivy scan).
  - Added `renovate.json` — minor/patch auto-merge for both the base image and npm deps; major bumps require review.
- **Follow-up (separate PR):** Cluster-side manifests in `mj-infra-flux` (`apps/production/geohazardwatch/`) including image automation (Flux `ImageRepository` / `ImagePolicy` / `ImageUpdateAutomation`).
- **Files Modified:**
  - `Dockerfile` (new)
  - `.dockerignore` (new)
  - `.github/workflows/publish-image.yml` (new)
  - `renovate.json` (new)
  - `docs/project_log.md` (this file)

### 2026-03-31-03

- **Agent:** Claude Sonnet 4.6
- **Subject:** SEMVER setup, cleanup, 409 fix, v1.0.1 release
- **Work Done:**
  - Added `src/utils/version.ts` — bumps version atomically across `package.json`, `index.js`, `CHANGELOG.md`; added `npm run version:bump` script; installed `tsx` + `typescript` devDeps
  - Added `CHANGELOG.md` following Keep a Changelog format; tagged `v1.0.0`
  - Released `v1.0.1`: deleted unused template boilerplate (`.env.example`, `SECURITY.md`, `TEMPLATE_INTEGRATION.md`); added `.markdownlintignore` to exclude `private/`; updated `lint:md` scripts
  - Fixed 409 Page Conflict on admin edit: added missing `uuid` front-matter to `ve-geology-hans`, `ve-geology-home`, `ve-geology-about`, `ve-geology-plugins`; patched live ngdpbase pages directly
  - Consolidated `addons/ve-geology/private/dev-notes.md` into root `private/dev-notes.md`; added `private/` to `.gitignore`
  - Updated ngdpbase#411 with workaround details
- **Commits:** `2255932` `147e488` `1bd7975` `c6e64b3` `084b988` + this session
- **Files Modified:**
  - `src/utils/version.ts` (new)
  - `CHANGELOG.md`
  - `package.json`
  - `addons/ve-geology/index.js`
  - `addons/ve-geology/pages/ve-geology-hans.md`
  - `addons/ve-geology/pages/ve-geology-home.md`
  - `addons/ve-geology/pages/ve-geology-about.md`
  - `addons/ve-geology/pages/ve-geology-plugins.md`
  - `.gitignore`
  - `.markdownlintignore`
  - `docs/project_log.md`

### 2026-03-31-02

- **Agent:** Claude Sonnet 4.6
- **Subject:** Periodic data refresh via BackgroundJobManager (ve-geology#8)
- **Work Done:**
  - Refactored all three import scripts to export `runImport()` functions without side-effects
    at module load — CLI entry point gated behind `require.main === module`
  - `import-hans.js`: extracted `runImport(dataDir)` → returns `{ elevatedCount, monitoredCount }`
  - `import-earthquakes.js`: extracted `runImport(dataDir, feedName)` → returns `{ total, nearVolcano }`;
    moved CLI arg validation inside the `require.main` guard
  - `import-volcanoes.js`: extracted `runImport(dataDir, { eruptions, activity })` → returns
    `{ total, holocene, pleistocene }`; CLI flags parsed only when run directly
  - `index.js`: added `runHansImport` / `runEarthquakeImport` requires; added `_intervals` array;
    registered `ve-geology.import-hans` and `ve-geology.import-earthquakes` jobs with
    BackgroundJobManager; scheduled polling via `setInterval`; clears intervals in `shutdown()`
  - Config keys: `hansIntervalMs` (default 600 000 ms / 10 min), `eqIntervalMs` (default 1 200 000 ms / 20 min); set to `0` to disable
  - BackgroundJobManager is optional — addon starts cleanly if manager not available
  - After each job the corresponding manager calls `load()` to hot-reload snapshot into memory
- **Commits:** (this session)
- **Files Modified:**
  - `addons/ve-geology/import/import-hans.js`
  - `addons/ve-geology/import/import-earthquakes.js`
  - `addons/ve-geology/import/import-volcanoes.js`
  - `addons/ve-geology/index.js`
  - `docs/project_log.md`

### 2026-03-31-01

- **Agent:** Claude Sonnet 4.6
- **Subject:** End-user plugin documentation (ve-geology#9); close ve-geology#1
- **Work Done:**
  - Closed ve-geology#1 (pagination already done in commit abd6030)
  - Created `pages/ve-geology-plugins.md` — editor-focused guide covering all 7 plugins with
    what-it-renders descriptions, copy-paste markup examples, filter combinations, and data
    freshness notes; seeded at `/wiki/ve-geology-plugins`
  - Created `pages/ve-geology-about.md` — addon context page covering data sources (GVP, USGS,
    HANS), data freshness/cadence, plugin summary table, and links to source portals;
    seeded at `/wiki/ve-geology-about`
  - Updated `addons/ve-geology/README.md` — added HansAlerts to plugin table, added realistic
    "common use" examples after each parameter table, added link to in-wiki user guide
  - Issues #4–7 (new external data sources) and #8 (BackgroundJobManager) flagged for human
    review per AGENTS.md (new data source licensing; register() lifecycle change)
- **Commits:** (this session)
- **Files Modified:**
  - `addons/ve-geology/pages/ve-geology-plugins.md` (new)
  - `addons/ve-geology/pages/ve-geology-about.md` (new)
  - `addons/ve-geology/README.md`
  - `docs/project_log.md`

### 2026-03-30-05

- **Agent:** Claude Sonnet 4.6
- **Subject:** Pagination for VolcanoList and EarthquakeList (ve-geology#1)
- **Work Done:**
  - Added prev/next pagination controls to `VolcanoListPlugin.js` and `EarthquakeListPlugin.js`
  - Each plugin instance gets a unique widget ID; multiple instances on one page work independently
  - Filters embedded as JSON in the script closure at render time; client-side `goTo(offset)` fetches the API and swaps tbody rows in-place
  - Disabled prev/next buttons reflect boundary conditions (first/last page)
  - Added shared `.vl-pagination` / `.vl-page-btn` CSS to `ve-geology.css`
  - Verified on `/wiki/geology-demo`: "Showing 1–10 of 114" with working Prev/Next
- **Commits:** `abd6030`
- **Files Modified:**
  - `addons/ve-geology/plugins/VolcanoListPlugin.js`
  - `addons/ve-geology/plugins/EarthquakeListPlugin.js`
  - `addons/ve-geology/public/css/ve-geology.css`

### 2026-03-30-04

- **Agent:** Claude Sonnet 4.6
- **Subject:** Fix Leaflet maps not rendering — bundle Leaflet locally
- **Work Done:**
  - Diagnosed root cause: machine has no external network access; `unpkg.com` unreachable from browser, so Leaflet.js never loaded
  - Installed `leaflet@1.9.4` as npm dependency
  - Copied Leaflet JS, CSS, and all image assets to `addons/ve-geology/public/vendor/leaflet/`
  - Updated `VolcanoMapPlugin.js` and `EarthquakeMapPlugin.js` to load from `/addons/ve-geology/vendor/leaflet/` instead of unpkg CDN
  - Verified `http://localhost:3333/addons/ve-geology/vendor/leaflet/leaflet.js` returns 200
- **Commits:** `8c97605`
- **Files Modified:**
  - `addons/ve-geology/plugins/VolcanoMapPlugin.js`
  - `addons/ve-geology/plugins/EarthquakeMapPlugin.js`
  - `addons/ve-geology/public/vendor/leaflet/` (new — leaflet.js, leaflet.css, images/)
  - `package.json`

### 2026-03-30-03

- **Agent:** Claude Sonnet 4.6
- **Subject:** Fix domain home page not visible at root URL
- **Work Done:**
  - Diagnosed root cause: `WikiRoutes.homePage()` hardcoded `res.redirect('/view/Welcome')` — never read `ngdpbase.front-page` config
  - Fixed `homePage()` to read `ngdpbase.front-page` config, defaulting to `Welcome`
  - Filed and fixed ngdpbase#416
  - Rebuilt ngdpbase and restarted — `/` now redirects to `/view/volcanoes-and-earthquakes`
  - Verified home page renders with VolcanoMap, EarthquakeList, and HansAlerts plugins
- **Commits:** `f1915e2e` (ngdpbase)
- **Files Modified:**
  - `ngdpbase/src/routes/WikiRoutes.ts`

### 2026-03-30-02

- **Agent:** Claude Sonnet 4.6
- **Subject:** Domain front page, addon type architecture, DRY docs, project template integration
- **Work Done:**
  - Created `ve-geology-home.md` — domain front page (slug: `volcanoes-and-earthquakes`) with VolcanoMap, EarthquakeList, HansAlerts, and data source table
  - Updated `ngdpbase/data/config/app-custom-config.json` — set `ngdpbase.front-page: volcanoes-and-earthquakes`
  - Applied `mjs-project-template` via `integrate_template.sh` (Normal copy mode) — added ESLint, Prettier, Husky, markdownlint, GitHub Actions CI, `.claude/` commands, `ARCHITECTURE.md`, `CODE_STANDARDS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SETUP.md`, `AGENTS.md`, `DOCUMENTATION.md`
  - Merged `package.json` and `.gitignore` manually (template + ve-geology-specific entries preserved)
  - Fixed `.eslintrc.json` — removed TypeScript project-aware rules incompatible with JS-only addon code
  - Upgraded `@typescript-eslint` to v8 to resolve devDependency vulnerabilities
  - Fixed markdown lint errors across wiki pages (MD025, MD036, MD060 disabled)
  - Populated `AGENTS.md` with ve-geology-specific content — commands, architecture, key decisions, open issues, agent autonomy matrix
  - Created `CLAUDE.md` redirect to `AGENTS.md`
  - Populated `ARCHITECTURE.md` — addon lifecycle, data pipeline, tech stack, guide for adding new data sources
  - Populated `SETUP.md` — prereqs, 5-step setup, verification, troubleshooting
  - DRY pass across all docs — each doc owns one topic, others link to SSoT
  - Filed ngdpbase#414 — `system-category: addon` for addon-seeded pages
  - Filed ngdpbase#415 — Domain vs Additive addon type distinction with `domainDefaults()` proposal
  - Filed ve-geology#9 — end-user plugin documentation (supersedes #2)
  - Closed ve-geology#2 (superseded by #9)
- **Commits:** `507e257`, `679f204`, `df2ceb0`, `0846fa1`
- **Files Modified:**
  - `addons/ve-geology/pages/ve-geology-home.md` (new)
  - `AGENTS.md`, `CLAUDE.md` (new), `ARCHITECTURE.md`, `SETUP.md`
  - `README.md`, `package.json`, `.gitignore`, `.eslintrc.json`, `.markdownlint.json`
  - `addons/ve-geology/pages/ve-geology-*.md` (lint fixes)
  - All template files added (`.editorconfig`, `.husky/`, `.github/`, `.claude/`, `docs/`, `tools/`, etc.)

### 2026-03-30-01

- **Agent:** Claude Sonnet 4.6
- **Subject:** USGS HANS API integration, security fixes, GitHub issue tracking
- **Work Done:**
  - Created `import/import-hans.js` — fetches elevated + monitored volcanoes and daily synopsis, writes `activity.json`
  - Created `HansDataManager.js` — loads snapshot, lookup by GVP volcano number, filter by alert level/color code/observatory
  - Created `HansAlertPlugin.js` — `[{HansAlerts}]` plugin with ORANGE/YELLOW/RED/GREEN color-coded badges, supports `alertLevel=`, `colorCode=`, `observatory=` filters
  - Added HANS API routes: `/hans/elevated`, `/hans/volcano/:number`, `/hans/status`
  - Wired HansDataManager and HansAlertPlugin into `index.js` register/status/shutdown
  - Added HANS CSS styles to `ve-geology.css`
  - Created `pages/ve-geology-hans.md` (slug: `volcano-alerts`)
  - Added `npm run import:hans` script
  - Live test: Kilauea WATCH/ORANGE, Great Sitkin WATCH/ORANGE, Atka ADVISORY/YELLOW, Shishaldin ADVISORY/YELLOW
  - Fixed ngdpbase security vulnerabilities: handlebars 4.7.9, path-to-regexp 8.4.0, brace-expansion 2.0.3, yaml 2.8.3 via `npm update`
  - Filed and closed ngdpbase#413 (security)
  - Filed ve-geology#3 (HANS) — closed on completion
  - Filed ve-geology#4 (NASA FIRMS), #5 (VAACs), #6 (satellite monitoring), #7 (VolcanoDiscovery)
  - Filed ve-geology#8 (periodic refresh via BackgroundJobManager)
  - Filed ngdpbase#412 (admin addons panel)
  - Audited all data sources vs volcano-lists reference docs
  - Created root `README.md` and updated `addons/ve-geology/README.md` with earthquake and HANS content
- **Commits:** `b89cc91`, `52c23cf`, `905469e1` (ngdpbase)
- **Files Modified:**
  - `addons/ve-geology/import/import-hans.js` (new)
  - `addons/ve-geology/managers/HansDataManager.js` (new)
  - `addons/ve-geology/plugins/HansAlertPlugin.js` (new)
  - `addons/ve-geology/pages/ve-geology-hans.md` (new)
  - `addons/ve-geology/routes/api.js`
  - `addons/ve-geology/index.js`
  - `addons/ve-geology/public/css/ve-geology.css`
  - `package.json`
  - `README.md` (new), `addons/ve-geology/README.md`
  - `ngdpbase/package-lock.json` (security fixes)

### 2026-03-29-01

- **Agent:** Claude Sonnet 4.6
- **Subject:** Initial scaffold, GVP + earthquake data, plugins, wiki pages, favicon, bug fixes
- **Work Done:**
  - Scaffolded ve-geology addon following ngdpbase `addons/template/` pattern
  - Created `VolcanoDataManager.js` — loads volcanoes.json + eruptions.json, search/filter/distinct
  - Created `EarthquakeDataManager.js` — loads earthquakes.json, Haversine proximity matching
  - Created 6 plugins: `VolcanoInfobox`, `VolcanoList`, `VolcanoSearch`, `VolcanoMap`, `EarthquakeList`, `EarthquakeMap`
  - Created `routes/api.js` — volcano search, distinct, single volcano, eruptions, earthquake search, near-volcano, status
  - Created `import/import-volcanoes.js` — GVP WFS API, Holocene + Pleistocene, `--eruptions`, `--activity` flags
  - Created `import/import-earthquakes.js` — USGS feeds, Haversine proximity, `--feed=` flag
  - Added GVP number links to Smithsonian (`https://volcano.si.edu/volcano.cfm?vn=`)
  - Created 4 demo wiki pages in `addons/ve-geology/pages/` (volcanoes, earthquakes, demo, japan)
  - Set ngdpbase to port 3333
  - Updated volcano theme favicon (SVG with radial glow, lava sparks, cone gradient)
  - Fixed ngdpbase bugs during development:
    - ngdpbase#407 — external addon repos need own `package.json` + `npm install`
    - ngdpbase#408 — `getAddonConfig()` rewritten to scan flat dot-notation keys via `getAllProperties()`
    - ngdpbase#409 — favicon override fixed via `getCustomProperty()` in ConfigurationManager
    - ngdpbase#410 — `AddonsManager.seedAddonPages()` implemented (Option B for addon wiki pages)
  - Added `ConfigurationManager.getCustomProperty()` — returns value only if explicitly set in custom config
  - Added `getAllProperties()` to ConfigurationManager
  - Updated `header.ejs` for SVG favicon `type` attribute
  - Completed ngdpbase install wizard, imported all data, verified API responses
- **Commits:** `ca8eae0`, `2e10640`, `5f1c215`, `c94f4b2`
- **Files Modified:**
  - `addons/ve-geology/index.js` (new)
  - `addons/ve-geology/managers/VolcanoDataManager.js` (new)
  - `addons/ve-geology/managers/EarthquakeDataManager.js` (new)
  - `addons/ve-geology/plugins/*.js` (6 new plugins)
  - `addons/ve-geology/routes/api.js` (new)
  - `addons/ve-geology/import/import-volcanoes.js` (new)
  - `addons/ve-geology/import/import-earthquakes.js` (new)
  - `addons/ve-geology/public/css/ve-geology.css` (new)
  - `addons/ve-geology/pages/*.md` (4 new pages)
  - `package.json`
  - `ngdpbase/src/managers/AddonsManager.ts`
  - `ngdpbase/src/managers/ConfigurationManager.ts`
  - `ngdpbase/src/routes/WikiRoutes.ts`
  - `ngdpbase/views/header.ejs`
  - `ngdpbase/themes/volcano/assets/favicon.svg`
  - `ngdpbase/data/config/app-custom-config.json`
