# geohazardwatch Add-on

Volcano & geology data platform for [ngdpbase](https://github.com/jwilleke/ngdpbase), powered by [Global Volcanism Program (GVP)](https://volcano.si.edu/) and [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) data.

For end-user documentation (what renders, when to use each plugin, example combinations), see the guide seeded at `/view/geohazardwatch-plugins`.

## Plugins

| Tag | Description |
|-----|-------------|
| `[{VolcanoInfobox number='...'}]` | Full infobox for a single volcano |
| `[{VolcanoList country='...'}]` | Filtered, paginated table of volcanoes |
| `[{VolcanoSearch}]` | Live search widget with dropdowns |
| `[{VolcanoMap}]` | Leaflet map of volcanoes |
| `[{EarthquakeList}]` | Filtered, paginated table of recent earthquakes |
| `[{EarthquakeMap}]` | Leaflet map of recent earthquakes |
| `[{HansAlerts}]` | US volcano alert level table (USGS HANS) |
| `[{VaacAdvisories}]` | Active volcanic ash advisory table (Washington VAAC) |
| `[{FirmsHotspots}]` | Volcanoes with a NASA FIRMS thermal anomaly (via ngdpbase's `feeds` addon) |

---

## Markup Reference

### VolcanoInfobox

Renders a full infobox for a single volcano with GVP link, coordinates, type, rock type, tectonic setting, and elevation.

```
[{VolcanoInfobox number='211060'}]
[{VolcanoInfobox number='211060' style='compact'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `number` | *(required)* | GVP volcano number |
| `style` | `default` | `default` (full infobox) or `compact` (inline name span) |

__Common use:__ Add a `default` infobox at the top of a volcano-specific page, or use `compact` inline within body text — e.g. "…near [{VolcanoInfobox number='332010' style='compact'}]…"

---

### VolcanoList

Renders a filtered table of volcanoes. GVP numbers link to the Smithsonian volcano page.

```
[{VolcanoList country='United States'}]
[{VolcanoList region='Alaska Peninsula and Aleutian Islands' limit='20'}]
[{VolcanoList epoch='Holocene' volcanoType='Stratovolcano'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `query` | | Free-text search (name) |
| `country` | | Filter by country |
| `region` | | Filter by GVP region |
| `volcanoType` | | Filter by type (e.g. `Stratovolcano`) |
| `rockType` | | Filter by rock type |
| `tectonicSetting` | | Filter by tectonic setting |
| `epoch` | | `Holocene` or `Pleistocene` |
| `limit` | `25` | Max rows |
| `offset` | `0` | Pagination offset |

__Common use:__ `[{VolcanoList country='Japan' epoch='Holocene' limit='20'}]` for a country page sidebar; `[{VolcanoList volcanoType='Caldera' limit='50'}]` for a type-specific browse page. Previous / Next pagination controls render automatically when results exceed `limit`.

---

### VolcanoSearch

Renders an interactive live-search widget with dropdowns for country, region, volcano type, and epoch. Results link to GVP volcano pages.

```
[{VolcanoSearch}]
[{VolcanoSearch defaultEpoch='Holocene' defaultLimit='50'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `defaultEpoch` | | Pre-select epoch dropdown |
| `defaultCountry` | | Pre-select country dropdown |
| `defaultLimit` | `25` | Results per page |

__Common use:__ `[{VolcanoSearch defaultEpoch='Holocene' defaultLimit='50'}]` on a main volcano browse page; combine with VolcanoMap below it for a full explore experience.

---

### VolcanoMap

Renders a Leaflet map. Red markers = Holocene, blue = Pleistocene.

```
[{VolcanoMap}]
[{VolcanoMap country='Japan' height='500'}]
[{VolcanoMap epoch='Holocene' lat='35' lon='138' zoom='5'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `country` | | Filter by country |
| `region` | | Filter by region |
| `volcanoType` | | Filter by type |
| `epoch` | | `Holocene` or `Pleistocene` |
| `minElevation` / `maxElevation` | | Elevation range (metres) |
| `limit` | `5000` | Max markers |
| `height` | `450` | Map height in px |
| `lat` / `lon` | `20` / `0` | Initial centre |
| `zoom` | `2` | Initial zoom level |

__Common use:__ `[{VolcanoMap country='Indonesia' lat='-2' lon='118' zoom='4' height='500'}]` for a country page; `[{VolcanoMap epoch='Holocene'}]` for a global overview.

---

### EarthquakeList

Renders a filtered table of recent earthquakes with PAGER alert badges, tsunami indicator, and nearest volcano (if within 50 km).

```
[{EarthquakeList}]
[{EarthquakeList minMagnitude='5' nearVolcano='true'}]
[{EarthquakeList tsunamiOnly='true' limit='10'}]
[{EarthquakeList alert='red'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minMagnitude` / `maxMagnitude` | | Magnitude range |
| `minDepth` / `maxDepth` | | Depth range (km) |
| `nearVolcano` | | `true` — only events within 50 km of a volcano |
| `tsunamiOnly` | | `true` — only events with tsunami flag |
| `alert` | | PAGER alert level: `green`, `yellow`, `orange`, `red` |
| `limit` | `50` | Max rows |
| `offset` | `0` | Pagination offset |

__Common use:__ `[{EarthquakeList nearVolcano='true' minMagnitude='4.5' limit='25'}]` on a seismic monitoring page; `[{EarthquakeList alert='red' limit='10'}]` for a hazard summary widget. Previous / Next pagination controls render automatically when results exceed `limit`.

---

### EarthquakeMap

Renders a Leaflet map of earthquakes coloured by PAGER alert level, with an optional volcano overlay.

```
[{EarthquakeMap}]
[{EarthquakeMap minMagnitude='5' showVolcanoes='true' height='500'}]
[{EarthquakeMap nearVolcano='true'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minMagnitude` / `maxMagnitude` | | Magnitude filter |
| `nearVolcano` | | `true` — only events near a volcano |
| `showVolcanoes` | | `true` — overlay volcano markers |
| `height` | `450` | Map height in px |
| `lat` / `lon` | `20` / `0` | Initial centre |
| `zoom` | `2` | Initial zoom level |

__Common use:__ `[{EarthquakeMap nearVolcano='true' showVolcanoes='true' height='500'}]` as a companion to EarthquakeList; `[{EarthquakeMap minMagnitude='6'}]` for major-event tracking.

---

### HansAlerts

Renders a table of US volcano alert levels from the USGS HANS API. By default shows only volcanoes at ADVISORY level or above. Filter by observatory to show a regional subset.

```
[{HansAlerts}]
[{HansAlerts observatory='avo'}]
[{HansAlerts observatory='hvo'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `observatory` | | Filter by observatory code: `avo`, `hvo`, `cvo`, `yvo`, `uvo` |

__Common use:__ `[{HansAlerts}]` on a US hazard summary page; `[{HansAlerts observatory='avo'}]` on an Alaska-specific page. Covers US volcanoes only.

---

### VaacAdvisories

Renders a table of active Volcanic Ash Advisories from the Washington VAAC (Americas, E. Pacific, Caribbean). An advisory counts as "active" if it's the most recent one for that volcano and was issued within the last 48 hours. Like FirmsHotspots below, __this addon has no import script, manager, or scheduler for VAAC__ — ngdpbase's generic `feeds` addon fetches/schedules/stores it (`adapter: 'xml-index'`, see [`docs/volcano-sources.md`](../../docs/volcano-sources.md#configuration-vaac-advisories) for the config). This plugin only reads already-ingested records via `FeedManager.getRecords()` and splits the volcano-name/GVP-number field at render time (geohazardwatch#141).

```
[{VaacAdvisories}]
[{VaacAdvisories region='GUATEMALA'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `region` | | Filter by state/region (e.g. `GUATEMALA`, `ECUADOR`) |

__Common use:__ `[{VaacAdvisories}]` on a global hazard summary page. Covers only the Washington VAAC's region (Americas, E. Pacific, Caribbean) — see geohazardwatch#5 for the other 8 ICAO VAACs, not yet integrated.

---

### FirmsHotspots

Renders volcanoes currently showing a NASA FIRMS thermal anomaly within 5 km of the summit. Unlike every other plugin above, __this addon has no import script, manager, or scheduler for FIRMS__ — ngdpbase's generic `feeds` addon fetches/schedules/stores the raw CSV data (`adapter: 'csv'`, see [Data sources](#data-sources) below for the config). This plugin only reads already-ingested records via `FeedManager.getRecords()` and joins them against the volcano catalog at render time (cached until the feed's next poll — see geohazardwatch#4, ngdpbase#911).

```
[{FirmsHotspots}]
[{FirmsHotspots source='firms-viirs' limit='10'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `source` | `firms-viirs` | The configured `ngdpbase.addons.feeds.sources.<id>` to read |
| `limit` | all | Max volcanoes to show, strongest thermal signal (FRP) first |

__Common use:__ `[{FirmsHotspots}]` on a global hazard summary page alongside HansAlerts and VaacAdvisories. Satellite-detected heat, not a confirmed eruption.

---

## Admin panel

`/addons/geohazardwatch` — status dashboard (record counts, HANS elevated alerts). Viewing it needs `admin-read`; the refresh buttons need `admin-system`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/addons/geohazardwatch` | Status dashboard (authenticated) |
| POST | `/addons/geohazardwatch/jobs/hans` | Enqueue a HANS refresh job (admin) |
| POST | `/addons/geohazardwatch/jobs/earthquakes` | Enqueue an earthquake refresh job (admin) |

The buttons start the same jobs that run on their schedules — see [Data refresh jobs](#data-refresh-jobs). VAAC advisories (and FIRMS/VIIRS) are refreshed by the ngdpbase `feeds` addon's own poll scheduler instead — no admin button here.

---

## Data refresh jobs

The add-on refreshes its data as ngdpbase scheduled jobs on core's `BackgroundJobManager` ([ngdpbase#2054](https://github.com/jwilleke/ngdpbase/issues/2054)). No Kubernetes CronJob and no timer of the add-on's own are involved.

| Job id | Imports | Default schedule | Config key |
|--------|---------|------------------|------------|
| `geohazardwatch.import-volcanoes` | GVP volcanoes, eruptions and global activity (`volcanoes.json`, `eruptions.json`, `global-activity.json`) | daily 08:00 America/New_York | `ngdpbase.addons.geohazardwatch.volcanoesSchedule` |
| `geohazardwatch.import-earthquakes` | USGS M4.5+ past week (`earthquakes.json`) | every 20 minutes | `ngdpbase.addons.geohazardwatch.earthquakesSchedule` |
| `geohazardwatch.import-hans` | USGS HANS alert levels (`activity.json`) | every 10 minutes | `ngdpbase.addons.geohazardwatch.hansSchedule` |

- __Schedules__ are core schedules: a shorthand (`every 10m`, `daily 06:00`, `hourly`), an RRULE, or `{ "rrule": "…", "tz": "America/New_York" }`. Without `tz` the site's `ngdpbase.default.timezone` applies. Cron is not accepted. A schedule that is missing or does not compile leaves that job unscheduled (Run now still works) and logs an error at start. Core's own `ngdpbase.jobs.<job id>.schedule` also overrides one, and `ngdpbase.jobs.<job id>.enabled: false` pauses it.
- __What core does:__ each slot runs once, as the system principal; a failed run (a fetch error, a non-2xx answer, a refused address) is tried again after 1, 5 and 15 minutes, then recorded as failed, audited and posted to admins; a slot missed while the server was down is caught up once; a slot that comes due while the job is still running is skipped. The previous snapshot stays in place when a run fails.
- __Run now:__ admins start any of them from Admin → Scheduled Jobs (`/admin/jobs`, needs `admin-system`), which also shows the next slot and the run history. The HANS and earthquake buttons on this add-on's admin panel do the same.
- __Where it writes:__ `dataPath`, the folder the add-on's managers read; each manager reloads after its import.
- __Outbound HTTP__ is `host.guardedFetch` under the site's egress policy as it is at each run, with the site's User-Agent and core's 30 s timeout. `maxResponseBytes` raises core's 8 MiB response limit, since GVP's Holocene eruptions alone are larger.

---

## API Endpoints

All endpoints are mounted at `/api/geohazardwatch`.

### Volcano endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search` | Search/filter volcanoes |
| GET | `/distinct/:field` | Distinct values for a field |
| GET | `/volcano/:number` | Single volcano by GVP number |
| GET | `/eruptions/:number` | Eruption records for a volcano |

__Search query parameters:__ `q`, `country`, `region`, `volcanoType`, `rockType`, `tectonicSetting`, `epoch`, `minElevation`, `maxElevation`, `minLatitude`, `maxLatitude`, `minLongitude`, `maxLongitude`, `limit` (default 100), `offset` (default 0).

### Earthquake endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/earthquakes/search` | Search/filter earthquakes |
| GET | `/earthquakes/near/:number` | Earthquakes near a specific volcano |
| GET | `/earthquakes/status` | Feed metadata (source, fetch time, counts) |

__Earthquake search parameters:__ `minMagnitude`, `maxMagnitude`, `minDepth`, `maxDepth`, `nearVolcano` (true/false), `tsunamiOnly` (true/false), `alert`, `limit` (default 50), `offset` (default 0).

### HANS alert endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hans/elevated` | List volcanoes at ADVISORY level or above |
| GET | `/hans/volcano/:number` | Alert status for a single GVP volcano number |
| GET | `/hans/status` | Feed metadata (last fetch time, monitored/elevated counts) |

__`/hans/elevated` query parameters:__ `alertLevel`, `colorCode`, `observatory` (`avo`, `hvo`, `cvo`, `yvo`, `uvo`).

VAAC ash advisories have no dedicated API endpoint here — they're served by the generic ngdpbase `feeds` surface (`FeedManager.getRecords('vaac-advisories')`), same as FIRMS/VIIRS.

---

## Import scripts

Manual entry points to the same code the jobs run (`runImport` in each file); nothing depends on them. Use [Run now](#data-refresh-jobs) on a running site instead. A script run from a shell has no host, so it loads `guardedFetch` and the default egress policy from `dist/` in the current directory: run it from a built ngdpbase checkout (requires internet access). Data goes to `addons/geohazardwatch/data/` unless `--data-dir` is given.

```sh
cd /path/to/ngdpbase
GW=/path/to/geohazardwatch/addons/geohazardwatch/import

# Volcanoes only; add --eruptions (eruption records) and/or --activity (global activity snapshot)
npx tsx $GW/import-volcanoes.ts --eruptions --activity

# Earthquake data (M4.5+ past 7 days — default; --feed=4.5-month for 30 days)
npx tsx $GW/import-earthquakes.ts

# USGS HANS real-time US volcano alert levels
npx tsx $GW/import-hans.ts
```

Washington VAAC ash advisories have no import script — the ngdpbase `feeds` addon fetches them, same as FIRMS/VIIRS (see [`docs/volcano-sources.md`](../../docs/volcano-sources.md#configuration-vaac-advisories)).

Custom options (the compiled `.js` in a packaged install, also from the ngdpbase root):

```sh
# Custom data directory
node addons/geohazardwatch/import/import-volcanoes.js --data-dir /path/to/data

# Specific earthquake feed
node addons/geohazardwatch/import/import-earthquakes.js --feed=significant-week
# Available feeds: significant-week, 4.5-week, 2.5-week, 4.5-month, significant-month

# HANS import to a custom data directory
node addons/geohazardwatch/import/import-hans.js --data-dir /path/to/data
```

Earthquake import uses `volcanoes.json` when it exists (for proximity matching). HANS import needs no auth and covers US volcanoes only (~65 monitored); it writes `activity.json`, which `HansDataManager` treats as optional — the addon starts cleanly without it.

---

## Configuration keys

Set in your ngdpbase `app-custom-config.json`:

| Key | Default | Description |
|-----|---------|-------------|
| `ngdpbase.addons.geohazardwatch.enabled` | `false` | Enable the add-on |
| `ngdpbase.addons.geohazardwatch.dataPath` | `./data/geohazardwatch` | Path to data directory |
| `ngdpbase.addons.geohazardwatch.volcanoesSchedule` | `{ "rrule": "daily 08:00", "tz": "America/New_York" }` | GVP import schedule ([Data refresh jobs](#data-refresh-jobs)) |
| `ngdpbase.addons.geohazardwatch.earthquakesSchedule` | `every 20m` | USGS earthquake import schedule |
| `ngdpbase.addons.geohazardwatch.hansSchedule` | `every 10m` | USGS HANS import schedule |
| `ngdpbase.addons.geohazardwatch.maxResponseBytes` | `33554432` (32 MiB) | Largest upstream response an import accepts |

`hansIntervalMs` and `eqIntervalMs` are gone: a site that set either to `0` to stop polling sets `ngdpbase.jobs.geohazardwatch.import-hans.enabled` (or `…import-earthquakes.enabled`) to `false` instead.

The Tsunami and Landslide pages, and VAAC advisories, render live data through a separate ngdpbase `feeds` addon, configured independently — see [Tsunami & Landslide pages](#tsunami--landslide-pages) below and [`docs/volcano-sources.md`](../../docs/volcano-sources.md#configuration-vaac-advisories) for VAAC.

---

## Distribution

This directory is also published as an npm package, `@jwilleke/geohazardwatch-addon` (see `package.json` in this directory), for production deployment — see [`../../Dockerfile`](../../Dockerfile) and [geohazardwatch#152](https://github.com/jwilleke/geohazardwatch/issues/152). Local development still uses __drop-in__ (this directory referenced directly via `addons-path`, as in [SETUP.md](../../SETUP.md)); only the production image installs it as a versioned dependency instead of copying the directory. The addon's own runtime code, `register()` contract, and config keys are identical either way.

---

## Structure

```
addons/geohazardwatch/
├── index.js                        ← AddonModule entry point (register/status/shutdown)
├── config/
│   └── default-config.json        ← Default config values, overridable in app-custom-config.json
├── managers/
│   ├── VolcanoDataManager.js       ← Loads volcanoes.json + eruptions.json
│   ├── EarthquakeDataManager.js    ← Loads earthquakes.json snapshot
│   └── HansDataManager.js          ← Loads activity.json (optional — no-ops if absent)
├── plugins/
│   ├── VolcanoInfoboxPlugin.js
│   ├── VolcanoListPlugin.js
│   ├── VolcanoSearchPlugin.js
│   ├── VolcanoMapPlugin.js
│   ├── EarthquakeListPlugin.js
│   ├── EarthquakeMapPlugin.js
│   └── HansAlertPlugin.js
├── routes/
│   ├── api.js                      ← /api/geohazardwatch/* endpoints
│   └── admin.js                    ← /addons/geohazardwatch admin panel + refresh jobs
├── views/
│   └── admin-geohazardwatch.ejs    ← Admin panel template
├── lib/
│   ├── jobs.ts                     ← The scheduled refresh jobs (registerJobs)
│   └── fetch.ts                    ← JSON over the guarded fetch the caller hands in
├── import/
│   ├── import-volcanoes.js         ← GVP WFS API importer (volcanoes, eruptions, activity)
│   ├── import-earthquakes.js       ← USGS feed importer + proximity matching
│   ├── import-hans.js              ← USGS HANS alert importer
│   └── cli.ts                      ← The guarded fetch for a manual run from a shell
├── pages/                          ← Seeded into ngdpbase on first load, never overwritten
│   ├── volcanoes-and-earthquakes.md
│   ├── geohazardwatch-about.md
│   ├── volcanoes.md
│   ├── earthquakes.md
│   ├── us-volcano-alerts-usgs-hans.md
│   ├── geology-demo.md
│   ├── japan-volcanoes.md
│   ├── geohazardwatch-plugins.md
│   ├── tsunamis.md                ← Content-only; live via ngdpbase `feeds` addon
│   ├── landslides.md               ← Content-only; live via ngdpbase `feeds` addon
│   ├── left-menu-content.md
│   └── footer-content.md
├── public/
│   ├── css/geohazardwatch.css      ← Served at /addons/geohazardwatch/css/
│   └── vendor/leaflet/             ← Vendored Leaflet.js assets for map plugins
└── data/                           ← volcanoes.json, eruptions.json, earthquakes.json, activity.json (gitignored)
```

---

## Tsunami & Landslide pages

`pages/tsunamis.md` and `pages/landslides.md` are seeded like any other page, but they carry no import script or data manager in this repo. They render live data with `[{DataFeed source='...'}]` markup — a plugin supplied by ngdpbase's own `feeds` addon ([ngdpbase#685](https://github.com/jwilleke/ngdpbase/issues/685)), not by geohazardwatch.

To make the feeds render, enable the `feeds` addon and declare its sources in the instance's `app-custom-config.json`:

| Page | Feed source | Upstream |
|------|-------------|----------|
| Tsunamis | `tsunami-alerts` | NOAA/NWS `api.weather.gov` active tsunami alerts |
| Landslides | `landslide-events` | NASA COOLR Global Landslide Catalog (ArcGIS FeatureServer) |

See the `Configuration` section inside each page file for the exact source block to paste (adapter, field mappings, poll interval). If the `feeds` addon is absent or a source isn't configured, the page falls back to static informational content — no error, no missing data files to import.

`schemaType` on both sources stays `Article` until ngdpbase implements the `WarningAlert`/`Event` schema.org union types ([ngdpbase#762](https://github.com/jwilleke/ngdpbase/issues/762)); `type` carries the intended domain label in the meantime. The COOLR field names in the Landslides source block should be re-verified against the live FeatureServer schema before relying on them in production — ArcGIS field casing can drift between service revisions.

---

## Data sources

| Source | URL |
|--------|-----|
| GVP Holocene volcanoes | <https://volcano.si.edu/> |
| GVP WFS API | <https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows> |
| USGS Earthquake feeds | <https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary> |
| USGS HANS API | <https://volcanoes.usgs.gov/hans-public/api> |
| Volcano detail page | `https://volcano.si.edu/volcano.cfm?vn={number}` |
| NOAA/NWS tsunami alerts *(via ngdpbase `feeds` addon)* | <https://api.weather.gov/alerts/active> |
| NASA COOLR landslide catalog *(via ngdpbase `feeds` addon)* | <https://maps.nccs.nasa.gov/mapping/rest/services/COOLR/COOLR_Events_Point/FeatureServer> |
