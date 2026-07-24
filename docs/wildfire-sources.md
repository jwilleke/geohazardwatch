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

## Known issues / follow-ups

- If a real wildfire feature (not just volcano-adjacent thermal detection) is ever wanted, `firms-viirs` is already the right upstream source — it would need its own page/plugin rather than reusing `FirmsHotspotsPlugin`, which is purpose-built for the volcano proximity join.
- Like `VaacAdvisoriesPlugin`, this pipeline works and has real data but isn't surfaced anywhere a visitor would see it — worth deciding whether to wire it into `VolcanoActivity.md` or a dedicated page, or leave it demo-only.
- The FIRMS API key lives only in production's `app-custom-config.json` (not in this repo) — do not add the literal key value to any committed file.
