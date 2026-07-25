# Wildfire / Thermal Anomaly Data Sources

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll interval | Rendered on |
|---|---|---|---|---|
| `firms-viirs` (ngdpbase `feeds` addon) → `FirmsHotspotsPlugin` | `firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/VIIRS_SNPP_NRT/world/1` (NASA FIRMS, VIIRS Suomi-NPP near-real-time) | **Primary** — global satellite thermal-anomaly detections | 60 min | only `geohazardwatch-plugins.md` (internal demo page) |

## Important scoping note

There is currently **no general-purpose wildfire page or feature** in this addon. NASA FIRMS (Fire Information for Resource Management System) is a general global fire/thermal-hotspot detection product — but the only consumer wired up here, `FirmsHotspotsPlugin`, uses it exclusively for **volcanic** thermal-anomaly detection: it joins ~59k global hotspot records against ~2,600 GVP volcanoes by proximity and reports which volcanoes currently show a thermal anomaly near the summit (see the plugin's own doc comment, and geohazardwatch#4 / ngdpbase#911 for why that join lives in the plugin rather than the generic feeds adapter contract).

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

## Wildfire alert design (decided, geohazardwatch#161)

Design decision for what counts as an "alert-worthy" wildfire unit on the consolidated [Alerts page](../addons/geohazardwatch/pages/Alerts.md) (geohazardwatch#160). No new code in this decision itself — implementation belongs to the sub-issues below.

| Question | Decision | Rationale |
|---|---|---|
| Threshold | High-confidence detections only (`confidence` != low/nominal); no FRP floor | Matches the filter already live on `Wildfires.md` (`exclude='confidence~^[ln]$'`) — reuses an existing, already-configured pattern instead of introducing a second, differently-tuned threshold |
| Clustering | Threshold-only for now — list raw high-confidence detections, not grouped events | `DataFeedPlugin` (ngdpbase `feeds` addon) supports `source`/`exclude`/`columns`/`sort`/`max`/`sizeBy`/`badge`/`link` but has no group-by/clustering parameter (verified against `DataFeedPlugin.ts`); real clustering (spatial grouping + event lifecycle) is separate, not-yet-started work and would need its own implementation issue |
| Scope | Global | Matches `Wildfires.md`'s existing global map — scoping the Alerts-page list to US-only while the map stays global would be inconsistent between the two pages |
| Naming/display | Reverse geocode each detection to its nearest named place | `firms-viirs` only provides `latitude`/`longitude`/`frp`/`confidence`/`acq_date`/`acq_time` — no place name. Reverse geocoding is a **new external data source** (provider TBD, likely requires an API key) — out of scope for #161 itself; needs its own issue and, per this repo's agent priority matrix, human review before implementation |

## Known issues / follow-ups

- If a real wildfire feature (not just volcano-adjacent thermal detection) is ever wanted, `firms-viirs` is already the right upstream source — it would need its own page/plugin rather than reusing `FirmsHotspotsPlugin`, which is purpose-built for the volcano proximity join.
- Like `VaacAdvisoriesPlugin`, this pipeline works and has real data but isn't surfaced anywhere a visitor would see it — worth deciding whether to wire it into `VolcanoActivity.md` or a dedicated page, or leave it demo-only.
- The FIRMS API key lives only in production's `app-custom-config.json` (not in this repo) — do not add the literal key value to any committed file.
