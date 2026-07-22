# geohazardwatch Add-on

Volcano & geology data platform for [ngdpbase](https://github.com/jwilleke/ngdpbase), powered by
[Global Volcanism Program (GVP)](https://volcano.si.edu/) and
[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) data.

For end-user documentation (what renders, when to use each plugin, example combinations),
see the guide seeded at `/view/geohazardwatch-plugins`.

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

**Common use:** Add a `default` infobox at the top of a volcano-specific page, or use
`compact` inline within body text — e.g. "…near [{VolcanoInfobox number='332010' style='compact'}]…"

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

**Common use:** `[{VolcanoList country='Japan' epoch='Holocene' limit='20'}]` for a country
page sidebar; `[{VolcanoList volcanoType='Caldera' limit='50'}]` for a type-specific browse page.
Previous / Next pagination controls render automatically when results exceed `limit`.

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

**Common use:** `[{VolcanoSearch defaultEpoch='Holocene' defaultLimit='50'}]` on a main
volcano browse page; combine with VolcanoMap below it for a full explore experience.

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

**Common use:** `[{VolcanoMap country='Indonesia' lat='-2' lon='118' zoom='4' height='500'}]`
for a country page; `[{VolcanoMap epoch='Holocene'}]` for a global overview.

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

**Common use:** `[{EarthquakeList nearVolcano='true' minMagnitude='4.5' limit='25'}]` on a
seismic monitoring page; `[{EarthquakeList alert='red' limit='10'}]` for a hazard summary widget.
Previous / Next pagination controls render automatically when results exceed `limit`.

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

**Common use:** `[{EarthquakeMap nearVolcano='true' showVolcanoes='true' height='500'}]` as a
companion to EarthquakeList; `[{EarthquakeMap minMagnitude='6'}]` for major-event tracking.

---

### HansAlerts

Renders a table of US volcano alert levels from the USGS HANS API. By default shows only
volcanoes at ADVISORY level or above. Filter by observatory to show a regional subset.

```
[{HansAlerts}]
[{HansAlerts observatory='avo'}]
[{HansAlerts observatory='hvo'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `observatory` | | Filter by observatory code: `avo`, `hvo`, `cvo`, `yvo`, `uvo` |

**Common use:** `[{HansAlerts}]` on a US hazard summary page; `[{HansAlerts observatory='avo'}]`
on an Alaska-specific page. Covers US volcanoes only.

---

## Admin panel

`/addons/geohazardwatch` — status dashboard (record counts, HANS elevated alerts).
Requires an authenticated session; the two refresh buttons require the `admin` role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/addons/geohazardwatch` | Status dashboard (authenticated) |
| POST | `/addons/geohazardwatch/jobs/hans` | Enqueue a HANS refresh job (admin) |
| POST | `/addons/geohazardwatch/jobs/earthquakes` | Enqueue an earthquake refresh job (admin) |

Both jobs also run automatically on a timer via ngdpbase's `BackgroundJobManager` —
see `hansIntervalMs` / `eqIntervalMs` in Configuration keys.

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

**Search query parameters:** `q`, `country`, `region`, `volcanoType`, `rockType`,
`tectonicSetting`, `epoch`, `minElevation`, `maxElevation`, `minLatitude`,
`maxLatitude`, `minLongitude`, `maxLongitude`, `limit` (default 100), `offset` (default 0).

### Earthquake endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/earthquakes/search` | Search/filter earthquakes |
| GET | `/earthquakes/near/:number` | Earthquakes near a specific volcano |
| GET | `/earthquakes/status` | Feed metadata (source, fetch time, counts) |

**Earthquake search parameters:** `minMagnitude`, `maxMagnitude`, `minDepth`, `maxDepth`,
`nearVolcano` (true/false), `tsunamiOnly` (true/false), `alert`,
`limit` (default 50), `offset` (default 0).

### HANS alert endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hans/elevated` | List volcanoes at ADVISORY level or above |
| GET | `/hans/volcano/:number` | Alert status for a single GVP volcano number |
| GET | `/hans/status` | Feed metadata (last fetch time, monitored/elevated counts) |

**`/hans/elevated` query parameters:** `alertLevel`, `colorCode`, `observatory`
(`avo`, `hvo`, `cvo`, `yvo`, `uvo`).

---

## Import scripts

Run from the geohazardwatch repo root (requires internet access).

```sh
# Volcanoes only
npm run import

# Volcanoes + eruption records
npm run import:eruptions

# Volcanoes + eruptions + global activity snapshot
npm run import:all

# Earthquake data (M4.5+ past 7 days — default)
npm run import:earthquakes

# Earthquake data (M4.5+ past 30 days)
npm run import:earthquakes:month

# Global activity snapshot
npm run import:activity

# USGS HANS real-time US volcano alert levels
npm run import:hans
```

Custom options (run directly):

```sh
# Custom data directory
node addons/geohazardwatch/import/import-volcanoes.js --data-dir /path/to/data

# Specific earthquake feed
node addons/geohazardwatch/import/import-earthquakes.js --feed=significant-week
# Available feeds: significant-week, 4.5-week, 2.5-week, 4.5-month, significant-month

# HANS import to a custom data directory
node addons/geohazardwatch/import/import-hans.js --data-dir /path/to/data
```

Earthquake import requires `volcanoes.json` to already exist (for proximity matching).
HANS import needs no auth and covers US volcanoes only (~65 monitored); it writes
`activity.json`, which `HansDataManager` treats as optional — the addon starts cleanly
without it. Both HANS and earthquake data also refresh automatically on a timer once the
addon is registered (see `hansIntervalMs` / `eqIntervalMs` below), or on demand from the
Admin panel.

---

## Configuration keys

Set in your ngdpbase `app-custom-config.json`:

| Key | Default | Description |
|-----|---------|-------------|
| `ngdpbase.addons.geohazardwatch.enabled` | `false` | Enable the add-on |
| `ngdpbase.addons.geohazardwatch.dataPath` | `./data/geohazardwatch` | Path to data directory |
| `ngdpbase.addons.geohazardwatch.hansIntervalMs` | `600000` (10 min) | HANS background refresh interval; `0` disables polling |
| `ngdpbase.addons.geohazardwatch.eqIntervalMs` | `1200000` (20 min) | Earthquake background refresh interval; `0` disables polling |

The Tsunami and Landslide pages render live data through a separate ngdpbase
`feeds` addon, configured independently — see [Tsunami & Landslide pages](#tsunami--landslide-pages) below.

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
├── import/
│   ├── import-volcanoes.js         ← GVP WFS API importer (volcanoes, eruptions, activity)
│   ├── import-earthquakes.js       ← USGS feed importer + proximity matching
│   └── import-hans.js              ← USGS HANS alert importer
├── pages/                          ← Seeded into ngdpbase on first load, never overwritten
│   ├── geohazardwatch-home.md
│   ├── geohazardwatch-about.md
│   ├── geohazardwatch-volcanoes.md
│   ├── geohazardwatch-earthquakes.md
│   ├── geohazardwatch-hans.md
│   ├── geohazardwatch-demo.md
│   ├── geohazardwatch-japan.md
│   ├── geohazardwatch-plugins.md
│   ├── geohazardwatch-request-access.md
│   ├── Tsunamis.md                ← Content-only; live via ngdpbase `feeds` addon
│   ├── Landslides.md               ← Content-only; live via ngdpbase `feeds` addon
│   ├── left-menu-content.md
│   └── footer-content.md
├── public/
│   ├── css/geohazardwatch.css      ← Served at /addons/geohazardwatch/css/
│   └── vendor/leaflet/             ← Vendored Leaflet.js assets for map plugins
└── data/                           ← volcanoes.json, eruptions.json, earthquakes.json, activity.json (gitignored)
```

---

## Tsunami & Landslide pages

`pages/Tsunamis.md` and `pages/Landslides.md` are seeded like any other page, but they
carry no import script or data manager in this repo. They render live data with
`[{DataFeed source='...'}]` markup — a plugin supplied by ngdpbase's own `feeds` addon
([ngdpbase#685](https://github.com/jwilleke/ngdpbase/issues/685)), not by geohazardwatch.

To make the feeds render, enable the `feeds` addon and declare its sources in the
instance's `app-custom-config.json`:

| Page | Feed source | Upstream |
|------|-------------|----------|
| Tsunamis | `tsunami-alerts` | NOAA/NWS `api.weather.gov` active tsunami alerts |
| Landslides | `landslide-events` | NASA COOLR Global Landslide Catalog (ArcGIS FeatureServer) |

See the `Configuration` section inside each page file for the exact source block to
paste (adapter, field mappings, poll interval). If the `feeds` addon is absent or a
source isn't configured, the page falls back to static informational content — no error,
no missing data files to import.

`schemaType` on both sources stays `Article` until ngdpbase implements the
`WarningAlert`/`Event` schema.org union types
([ngdpbase#762](https://github.com/jwilleke/ngdpbase/issues/762)); `type` carries the
intended domain label in the meantime. The COOLR field names in the Landslides source
block should be re-verified against the live FeatureServer schema before relying on them
in production — ArcGIS field casing can drift between service revisions.

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
