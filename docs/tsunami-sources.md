# Tsunami Data Sources

## At a glance

| Our pipeline | Upstream (real source) | Kind | Poll interval | Rendered on |
|---|---|---|---|---|
| `tsunami-alerts` (ngdpbase `feeds` addon) | `api.weather.gov/alerts/active` (NOAA / National Weather Service) | **Primary**, single source, no bespoke code | 10 min | `Tsunamis.md` (`/view/tsunamis`) |
| `tsunami` flag on `EarthquakeDataManager` records | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary` (USGS) | **Secondary/related signal** — USGS's own per-quake tsunami-potential boolean, not an alert feed | shares the earthquake import cadence | exposed via `EarthquakeDataManager`'s `tsunamiOnly` filter; not a dedicated tsunami page |

Like landslides, the primary tsunami feed is a single declarative `DataFeed` config entry (`geojson` adapter) with no bespoke manager/plugin — filtered directly to `event=Tsunami Warning,Tsunami Advisory,Tsunami Watch` against NWS's own active-alerts API. This is the *actual issuing authority* for US tsunami alerts, not a re-publisher — there's no equivalent to volcano data's re-publisher problem here.

The USGS earthquake feed separately flags whether a quake has tsunami potential (`e.tsunami`, a plain boolean from USGS's own GeoJSON `properties.tsunami` field). This is a different kind of signal — "this earthquake could generate a tsunami" vs. "an official tsunami alert is active" — and currently has no page of its own; it's queryable via the addon's earthquake API/manager but not surfaced as tsunami content directly.

## Field mapping (production config)

| Displayed field | Source field |
|---|---|
| event | `properties.event` |
| severity | `properties.severity` |
| area | `properties.areaDesc` |
| effective | `properties.effective` |
| expires | `properties.expires` |
| headline | `properties.headline` |
| link | `id` (the alert's own URL) |

`recordIdField: id`.

## Known issues / follow-ups

- Confirmed working end-to-end this session (ngdpbase#922 — the `link=` template double-encoding bug affected this page's links too, since it uses the same bare-placeholder `link='event=:url'` pattern as VolcanoActivity; fixed in ngdpbase v3.62.1).
- At time of writing, `tsunami-alerts` has zero active records (no current US tsunami warnings) — the page renders "no records," which is expected/correct, not a bug.
- No cross-reference yet between an active tsunami alert and the earthquake(s) that may have triggered it — the two pipelines are independent. Could be a natural pairing (similar to the existing earthquake↔volcano proximity join) if there's appetite for it.
