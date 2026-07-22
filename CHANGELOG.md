# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **NASA FIRMS thermal hotspot detection** (`[{FirmsHotspots}]` plugin). Closes #4. Deliberately has **no import script or data manager** in this repo — FIRMS is CSV-only, and ngdpbase's `feeds` addon didn't have a `csv` adapter until [ngdpbase#911](https://github.com/jwilleke/ngdpbase/issues/911) shipped it (v3.60.0). The plugin reads `FeedManager.getRecords()` and does the volcano-proximity join (Haversine, 5 km, ~1° grid-bucketed for speed — 46ms measured for ~59k global hotspots × ~2,600 volcanoes) at render time, cached until the feed's `fetchedAt` advances. Requires `ngdpbase.addons.feeds.sources.firms-viirs.*` configured with a FIRMS MAP_KEY (a separate credential from Earthdata Login — see <https://firms.modaps.eosdis.nasa.gov/api/map_key/>).
- **Washington VAAC ash advisory import** (`import-vaac.js`, `VaacDataManager`, `[{VaacAdvisories}]` plugin). Closes #5. No formal API — parses the archive index HTML for the most recent advisory per volcano, then fetches and parses the ICAO IWXXM 3.0 advisory XML directly (no XML parser dependency; the schema is fixed enough for targeted regex extraction). Treats an advisory as active if issued within the last 48h. Cross-references volcanoes.json by GVP number, which the advisory XML embeds directly in the volcano name field (e.g. `FUEGO 342090`). Covers only the Washington VAAC's region (Americas, E. Pacific, Caribbean) — the other 8 ICAO VAACs are not yet integrated. Refreshes on a background timer (`vaacIntervalMs`, default 30 min) and from the admin panel.
- **`docker-compose.yml`** at the repo root for one-command deploy
  (`git clone && docker compose up -d`). Pulls the published GHCR image,
  uses a named volume `ghw-data` for persistent storage, exposes the site
  on `http://localhost:3000` (override with `HOST_PORT`). Addresses
  [jwilleke/ngdpbase#682](https://github.com/jwilleke/ngdpbase/issues/682)
  Lever 1.
- **README "Quick try" + "Deploy your own" sections** at the top. Quick
  try is a `docker run` one-liner for a 30-second peek (no persistence);
  Deploy your own uses the new compose file. The existing dev-oriented
  install instructions are now under "Develop the addon." Addresses #682
  Lever 2.
- **Self-hosted Renovate** via `.github/workflows/renovate.yml`. Closes the
  bridge from [jwilleke/ngdpbase#680](https://github.com/jwilleke/ngdpbase/issues/680).
- Runs on a 6-hour cron + `workflow_dispatch`. Uses the existing
  `renovate.json` (`auto-merge` rule for minor + patch updates of
  `ghcr.io/jwilleke/ngdpbase`).
- Requires a `RENOVATE_TOKEN` repo secret — fine-grained PAT scoped to
  Contents, Pull requests, and **Workflows**. The Workflows scope is
  required so auto-merged Dockerfile bumps trigger `auto-tag.yml` and the
  publish-image cascade; the default `GITHUB_TOKEN` cannot cross-trigger
  workflows. Operator may reuse `RELEASE_PAT` if scopes match.
- Replaces the Mend-hosted Renovate App path, which 404'd on
  org-onboarding.

### Changed

- **Bumped `NGDPBASE_VERSION` 3.13.2 → 3.14.5** in `Dockerfile`. Spans the
  ngdpbase v3.14.0 minor plus patches v3.14.1–v3.14.5 (within the
  auto-merge minor+patch policy; filed manually because self-hosted
  Renovate has not been opening the PR — see note below). Operator-facing
  fixes pulled in:
  - **`POST /contact` no longer rejects every submission with "Forbidden —
    invalid CSRF token"** ([jwilleke/ngdpbase#690](https://github.com/jwilleke/ngdpbase/issues/690)).
    `views/contact.ejs` emitted `_csrfToken` while the CSRF middleware
    reads `_csrf`. Directly affects the geohazardwatch.com contact form.
  - **High-severity dependency bump: `systeminformation` 5.31.1 → 5.31.6**
    (Dependabot alert #114 — Linux command injection via NetworkManager
    profile names). Shipped in ngdpbase v3.14.2.
  - **Authenticated user dropdown is opaque again** ([jwilleke/ngdpbase#717](https://github.com/jwilleke/ngdpbase/issues/717)).
    Root cause was `backdrop-filter: blur()` on `.jspwiki-header`
    creating a stacking context that made the dropdown render transparent;
    removed. (Supersedes the partial #687 fix in v3.13.3.)
  - **`.mov` videos play inline in Chrome instead of force-downloading**
    ([jwilleke/ngdpbase#719](https://github.com/jwilleke/ngdpbase/issues/719)).
    `video/quicktime` is relabeled `video/mp4` on the attachment and
    media-serving routes (identical H.264/AAC bitstream).
  - **Calendar addon manage page reads nested config correctly**
    ([jwilleke/ngdpbase#718](https://github.com/jwilleke/ngdpbase/issues/718)).
    `AddonsManager.getAddonConfig()` now deep-nests dotted config keys, so
    `ngdpbase.addons.<name>.<group>.<id>.<field>` resolves as a structured
    object instead of flat keys.
  - **Audience picker accepts individual usernames, not just roles**
    ([jwilleke/ngdpbase#710](https://github.com/jwilleke/ngdpbase/issues/710)),
    and **profile-page rename demotes the old page to `general` instead of
    hard-deleting it** ([jwilleke/ngdpbase#662](https://github.com/jwilleke/ngdpbase/issues/662)).
- **Bumped `NGDPBASE_VERSION` 3.13.1 → 3.13.2** in `Dockerfile`. Pulls in
  two upstream patch fixes shipped in ngdpbase v3.13.2:
  - **`POST /contact` returns HTTP 200 (not 400) on `EmailManager.sendTo`
    failure** ([jwilleke/ngdpbase#677](https://github.com/jwilleke/ngdpbase/issues/677)).
    Aligns the response with the documented state matrix; mail-send
    failure is server-side, not a client validation error.
  - **Seeded `request-access` page now uses `system-category: system` and
    links to `/contact`** via JSPWiki link-with-target syntax. Affects
    fresh deployments only; existing instances retain whatever copy is on
    their persistent volume.
- Bump filed manually pending the auto-rebuild loop above; once the new
  Renovate workflow runs, future ngdpbase updates land here without
  operator action.
- Removed the global `"schedule": ["before 6am on monday"]` from
  `renovate.json` so the 6-hour cron in the new Renovate workflow has
  windows to act on. Per-rule schedules (e.g. `lockFileMaintenance.schedule`)
  remain — only the global gate was lifted.

## [1.2.88] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.87] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.86] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.85] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.84] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.83] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.82] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.81] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.80] - 2026-07-22

### Added

### Changed

### Fixed

## [1.2.79] - 2026-07-21

### Added

### Changed

### Fixed

## [1.2.78] - 2026-07-21

### Added

### Changed

### Fixed

## [1.2.77] - 2026-07-21

### Added

### Changed

### Fixed

## [1.2.76] - 2026-07-21

### Added

### Changed

### Fixed

## [1.2.75] - 2026-07-21

### Added

### Changed

### Fixed

## [1.2.74] - 2026-07-20

### Added

### Changed

### Fixed

## [1.2.73] - 2026-07-20

### Added

### Changed

### Fixed

## [1.2.72] - 2026-07-19

### Added

### Changed

### Fixed

## [1.2.71] - 2026-07-18

### Added

### Changed

### Fixed

## [1.2.70] - 2026-07-16

### Added

### Changed

### Fixed

## [1.2.69] - 2026-07-16

### Added

### Changed

### Fixed

## [1.2.68] - 2026-07-16

### Added

### Changed

### Fixed

## [1.2.67] - 2026-07-16

### Added

### Changed

### Fixed

## [1.2.66] - 2026-07-15

### Added

### Changed

### Fixed

## [1.2.65] - 2026-07-14

### Added

### Changed

### Fixed

## [1.2.64] - 2026-07-13

### Added

### Changed

### Fixed

## [1.2.63] - 2026-07-11

### Added

### Changed

### Fixed

## [1.2.62] - 2026-07-10

### Added

### Changed

### Fixed

## [1.2.61] - 2026-07-08

### Added

### Changed

### Fixed

## [1.2.60] - 2026-07-06

### Added

### Changed

### Fixed

## [1.2.59] - 2026-07-05

### Added

### Changed

### Fixed

## [1.2.58] - 2026-07-03

### Added

### Changed

### Fixed

## [1.2.57] - 2026-07-01

### Added

### Changed

### Fixed

## [1.2.56] - 2026-07-01

### Added

### Changed

### Fixed

## [1.2.55] - 2026-06-29

### Added

### Changed

### Fixed

## [1.2.54] - 2026-06-28

### Added

### Changed

### Fixed

## [1.2.53] - 2026-06-24

### Added

### Changed

### Fixed

## [1.2.52] - 2026-06-24

### Added

### Changed

### Fixed

## [1.2.51] - 2026-06-22

### Added

### Changed

### Fixed

## [1.2.50] - 2026-06-21

### Added

### Changed

### Fixed

## [1.2.49] - 2026-06-19

### Added

### Changed

### Fixed

## [1.2.48] - 2026-06-18

### Added

### Changed

### Fixed

## [1.2.47] - 2026-06-17

### Added

### Changed

### Fixed

## [1.2.46] - 2026-06-15

### Added

### Changed

### Fixed

## [1.2.45] - 2026-06-15

### Added

### Changed

### Fixed

## [1.2.44] - 2026-06-14

### Added

### Changed

### Fixed

## [1.2.43] - 2026-06-13

### Added

### Changed

### Fixed

## [1.2.42] - 2026-06-11

### Added

### Changed

### Fixed

## [1.2.41] - 2026-06-10

### Added

### Changed

### Fixed

## [1.2.40] - 2026-06-08

### Added

### Changed

### Fixed

## [1.2.39] - 2026-06-08

### Added

### Changed

### Fixed

## [1.2.38] - 2026-06-06

### Added

### Changed

### Fixed

## [1.2.37] - 2026-06-04

### Added

### Changed

### Fixed

## [1.2.36] - 2026-06-04

### Added

### Changed

### Fixed

## [1.2.35] - 2026-06-02

### Added

### Changed

### Fixed

## [1.2.34] - 2026-06-01

### Added

### Changed

### Fixed

## [1.2.33] - 2026-06-01

### Added

### Changed

### Fixed

## [1.2.32] - 2026-05-30

### Added

### Changed

### Fixed

## [1.2.31] - 2026-05-30

### Added

### Changed

### Fixed

## [1.2.30] - 2026-05-28

### Added

### Changed

### Fixed

## [1.2.29] - 2026-05-27

### Added

### Changed

### Fixed

## [1.2.28] - 2026-05-25

### Added

### Changed

### Fixed

## [1.2.27] - 2026-05-24

### Added

### Changed

### Fixed

## [1.2.26] - 2026-05-24

### Added

### Changed

### Fixed

## [1.2.25] - 2026-05-23

### Added

### Changed

### Fixed

## [1.2.24] - 2026-05-23

### Added

### Changed

### Fixed

## [1.2.23] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.22] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.21] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.20] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.19] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.18] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.17] - 2026-05-22

### Added

### Changed

### Fixed

## [1.2.16] - 2026-05-21

### Added

### Changed

### Fixed

## [1.2.15] - 2026-05-19

### Added

### Changed

### Fixed

## [1.2.14] - 2026-05-19

### Added

### Changed

### Fixed

## [1.2.13] - 2026-05-17

### Added

### Changed

### Fixed

## [1.2.12] - 2026-05-17

### Added

### Changed

### Fixed

## [1.2.11] - 2026-05-15

### Added

### Changed

### Fixed

## [1.2.10] - 2026-05-14

### Added

### Changed

### Fixed

## [1.2.9] - 2026-05-14

### Added

### Changed

### Fixed

## [1.2.8] - 2026-05-12

### Added

### Changed

### Fixed

## [1.2.7] - 2026-05-11

### Added

### Changed

### Fixed

## [1.2.6] - 2026-05-11

### Added

### Changed

### Fixed

## [1.2.5] - 2026-05-10

### Added

### Changed

### Fixed

## [1.2.4] - 2026-05-10

### Changed

- **Bumped `NGDPBASE_VERSION` 3.11.3 → 3.13.1** in `Dockerfile`. Pulls in two cluster-side bug fixes for the `/contact` form on geohazardwatch.com that were already shipped in upstream ngdpbase but not yet deployed:
  - **#670 Phase A** (ngdpbase v3.11.4) — footer `/contact` link rendering on every page when `contactAvailable` resolves true. Was missing on the live site (jwilleke/ngdpbase#678) because this image was still on v3.11.3.
  - **#670 Phase C** (ngdpbase v3.12.0) — JSONL audit log at `{instanceDataFolder}/contact-submissions.log` for every legitimate submission. Was missing on the live site (jwilleke/ngdpbase#679) for the same reason.
- Both issues filed against `jwilleke/ngdpbase` per the cross-repo coordination convention; closed once the new image deploys and verification confirms the chrome + audit log are live.

## [1.2.3] - 2026-05-09

### Added

### Changed

### Fixed

## [1.2.2] - 2026-05-09

### Added

### Changed

### Fixed

## [1.2.1] - 2026-05-09

### Added

### Changed

### Fixed

## [1.2.0] - 2026-05-09

### Added

- **VolcanoInfobox `placement` parameter** — supports the shared cross-addon
  placement contract via ngdpbase's `parsePlacementParam` / `placementClass`
  helpers (`right` / `left` / `block` / `inline`). Combines with the
  `.plugin-placement-*` CSS classes added in ngdpbase 3.11.3 so plugin
  placement is consistent platform-wide.

### Changed

- **BREAKING — Full rebadge from `ve-geology` to `geohazardwatch`** across runtime
  identity, not just the repo name. Affects npm package name, addon directory
  (`addons/ve-geology/` → `addons/geohazardwatch/`), REST API mount
  (`/api/ve-geology/*` → `/api/geohazardwatch/*`), admin mount, config keys
  (`ngdpbase.addons.ve-geology.*` → `ngdpbase.addons.geohazardwatch.*`), background
  job IDs, capability flag, default `dataPath`, stylesheet path, dashboard title
  (`VE Geology` → `GeoHazardWatch`), and seed-page slugs.
- Existing ngdpbase deployments must update `app-custom-config.json` for the new
  `ngdpbase.addons.geohazardwatch.*` keys; the old keys are no longer read.
- Existing instances retain pages at the old slug URLs (`/view/ve-geology-about`,
  etc.) since `seedAddonPages` only seeds on first install — fresh installs get
  the new slugs.
- Bumped `Dockerfile` base image from `ghcr.io/jwilleke/ngdpbase:3.10.3` to
  `3.11.3`. ngdpbase 3.11.3 ships security patches for `fast-uri`
  (CVE-2026-6321 path traversal, CVE-2026-6322 host confusion) and `pm2`
  (CVE-2025-5891 ReDoS plus three internal command-injection fixes). See
  ngdpbase release notes for the full list.
- Added `# renovate: datasource=docker depName=ghcr.io/jwilleke/ngdpbase`
  annotation above the `ARG NGDPBASE_VERSION` line so Renovate's dockerfile
  manager picks up the dependency. Future ngdpbase tags will be auto-PR'd by
  Renovate (auto-merged for minor/patch per existing `renovate.json` rules).
  Last hand-bump on this ARG should be this one. See
  [ngdpbase#668](https://github.com/jwilleke/ngdpbase/issues/668) for the
  decision context.

## [1.1.6] - 2026-05-08

### Added

- New seed page `addons/ve-geology/pages/ve-geology-request-access.md`
  (slug `request-access`). Destination for the **Request access** button
  shown when ngdpbase's `ngdpbase.application.registration` flag is `false`.
  Operator edits the page in the admin UI to customize contact instructions
  or drop in a `[{Form …}]` plugin invocation.

### Changed

- Bumped `Dockerfile` base image from `ghcr.io/jwilleke/ngdpbase:3.10.2` to
  `3.10.3`. ngdpbase 3.10.3 introduces the `ngdpbase.application.registration`
  config flag (default `true`); operators set it to `false` to lock down
  self-registration. See ngdpbase PR #654.

## [1.1.5] - 2026-05-07

### Changed

- Bumped `Dockerfile` base image from `ghcr.io/jwilleke/ngdpbase:3.10.1` to
  `3.10.2`. ngdpbase 3.10.2 ships the `themes/` directory in the runtime
  image (per `jwilleke/ngdpbase#652`); 3.10.1 omitted it, which broke the
  volcano theme, favicon, and core CSS variables in the cluster deployment
  (geohazardwatch#26).

## [1.1.4] - 2026-05-07

### Changed

- Bumped `Dockerfile` base image from `ghcr.io/jwilleke/ngdpbase:3.9.0` to
  `3.10.1`. 3.10 introduced the OrganizationRole-based role assignment that
  the headless install needs in order for the seeded `admin` user to actually
  carry the `admin` role at login. Without it (3.9.x), `admin` resolved to the
  implicit `All` role and the cluster deployment showed no Edit button or
  admin dashboard.

## [1.1.3] - 2026-05-07

### Fixed

- Replaced placeholder `uuid` frontmatter on all 8 seed pages
  (`ve-geology-about`, `ve-geology-demo`, `ve-geology-earthquakes`,
  `ve-geology-hans`, `ve-geology-home`, `ve-geology-japan`,
  `ve-geology-plugins`, `ve-geology-volcanoes`) with real UUID v4 values.
  The placeholders contained non-hex characters (`v`, `g`, `l`, `o`, `y`)
  and were rejected by `AddonsManager`'s validator (`/^[0-9a-f]{8}-…$/`),
  so none of the pages were being seeded into the site on startup. See
  the upstream [addon development guide](https://github.com/jwilleke/ngdpbase/blob/master/docs/platform/addon-development-guide.md#uuid-requirements)
  for the rules.

## [1.1.2] - 2026-05-07

### Fixed

- `Dockerfile` — `npm ci --omit=dev` ran the `prepare` lifecycle script,
  which calls `husky install`. Husky is a devDependency that's not installed
  under `--omit=dev`, so the script exited 127. Added `--ignore-scripts` to
  skip lifecycle scripts during the container build — git hooks aren't
  meaningful inside a runtime image. Without this fix, the v1.1.1 publish
  workflow failed at `RUN npm ci`.

## [1.1.1] - 2026-05-07

### Fixed

- `Dockerfile` — base image reference was `ghcr.io/jwilleke/ngdpbase:v3.10.0`,
  which doesn't exist. Published `ngdpbase` image tags don't carry the `v`
  prefix (the `docker/metadata-action` strips it), and the most recent
  published `ngdpbase` release is `3.9.0`, not `3.10.0`. Pinned to `3.9.0` —
  Renovate will PR an upgrade once `ngdpbase` publishes `3.10.0`. Without this
  fix, the v1.1.0 release workflow failed at `FROM` resolution.

## [1.1.0] - 2026-05-07

### Added

- `Dockerfile` — layered on `ghcr.io/jwilleke/ngdpbase`; copies addon and root deps into `/opt/geohazardwatch/`. Imported data stays on a runtime volume, not baked in.
- `.dockerignore` — keeps the build context small (excludes `node_modules`, `private/`, `addons/ve-geology/data/`, etc.).
- `.github/workflows/publish-image.yml` — tag-triggered build, multi-tag semver push to `ghcr.io/jwilleke/geohazardwatch`, smoke test, Trivy scan.
- `renovate.json` — minor + patch auto-merge for the base image and npm deps; majors require manual review; weekly schedule.

### Changed

- Repo renamed from `jwilleke/ve-geology` to `jwilleke/geohazardwatch`. Old URLs redirect; canonical name now matches the public domain.

### Fixed

## [1.0.1] - 2026-03-31

### Added

- `src/utils/version.ts` — SEMVER bump utility; updates `package.json`, `addons/ve-geology/index.js`, and `CHANGELOG.md` atomically (`npm run version:bump -- <major|minor|patch|x.y.z>`)
- End-user plugin guide seeded at `/view/ve-geology-plugins`
- Addon context/about page seeded at `/view/ve-geology-about`
- Periodic data refresh via ngdpbase `BackgroundJobManager` — `ve-geology.import-hans` and `ve-geology.import-earthquakes` jobs with configurable polling intervals

### Changed

- All import scripts now export `runImport()` for programmatic use; CLI entry gated behind `require.main === module`
- `addons/ve-geology/README.md` — added `HansAlerts` to plugin table, realistic examples per plugin, link to in-app guide

### Fixed

- Added missing `uuid` front-matter to four seeded pages (`ve-geology-hans`, `ve-geology-home`, `ve-geology-about`, `ve-geology-plugins`) — absence caused ngdpbase `FileSystemProvider` to return 409 on any admin edit attempt
- Removed `.env.example`, `SECURITY.md`, `TEMPLATE_INTEGRATION.md` — unused template boilerplate not applicable to this addon

## [1.0.0] - 2026-03-31

### Added

- Initial addon scaffold — `register()` / `shutdown()` / `status()` lifecycle wired into ngdpbase `AddonsManager`
- **VolcanoDataManager** — loads GVP volcano and eruption snapshots from `volcanoes.json` / `eruptions.json`
- **EarthquakeDataManager** — loads USGS earthquake snapshot from `earthquakes.json`; tracks proximity to known volcanoes
- **HansDataManager** — loads USGS HANS alert snapshot from `activity.json` (optional; starts silently if absent)
- **VolcanoInfoboxPlugin** — infobox card for a single volcano; supports `default` and `compact` styles
- **VolcanoListPlugin** — filterable, paginated table of volcanoes (country, region, type, epoch, elevation)
- **VolcanoSearchPlugin** — interactive live-search widget with dropdown filters
- **VolcanoMapPlugin** — Leaflet map of volcanoes; red = Holocene, blue = Pleistocene
- **EarthquakeListPlugin** — filterable, paginated table of recent earthquakes with PAGER alert badges and tsunami flag
- **EarthquakeMapPlugin** — Leaflet map of earthquakes coloured by PAGER alert level; optional volcano overlay
- **HansAlertPlugin** — US volcano alert level table filterable by USGS observatory
- Client-side pagination (Previous / Next) on VolcanoList and EarthquakeList
- REST API at `/api/ve-geology/*` — volcano search/filter, single volcano, eruptions, earthquake search, earthquake near volcano, feed status
- GVP WFS import script (`import-volcanoes.js`) — Holocene + Pleistocene volcanoes, eruption records, global activity snapshot
- USGS earthquake import script (`import-earthquakes.js`) — multiple feeds (4.5-week default); Haversine proximity matching against volcano catalog
- USGS HANS import script (`import-hans.js`) — elevated volcanoes, daily synopsis, monitored count
- All import scripts export `runImport()` for programmatic use; CLI entry gated behind `require.main === module`
- **BackgroundJobManager integration** — registers `ve-geology.import-hans` and `ve-geology.import-earthquakes` jobs; polls on configurable intervals (default 10 min / 20 min); hot-reloads in-memory managers after each run; intervals cleared in `shutdown()`
- Config keys: `dataPath`, `hansIntervalMs`, `eqIntervalMs`
- Addon CSS served at `/addons/ve-geology/css/ve-geology.css`; registered with ngdpbase `AddonsManager`
- Seeded pages: home, volcanoes, earthquakes, HANS alerts, Japan demo, geology demo, plugin guide, about
- Leaflet served locally (no external CDN dependency)
- Domain front page set as ngdpbase home page
- End-user plugin guide at `/view/ve-geology-plugins`
- Addon context page at `/view/ve-geology-about`
- ESLint + markdownlint + Prettier + Husky pre-commit hook

[1.0.1]: https://github.com/jwilleke/geohazardwatch/compare/v1.0.0...v1.0.1
[1.1.0]: https://github.com/jwilleke/geohazardwatch/compare/v1.0.1...v1.1.0
[1.1.1]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.0...v1.1.1
[1.1.2]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.1...v1.1.2
[1.1.3]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.2...v1.1.3
[1.1.4]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.3...v1.1.4
[1.1.5]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.4...v1.1.5
[1.1.6]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.5...v1.1.6
[1.2.0]: https://github.com/jwilleke/geohazardwatch/compare/v1.1.6...v1.2.0
[1.2.1]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.0...v1.2.1
[1.2.2]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.1...v1.2.2
[1.2.3]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.2...v1.2.3
[1.2.5]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.4...v1.2.5
[1.2.6]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.5...v1.2.6
[1.2.7]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.6...v1.2.7
[1.2.8]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.7...v1.2.8
[1.2.9]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.8...v1.2.9
[1.2.10]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.9...v1.2.10
[1.2.11]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.10...v1.2.11
[1.2.12]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.11...v1.2.12
[1.2.13]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.12...v1.2.13
[1.2.14]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.13...v1.2.14
[1.2.15]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.14...v1.2.15
[1.2.16]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.15...v1.2.16
[1.2.17]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.16...v1.2.17
[1.2.18]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.17...v1.2.18
[1.2.19]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.18...v1.2.19
[1.2.20]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.19...v1.2.20
[1.2.21]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.20...v1.2.21
[1.2.22]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.21...v1.2.22
[1.2.23]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.22...v1.2.23
[1.2.24]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.23...v1.2.24
[1.2.25]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.24...v1.2.25
[1.2.26]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.25...v1.2.26
[1.2.27]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.26...v1.2.27
[1.2.28]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.27...v1.2.28
[1.2.29]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.28...v1.2.29
[1.2.30]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.29...v1.2.30
[1.2.31]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.30...v1.2.31
[1.2.32]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.31...v1.2.32
[1.2.33]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.32...v1.2.33
[1.2.34]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.33...v1.2.34
[1.2.35]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.34...v1.2.35
[1.2.36]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.35...v1.2.36
[1.2.37]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.36...v1.2.37
[1.2.38]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.37...v1.2.38
[1.2.39]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.38...v1.2.39
[1.2.40]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.39...v1.2.40
[1.2.41]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.40...v1.2.41
[1.2.42]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.41...v1.2.42
[1.2.43]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.42...v1.2.43
[1.2.44]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.43...v1.2.44
[1.2.45]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.44...v1.2.45
[1.2.46]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.45...v1.2.46
[1.2.47]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.46...v1.2.47
[1.2.48]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.47...v1.2.48
[1.2.49]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.48...v1.2.49
[1.2.50]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.49...v1.2.50
[1.2.51]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.50...v1.2.51
[1.2.52]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.51...v1.2.52
[1.2.53]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.52...v1.2.53
[1.2.54]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.53...v1.2.54
[1.2.55]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.54...v1.2.55
[1.2.56]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.55...v1.2.56
[1.2.57]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.56...v1.2.57
[1.2.58]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.57...v1.2.58
[1.2.59]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.58...v1.2.59
[1.2.60]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.59...v1.2.60
[1.2.61]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.60...v1.2.61
[1.2.62]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.61...v1.2.62
[1.2.63]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.62...v1.2.63
[1.2.64]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.63...v1.2.64
[1.2.65]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.64...v1.2.65
[1.2.66]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.65...v1.2.66
[1.2.67]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.66...v1.2.67
[1.2.68]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.67...v1.2.68
[1.2.69]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.68...v1.2.69
[1.2.70]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.69...v1.2.70
[1.2.71]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.70...v1.2.71
[1.2.72]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.71...v1.2.72
[1.2.73]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.72...v1.2.73
[1.2.74]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.73...v1.2.74
[1.2.75]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.74...v1.2.75
[1.2.76]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.75...v1.2.76
[1.2.77]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.76...v1.2.77
[1.2.78]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.77...v1.2.78
[1.2.79]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.78...v1.2.79
[1.2.80]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.79...v1.2.80
[1.2.81]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.80...v1.2.81
[1.2.82]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.81...v1.2.82
[1.2.83]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.82...v1.2.83
[1.2.84]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.83...v1.2.84
[1.2.85]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.84...v1.2.85
[1.2.86]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.85...v1.2.86
[1.2.87]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.86...v1.2.87
[1.2.88]: https://github.com/jwilleke/geohazardwatch/compare/v1.2.87...v1.2.88
[1.0.0]: https://github.com/jwilleke/geohazardwatch/releases/tag/v1.0.0
