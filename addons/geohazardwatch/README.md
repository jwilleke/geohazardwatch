# geohazardwatch Add-on

Volcano & geology data platform for [ngdpbase](https://github.com/jwilleke/ngdpbase), powered by
[Global Volcanism Program (GVP)](https://volcano.si.edu/) and
[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) data.

For end-user documentation (what renders, when to use each plugin, example combinations),
see the in-wiki guide seeded at `/wiki/geohazardwatch-plugins`.

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

## Wiki Markup Reference

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

**Common use:** Add a `default` infobox at the top of a volcano-specific wiki page, or use
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
```

Custom options (run directly):

```sh
# Custom data directory
node addons/geohazardwatch/import/import-volcanoes.js --data-dir /path/to/data

# Specific earthquake feed
node addons/geohazardwatch/import/import-earthquakes.js --feed=significant-week
# Available feeds: significant-week, 4.5-week, 2.5-week, 4.5-month, significant-month
```

Earthquake import requires `volcanoes.json` to already exist (for proximity matching).

---

## Configuration keys

Set in your ngdpbase `app-custom-config.json`:

| Key | Default | Description |
|-----|---------|-------------|
| `ngdpbase.addons.geohazardwatch.enabled` | `false` | Enable the add-on |
| `ngdpbase.addons.geohazardwatch.dataPath` | `./data/geohazardwatch` | Path to data directory |

---

## Structure

```
addons/geohazardwatch/
├── index.js                        ← AddonModule entry point
├── managers/
│   ├── VolcanoDataManager.js       ← Loads volcanoes.json + eruptions.json
│   └── EarthquakeDataManager.js    ← Loads earthquakes.json snapshot
├── plugins/
│   ├── VolcanoInfoboxPlugin.js
│   ├── VolcanoListPlugin.js
│   ├── VolcanoSearchPlugin.js
│   ├── VolcanoMapPlugin.js
│   ├── EarthquakeListPlugin.js
│   └── EarthquakeMapPlugin.js
├── routes/
│   └── api.js                      ← /api/geohazardwatch/* endpoints
├── import/
│   ├── import-volcanoes.js         ← GVP WFS API importer
│   └── import-earthquakes.js       ← USGS feed importer + proximity matching
├── pages/                          ← Seeded into ngdpbase on first load
│   ├── geohazardwatch-volcanoes.md
│   ├── geohazardwatch-earthquakes.md
│   ├── geohazardwatch-demo.md
│   └── geohazardwatch-japan.md
├── public/
│   └── css/geohazardwatch.css          ← Served at /addons/geohazardwatch/css/
└── data/                           ← volcanoes.json, eruptions.json, earthquakes.json (gitignored)
```

---

## Data sources

| Source | URL |
|--------|-----|
| GVP Holocene volcanoes | <https://volcano.si.edu/> |
| GVP WFS API | <https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows> |
| USGS Earthquake feeds | <https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary> |
| Volcano detail page | `https://volcano.si.edu/volcano.cfm?vn={number}` |
