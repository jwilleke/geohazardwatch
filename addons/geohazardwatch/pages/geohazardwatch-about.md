---
title: About geohazardwatch
uuid: 98f2df76-5d86-472a-9862-9a01267cf4a7
slug: geohazardwatch-about
description: What geohazardwatch is, where the data comes from, and how to interpret data freshness
tags: [geology, about, data-sources, volcanoes, earthquakes]
author: system
---

## About geohazardwatch

**geohazardwatch** is an open-source add-on for the [ngdpbase](https://github.com/jwilleke/ngdpbase)
wiki platform that brings volcano and earthquake data into wiki pages via simple markup tags.

It is not a live data feed — it works by importing snapshots from public scientific APIs and
making that data available to wiki plugins. This keeps the site fast and resilient to upstream
outages, at the cost of some data freshness.

---

## What data is available

| Dataset | Provider | Coverage |
|---------|----------|----------|
| Volcano catalog | Smithsonian Global Volcanism Program (GVP) | ~2,600 Holocene and Pleistocene volcanoes worldwide |
| Eruption history | Smithsonian GVP | Historical eruption records, confirmed and uncertain |
| Earthquake data | USGS Earthquake Hazards Program | Global M4.5+ events, past 7 days (default) |
| US volcano alerts | USGS Hazard Alert Notification System (HANS) | 65 monitored US volcanoes |

---

## Data sources

### Smithsonian Global Volcanism Program (GVP)

The GVP maintains the world's most comprehensive catalog of volcanic activity.
The geohazardwatch volcano catalog is drawn from the GVP WFS API and covers:

- Basic facts: name, GVP number, country, region, coordinates, elevation
- Classification: volcano type, dominant rock type, tectonic setting
- Epoch: Holocene (erupted in the last ~11,700 years) or Pleistocene (older)
- Eruption history: confirmed and uncertain eruptions with VEI, start/end dates, and evidence type

**Source:** [volcano.si.edu](https://volcano.si.edu/)
**Data citation:** Global Volcanism Program, 2025. Volcanoes of the World (v. 5.3.4).
Smithsonian Institution. [https://doi.org/10.5479/si.GVP.VOTW5-2023.5.3](https://doi.org/10.5479/si.GVP.VOTW5-2023.5.3)

### USGS Earthquake Hazards Program

The USGS monitors global seismic activity in near-real-time. geohazardwatch imports the
M4.5+ past-7-days feed by default. Earthquakes are cross-referenced with the GVP
volcano catalog to identify events within 50 km of a known volcano.

Each earthquake record includes:

- Magnitude and depth
- Location and coordinates
- PAGER economic alert level (green / yellow / orange / red) where assessed
- Tsunami flag (USGS-issued, not a guarantee of actual wave generation)
- Nearest volcano within 50 km (if any)

**Source:** [earthquake.usgs.gov](https://earthquake.usgs.gov/)
**Feed:** [USGS GeoJSON Feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/)

### USGS Hazard Alert Notification System (HANS)

HANS provides real-time alert levels for the 65 US volcanoes monitored by the USGS
Volcano Hazards Program. Alert levels follow a four-level scale (NORMAL → ADVISORY →
WATCH → WARNING) paired with aviation colour codes (GREEN → YELLOW → ORANGE → RED).

Coverage is limited to **US volcanoes only** — primarily in Alaska, Hawaii, the Cascades,
and the western US. For global volcanic activity use the GVP-sourced plugins.

**Source:** [volcanoes.usgs.gov](https://volcanoes.usgs.gov/)
**Live HANS data:** [volcanoes.usgs.gov/hans-public/api/](https://volcanoes.usgs.gov/hans-public/api/)

---

## Data freshness

All data on this site is a **point-in-time snapshot**, not a live feed. Data is imported
by running the addon's import scripts manually (or on a schedule if configured).

| Dataset | Recommended refresh cadence |
|---------|---------------------------|
| Volcano catalog | Weekly (changes rarely) |
| Eruption history | Weekly |
| Earthquake data | Every 15–30 minutes for current activity |
| US volcano alerts | Every 5–15 minutes for current hazards |

If you need live data, visit the source portals directly (links above).

---

## Plugin reference

Seven wiki markup plugins are available:

| Plugin | What it renders |
|--------|----------------|
| `[{VolcanoInfobox number='...'}]` | Sidebar card for a single volcano |
| `[{VolcanoList}]` | Paginated, filterable table of volcanoes |
| `[{VolcanoSearch}]` | Interactive live-search widget with dropdowns |
| `[{VolcanoMap}]` | Interactive Leaflet map with volcano markers |
| `[{EarthquakeList}]` | Paginated table of recent earthquakes with alert badges |
| `[{EarthquakeMap}]` | Interactive Leaflet map of earthquake events |
| `[{HansAlerts}]` | US volcano alert level table |

Full usage guide with examples: [Plugin Guide](/wiki/geohazardwatch-plugins)

---

## Open source

geohazardwatch is open source and available at [github.com/jwilleke/geohazardwatch](https://github.com/jwilleke/geohazardwatch).
The ngdpbase platform that powers this wiki is at [github.com/jwilleke/ngdpbase](https://github.com/jwilleke/ngdpbase).
