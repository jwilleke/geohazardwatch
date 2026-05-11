# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Bumped `NGDPBASE_VERSION` 3.13.1 → 3.13.2** in `Dockerfile`. Pulls in two upstream patch fixes shipped in ngdpbase v3.13.2:
  - **`POST /contact` returns HTTP 200 (not 400) on `EmailManager.sendTo` failure** ([jwilleke/ngdpbase#677](https://github.com/jwilleke/ngdpbase/issues/677)). Aligns the response with the documented state matrix; mail-send failure is server-side, not a client validation error.
  - **Seeded `request-access` page now uses `system-category: system` and links to `/contact`** via JSPWiki link-with-target syntax. Affects fresh deployments only; existing instances retain whatever copy is on their persistent volume.
- Bump filed manually pending [jwilleke/ngdpbase#680](https://github.com/jwilleke/ngdpbase/issues/680) (auto-rebuild on upstream Release events). Once #680 lands, satellite rebuild will fire automatically on any future ngdpbase minor/major or any `/release` invocation.

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
- Existing wiki instances retain pages at the old slug URLs (`/wiki/ve-geology-about`,
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
  Operator edits the page in the wiki UI to customize contact instructions
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
  so none of the pages were being seeded into the wiki on startup. See
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
- End-user plugin guide seeded at `/wiki/ve-geology-plugins`
- Addon context/about page seeded at `/wiki/ve-geology-about`
- Periodic data refresh via ngdpbase `BackgroundJobManager` — `ve-geology.import-hans` and `ve-geology.import-earthquakes` jobs with configurable polling intervals

### Changed

- All import scripts now export `runImport()` for programmatic use; CLI entry gated behind `require.main === module`
- `addons/ve-geology/README.md` — added `HansAlerts` to plugin table, realistic examples per plugin, link to in-wiki guide

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
- Seeded wiki pages: home, volcanoes, earthquakes, HANS alerts, Japan demo, geology demo, plugin guide, about
- Leaflet served locally (no external CDN dependency)
- Domain front page set as ngdpbase home page
- End-user plugin guide at `/wiki/ve-geology-plugins`
- Addon context page at `/wiki/ve-geology-about`
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
[1.0.0]: https://github.com/jwilleke/geohazardwatch/releases/tag/v1.0.0
