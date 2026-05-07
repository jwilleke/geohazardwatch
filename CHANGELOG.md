# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
[1.0.0]: https://github.com/jwilleke/geohazardwatch/releases/tag/v1.0.0
