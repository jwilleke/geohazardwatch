# Earthquake Data Sources

Not one of the four the user asked about by name, but the same treatment applies: earthquakes are a first-class pillar of this platform (own manager, own plugins, own import script, own dedicated feed), just like volcanoes/landslides/tsunamis/wildfire-thermal.

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll/import cadence | Rendered on |
|---|---|---|---|---|
| `EarthquakeDataManager` | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/<feed>.geojson` (USGS) | **Primary**, single source, no re-publishers involved | manual (`npm run import:earthquakes[:month]`) | `geohazardwatch-earthquakes.md`, EarthquakeList/Map plugins, `/api/geohazardwatch/*` |

USGS's own standard summary feeds — no third party in between, unlike the volcano-activity situation. Available feed variants (selectable via `--feed=`):

| Feed name | Covers |
|---|---|
| `4.5-week` | M4.5+, past 7 days (default) |
| `2.5-week` | M2.5+, past 7 days |
| `4.5-month` | M4.5+, past 30 days |
| `significant-week` / `significant-month` | USGS's own "significant" designation |

## Cross-references to other pillars (already implemented)

- **Volcano proximity**: every earthquake is checked against the GVP volcano catalog; any quake within 50 km of a volcano summit gets `nearestVolcano` stamped on it. This is the same proximity-join pattern later reused by `FirmsHotspotsPlugin` for thermal-anomaly matching (see `wildfire-sources.md`).
- **Tsunami potential**: USGS's own GeoJSON already includes a per-quake `tsunami` boolean (tsunami-generation potential), exposed via `EarthquakeDataManager`'s `tsunamiOnly` filter. See `tsunami-sources.md` for how this relates to (and differs from) the official NWS tsunami-alerts feed.
- **PAGER alert level** (`green`/`yellow`/`orange`/`red`) is also carried straight through from USGS.

## Known issues / follow-ups

- Import is manual (`npm run import:earthquakes`), not on a poll interval like the `feeds`-addon-based hazard types — no automatic refresh unless someone runs the script or a scheduled job triggers it. Worth checking whether a CronJob already handles this in production (the `geohazardwatch-data-refresh` CronJob seen in the cluster) or whether it needs to be added.
- Same single-source risk profile as landslides/tsunamis: no fallback if USGS's feed has an outage, but USGS's summary feeds are about as authoritative and reliable as earthquake data gets, so this is lower-priority than the volcano-side redundancy/orphaned-pipeline issues.
