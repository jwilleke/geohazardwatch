# Wildfire / Thermal Anomaly Data Sources

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll interval | Rendered on |
|---|---|---|---|---|
| `firms-viirs` (ngdpbase `feeds` addon) → `FirmsHotspotsPlugin` | `firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/VIIRS_SNPP_NRT/world/1` (NASA FIRMS, VIIRS Suomi-NPP near-real-time) | __Primary__ — global satellite thermal-anomaly detections | 60 min | only `geohazardwatch-plugins.md` (internal demo page) |
| `fems-nfdr` (ngdpbase `feeds` addon) → `[{DataFeed}]` | `fems.fs2c.usda.gov/api/ext-climatology/download-nfdr-daily-summary/` (FEMS, USFS/interagency) | __Primary__ — NFDRS fire-danger indices + fuel moisture per RAWS station | 360 min | `/view/nfdrs` (geohazardwatch#173) |

## Important scoping note

There is currently __no general-purpose wildfire page or feature__ in this addon. NASA FIRMS (Fire Information for Resource Management System) is a general global fire/thermal-hotspot detection product — but the only consumer wired up here, `FirmsHotspotsPlugin`, uses it exclusively for __volcanic__ thermal-anomaly detection: it joins ~59k global hotspot records against ~2,600 GVP volcanoes by proximity and reports which volcanoes currently show a thermal anomaly near the summit (see the plugin's own doc comment, and geohazardwatch#4 / ngdpbase#911 for why that join lives in the plugin rather than the generic feeds adapter contract).

So: the raw data ingested (`firms-viirs`) is genuinely wildfire-detection-capable satellite data, but nothing in this addon currently treats it as a wildfire feature — it's volcano-only, and even that volcano-thermal use isn't rendered on any real content page yet (same "orphaned/demo-only" pattern as `VaacAdvisoriesPlugin`, see `volcano-sources.md`).

## Field mapping (production config)

| Displayed field | Source field |
|---|---|
| latitude | `latitude` |
| longitude | `longitude` |
| frp (fire radiative power) | `frp` |
| confidence | `confidence` |
| acq_date | `acq_date` |
| acq_time | `acq_time` |

Adapter: `csv` (unlike the other three hazard categories, which all use `geojson`).

## FEMS / NFDRS (geohazardwatch#173)

Fully declarative: a `csv` feed source plus `[{DataFeed format='table'}]` on `nfdrs.md`. __No import script, no data manager, no plugin__ — the same shape as the landslide and tsunami feeds, and the shape `volcano-sources.md` describes the repo migrating toward.

### Why `-daily-summary` and not `-daily-avg`

FEMS offers both. They are not interchangeable for our purposes:

- `download-nfdr-daily-avg/` prepends a preamble line — `"Stations used in the building of the data sheet are: PINE CREEK"` — *before* the header row, and averages across the requested stations so no per-row station identity survives.
- `download-nfdr-daily-summary/` has the header on row 0, no preamble, no BOM, and carries `StationName` and `StationId` on every row.

That distinction is load-bearing. `csv.ts` takes `rows[0]` as the header unconditionally and exposes only a `delimiter` option — no `skipLines`, no `headerRow`. Pointed at `-daily-avg`, the parsed header becomes the single bogus preamble cell and __every index column is silently discarded__; the feed ingests rows that contain nothing but a date. `-daily-summary` needs no adapter change at all.

### No API key, and no accumulation

The `download-nfdr-*` endpoints are open — no credential, verified against live data. `dataFormat=json` is accepted and ignored; these endpoints return CSV regardless.

`presetDate=-5Days7Days` keeps the URL static (5 days back plus a 7-day forecast, no date arithmetic to schedule). Because `RecordStore.upsertAll()` replaces the store rather than merging, each poll's 12 rows per station supersede the last — revised forecast rows do not accumulate, so no `dedupeBy` or `maxAgeHours` is needed.

### What the open endpoint cannot give us

- __Station coordinates and names catalogue.__ There is no public station-list endpoint (every candidate path 404s). Station numbers must be looked up by hand from the FEMS UI. This is why `/view/nfdrs` is a table and not a map — without lat/lon, `format='map'` is not available.
- __The adjective rating__ (Low → Extreme). Not published by the API; it is a percentile of each station's own climatology against locally-set thresholds. Deliberately not computed — see the page's own "What this page does not show".

FEMS does expose a GraphQL API at `/api/ext-climatology/graphql` with `nfdrsObs` and `stationMetaData` (which *would* supply the catalogue and coordinates), but it is unusable here on two counts: it requires a FEMS API-role key via a FAMAuth account, and it is POST-with-headers, which the feeds addon's `rest-json` adapter cannot issue — `restjson.ts` does a bare `fetch(cfg.url)` and `FeedSourceConfig` has no `method`/`headers`/`body`. Both would have to change before a key was worth anything.

## Wildfire alert design (decided, geohazardwatch#161)

Design decision for what counts as an "alert-worthy" wildfire unit on the consolidated [Alerts page](../addons/geohazardwatch/pages/alerts.md) (geohazardwatch#160). No new code in this decision itself — implementation belongs to the sub-issues below.

| Question | Decision | Rationale |
|---|---|---|
| Threshold | High-confidence detections only (`confidence` != low/nominal); no FRP floor | Matches the filter already live on `wildfires.md` (`exclude='confidence~^[ln]$'`) — reuses an existing, already-configured pattern instead of introducing a second, differently-tuned threshold |
| Clustering | Threshold-only for now — list raw high-confidence detections, not grouped events | `DataFeedPlugin` (ngdpbase `feeds` addon) supports `source`/`exclude`/`columns`/`sort`/`max`/`sizeBy`/`badge`/`link` but has no group-by/clustering parameter (verified against `DataFeedPlugin.ts`); real clustering (spatial grouping + event lifecycle) is separate, not-yet-started work and would need its own implementation issue |
| Scope | Global | Matches `wildfires.md`'s existing global map — scoping the Alerts-page list to US-only while the map stays global would be inconsistent between the two pages |
| Naming/display | Reverse geocode each detection to its nearest named place | `firms-viirs` only provides `latitude`/`longitude`/`frp`/`confidence`/`acq_date`/`acq_time` — no place name. Reverse geocoding is a __new external data source__ (provider TBD, likely requires an API key) — out of scope for #161 itself; needs its own issue and, per this repo's agent priority matrix, human review before implementation |

## Known issues / follow-ups

- If a real wildfire feature (not just volcano-adjacent thermal detection) is ever wanted, `firms-viirs` is already the right upstream source — it would need its own page/plugin rather than reusing `FirmsHotspotsPlugin`, which is purpose-built for the volcano proximity join.
- Like `VaacAdvisoriesPlugin`, this pipeline works and has real data but isn't surfaced anywhere a visitor would see it — worth deciding whether to wire it into `volcano-activity.md` or a dedicated page, or leave it demo-only.
- The FIRMS API key lives only in production's `app-custom-config.json` (not in this repo) — do not add the literal key value to any committed file.
