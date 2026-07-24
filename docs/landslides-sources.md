# Landslide Data Sources

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll interval | Rendered on |
|---|---|---|---|---|
| `landslide-events` (ngdpbase `feeds` addon) | `maps.nccs.nasa.gov/.../COOLR/COOLR_Events_Point/FeatureServer` (NASA COOLR — Cooperative Open Online Landslide Repository) | **Primary**, single source, no bespoke code | daily at 06:00 | `Landslides.md` (`/view/landslides`) |

No redundancy here — unlike volcano data, landslides have exactly one pipeline: a generic `geojson`-adapter `DataFeed` config entry pointed straight at NASA's own COOLR ArcGIS FeatureServer. There's no bespoke manager/plugin (`addons/geohazardwatch/managers/` and `plugins/` have nothing landslide-specific) — it's entirely declarative config, rendered via `[{DataFeed source='landslide-events' ...}]` in `Landslides.md`.

## Field mapping (production config)

| Displayed field | Source field |
|---|---|
| title | `properties.event_title` |
| date | `properties.event_date` |
| category | `properties.landslide_category` |
| trigger | `properties.landslide_trigger` |
| fatalities | `properties.fatality_count` |
| country | `properties.country_name` |
| location | `properties.location_description` |
| link | `properties.source_link` |

`recordIdField: properties.event_id`.

## Known issues / follow-ups

- Field-name casing (`event_title`, `landslide_category`, etc.) is verified against the *current* FeatureServer schema, but ArcGIS services can change field names/casing on revision without much notice — worth a periodic sanity check.
- `type` is the domain label; `schemaType` stays `Article` until ngdpbase implements the `Event` schema.org union type (ngdpbase#762).
- No secondary/cross-check source exists (contrast with volcano data, which has 5+ overlapping feeds). If COOLR has an outage or schema break, there's currently no fallback.
