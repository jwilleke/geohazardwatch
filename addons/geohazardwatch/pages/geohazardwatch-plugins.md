---
title: Plugin Guide
uuid: 93595dc0-1ba1-422a-9fd4-c2f6bf056b27
slug: geohazardwatch-plugins
description: End-user guide to all geohazardwatch plugins — what they render, how to use them, and common combinations
tags: [geology, plugins, guide, volcanoes, earthquakes]
author: system
---

## geohazardwatch Plugin Guide

This page is for **content editors**. It explains each plugin tag provided by the geohazardwatch addon,
shows you what it renders, and gives copy-paste markup you can use on any page.

For developer reference (config keys, API endpoints, import scripts) see the
[addon README](https://github.com/jwilleke/geohazardwatch/blob/main/addons/geohazardwatch/README.md).

---

## VolcanoInfobox

**What it renders:** A sidebar card for a single volcano — name, GVP number, country, type,
elevation, tectonic setting, and a link to the Smithsonian volcano page.

**When to use it:** On any page dedicated to a specific volcano, or as a quick fact
panel alongside longer text.

**You need:** The GVP volcano number (4–6 digits, found on
[volcano.si.edu](https://volcano.si.edu/)).

### Standard infobox

```
[{VolcanoInfobox number='332010'}]
```

Renders a full card for Kīlauea (GVP 332010).

### Compact (inline name only)

```
[{VolcanoInfobox number='211060' style='compact'}]
```

Renders just the volcano name as a styled inline span — useful mid-sentence.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `number` | *(required)* | GVP volcano number |
| `style` | `default` | `default` — full card; `compact` — inline name span |

---

## VolcanoList

**What it renders:** A paginated, filterable table of volcanoes — columns for GVP number,
name, country, type, rock type, tectonic setting, and elevation. GVP numbers link to the
Smithsonian page.

**When to use it:** When you want a static table of volcanoes matching a specific filter
embedded in a page.

**Tip:** For an interactive search experience, use **VolcanoSearch** instead.

### All volcanoes in a country (paginated)

```
[{VolcanoList country='Japan'}]
```

### Holocene stratovolcanoes in a region

```
[{VolcanoList region='Alaska Peninsula and Aleutian Islands' epoch='Holocene' volcanoType='Stratovolcano'}]
```

### Compact list for a sidebar

```
[{VolcanoList country='Iceland' epoch='Holocene' limit='10'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `query` | | Free-text search on volcano name |
| `country` | | Filter by country |
| `region` | | Filter by GVP region |
| `volcanoType` | | Filter by volcano type (e.g. `Stratovolcano`, `Caldera`) |
| `rockType` | | Filter by dominant rock type |
| `tectonicSetting` | | Filter by tectonic setting |
| `epoch` | | `Holocene` or `Pleistocene` |
| `limit` | `25` | Rows per page |
| `offset` | `0` | Skip this many rows (for manual pagination) |

**Pagination:** Previous / Next buttons appear automatically when results exceed `limit`.

---

## VolcanoSearch

**What it renders:** An interactive search widget with a text box and dropdowns for
country, region, volcano type, and epoch. Results update as you type or change filters.
Each result links to the Smithsonian GVP volcano page.

**When to use it:** On a dedicated search or browse page where visitors want to explore
the full volcano catalog interactively.

**Combines well with:** VolcanoMap on the same page — editors can put the search above
the map for a complete browsing experience.

### Basic (no pre-selection)

```
[{VolcanoSearch}]
```

### Pre-filtered to Holocene, showing 50 results

```
[{VolcanoSearch defaultEpoch='Holocene' defaultLimit='50'}]
```

### Pre-filtered to a specific country

```
[{VolcanoSearch defaultCountry='Indonesia'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `defaultEpoch` | | Pre-select the epoch dropdown (`Holocene` or `Pleistocene`) |
| `defaultCountry` | | Pre-select the country dropdown |
| `defaultLimit` | `25` | Results per page |

---

## VolcanoMap

**What it renders:** An interactive Leaflet map with clickable volcano markers.
Red markers = Holocene volcanoes; blue markers = Pleistocene volcanoes.
Clicking a marker shows the volcano name and GVP number.

**When to use it:** Any page where geographic context matters — country pages, region
summaries, or alongside VolcanoSearch.

**Combines well with:** VolcanoSearch above the map gives a full explore-and-locate
experience.

### World map of all Holocene volcanoes

```
[{VolcanoMap epoch='Holocene'}]
```

### Map centred on Japan

```
[{VolcanoMap country='Japan' lat='36' lon='138' zoom='5' height='500'}]
```

### Map of a specific region, taller

```
[{VolcanoMap region='Mediterranean and Western Asia' height='600' zoom='4'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `country` | | Show only volcanoes in this country |
| `region` | | Show only volcanoes in this GVP region |
| `volcanoType` | | Filter by volcano type |
| `epoch` | | `Holocene` or `Pleistocene` |
| `minElevation` / `maxElevation` | | Elevation range in metres |
| `limit` | `5000` | Max markers to plot |
| `height` | `450` | Map height in pixels |
| `lat` / `lon` | `20` / `0` | Initial map centre (latitude / longitude) |
| `zoom` | `2` | Initial zoom level (2 = world; 5–6 = country; 8–10 = regional) |

**Performance note:** The default `limit='5000'` covers most filtered sets. For unfiltered
global maps the full dataset (~2,600 volcanoes) loads quickly via the local API.

---

## EarthquakeList

**What it renders:** A paginated table of recent earthquakes — columns for date/time,
magnitude, location, depth, distance to nearest volcano (if within 50 km), PAGER alert
badge, and tsunami flag.

**When to use it:** On earthquake or hazard monitoring pages, or on volcano pages to show
local seismic activity.

**Data:** Reflects the most recent import snapshot. Run `npm run import:earthquakes` to
refresh. Default feed covers M4.5+ earthquakes from the past 7 days.

### All recent M4.5+ earthquakes

```
[{EarthquakeList}]
```

### Only earthquakes near volcanoes

```
[{EarthquakeList nearVolcano='true'}]
```

### High-magnitude filter with tsunami flag

```
[{EarthquakeList minMagnitude='6' tsunamiOnly='true' limit='10'}]
```

### By PAGER alert level

```
[{EarthquakeList alert='orange' limit='25'}]
[{EarthquakeList alert='red' limit='10'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minMagnitude` / `maxMagnitude` | | Magnitude range (e.g. `minMagnitude='5'`) |
| `minDepth` / `maxDepth` | | Depth range in km |
| `nearVolcano` | | `true` — only events within 50 km of a known volcano |
| `tsunamiOnly` | | `true` — only events with USGS tsunami flag |
| `alert` | | PAGER level: `green`, `yellow`, `orange`, or `red` |
| `limit` | `50` | Rows per page |
| `offset` | `0` | Skip this many rows (for manual pagination) |

**PAGER alert levels:** green = low impact, yellow = some impact, orange = significant
impact, red = major impact. Not all earthquakes receive PAGER assessments.

**Pagination:** Previous / Next buttons appear automatically when results exceed `limit`.

---

## EarthquakeMap

**What it renders:** An interactive Leaflet map of earthquakes, coloured by PAGER alert
level (green / yellow / orange / red). Optionally overlays volcano markers. Clicking a
marker shows magnitude, location, and depth.

**When to use it:** On seismic monitoring or hazard pages, and alongside EarthquakeList
for a map + table view.

**Combines well with:** Place EarthquakeList above or below EarthquakeMap for a complete
view of recent seismic activity.

### Basic map of all recent earthquakes

```
[{EarthquakeMap}]
```

### Significant earthquakes with volcano overlay

```
[{EarthquakeMap minMagnitude='5' showVolcanoes='true' height='500'}]
```

### Only earthquakes near volcanoes

```
[{EarthquakeMap nearVolcano='true' showVolcanoes='true'}]
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minMagnitude` / `maxMagnitude` | | Magnitude filter |
| `nearVolcano` | | `true` — only events within 50 km of a volcano |
| `showVolcanoes` | | `true` — overlay red volcano markers on the map |
| `height` | `450` | Map height in pixels |
| `lat` / `lon` | `20` / `0` | Initial map centre |
| `zoom` | `2` | Initial zoom level |

---

## HansAlerts

**What it renders:** A table of US volcano alert levels from the USGS Hazard Alert
Notification System (HANS) — columns for volcano name, observatory, current alert level,
aviation colour code, and last update time. Only volcanoes with elevated alerts
(ADVISORY or above) appear by default.

**When to use it:** On US volcano monitoring or hazard pages. Covers 65 USGS-monitored
volcanoes in Alaska, Hawaii, the Cascades, and other US volcanic regions.

**Limitation:** Covers US volcanoes only. For global volcanic activity, use VolcanoList
or VolcanoMap.

### All currently elevated US volcanoes

```
[{HansAlerts}]
```

### Filtered by observatory

```
[{HansAlerts observatory='avo'}]
[{HansAlerts observatory='hvo'}]
[{HansAlerts observatory='cvo'}]
```

| Observatory code | Full name |
|-----------------|-----------|
| `avo` | Alaska Volcano Observatory |
| `hvo` | Hawaiian Volcano Observatory |
| `cvo` | Cascades Volcano Observatory |
| `yvo` | Yellowstone Volcano Observatory |
| `uvo` | Utah Seismograph Stations |

| Alert level | Aviation code | Meaning |
|-------------|--------------|---------|
| NORMAL | GREEN | Background activity |
| ADVISORY | YELLOW | Elevated unrest above background |
| WATCH | ORANGE | Heightened unrest, increased eruption potential |
| WARNING | RED | Eruption imminent or underway |

**Data:** Reflects the most recent import snapshot. Run `npm run import:hans` to refresh.
For live HANS data visit [volcanoes.usgs.gov](https://volcanoes.usgs.gov/).

---

## VaacAdvisories

**What it renders:** A table of active Volcanic Ash Advisories from the Washington VAAC
(Volcano Observatory Notification for Aviation Advisory Center) — columns for volcano
name, region, ash cloud top altitude, cloud motion, issue time, and a link to the source
advisory. An advisory counts as active if it's the most recent one for that volcano and
was issued within the last 48 hours (Washington reissues roughly every 6 hours while ash
is still being tracked).

**When to use it:** On a global hazard summary page alongside HansAlerts and
EarthquakeList.

**Limitation:** Covers only the Washington VAAC's region (Americas, E. Pacific,
Caribbean) — one of nine ICAO-mandated regional VAACs. The other eight are not yet
integrated (see [geohazardwatch#5](https://github.com/jwilleke/geohazardwatch/issues/5)).

### All active advisories

```
[{VaacAdvisories}]
```

### Filtered by region

```
[{VaacAdvisories region='GUATEMALA'}]
```

**Data:** Reflects the most recent import snapshot. Run `npm run import:vaac` to refresh.
For live advisories visit the
[Washington VAAC archive](https://www.ospo.noaa.gov/products/atmosphere/vaac/archive.html).

---

## FirmsHotspots

**What it renders:** Volcanoes currently showing a NASA FIRMS thermal anomaly within
5 km of the summit — columns for volcano name, distance, radiative power (MW),
satellite confidence, and detection time.

**Unlike every other plugin above, this one has no import script or data manager in
this repo.** FIRMS data is ingested by ngdpbase's generic `feeds` addon
(`adapter: 'csv'`) — this plugin only reads already-fetched records and joins them
against the volcano catalog at render time, cached until the feed's next poll (default
hourly). See [geohazardwatch#4](https://github.com/jwilleke/geohazardwatch/issues/4) and
[ngdpbase#911](https://github.com/jwilleke/ngdpbase/issues/911).

**When to use it:** On a global hazard summary page alongside HansAlerts and
VaacAdvisories.

**Limitation:** Satellite-detected heat, not a confirmed eruption — wildfires and other
heat sources near a volcano's coordinates can produce a false positive. Cross-check
against VolcanoInfobox/HansAlerts before treating a hit as eruption activity.

### All active hotspots

```
[{FirmsHotspots}]
```

### Limited to the top 10 by radiative power

```
[{FirmsHotspots limit='10'}]
```

**Data:** Live, via the `feeds` addon's own poll schedule — no manual refresh command.
For the raw feed visit [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/).

---

## Combining plugins

Some plugins work especially well together on the same page:

### Full volcano browse page

```
[{VolcanoSearch defaultEpoch='Holocene'}]

[{VolcanoMap epoch='Holocene' height='500'}]
```

### Country or region page

```
[{VolcanoInfobox number='XXXXXX'}]

[{VolcanoList country='Chile' epoch='Holocene'}]

[{VolcanoMap country='Chile' lat='-30' lon='-70' zoom='4'}]

[{EarthquakeList nearVolcano='true' minMagnitude='4.5' limit='15'}]
```

### Seismic monitoring dashboard

```
[{EarthquakeList nearVolcano='true' minMagnitude='4.5'}]

[{EarthquakeMap nearVolcano='true' showVolcanoes='true' height='500'}]
```

### US hazard overview

```
[{HansAlerts}]

[{EarthquakeList nearVolcano='true' minMagnitude='4' limit='20'}]

[{EarthquakeMap nearVolcano='true' showVolcanoes='true'}]
```

---

## Data freshness

All plugins read from local data snapshots imported from public APIs. Data is **not live** —
it reflects the state at the time of the last import.

| Data | Source | Import command |
|------|--------|---------------|
| Volcano catalog | Smithsonian GVP | `npm run import` |
| Eruption records | Smithsonian GVP | `npm run import:eruptions` |
| Earthquake data | USGS (M4.5+, past 7 days) | `npm run import:earthquakes` |
| US volcano alerts | USGS HANS | `npm run import:hans` |

For live data visit the source portals directly — links on the [About geohazardwatch](/view/geohazardwatch-about) page.
