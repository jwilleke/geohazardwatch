---
title: Attribution
uuid: efaa8c71-593a-4155-84cd-04c770bc5247
slug: attribution
system-category: addon
description: Credit and citation for every data source geohazardwatch imports, links to, or displays
tags: [attribution, credits, data-sources, licensing, gvp, usgs, nasa, noaa]
author: system
---
## Attribution

geohazardwatch is a data platform, not a data producer. Every hazard record shown here — volcanoes, eruptions, earthquakes, alerts, tsunamis, and landslides — originates from a public data provider. This page credits each one and links back to the source.

## Volcanoes & Eruptions

**[Global Volcanism Program (GVP), Smithsonian Institution](https://volcano.si.edu/)** — the Volcanoes of the World (VOTW) database. Volcano records, eruption history, and global activity snapshots are imported from the [GVP-VOTW WFS service](https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows).

> Recommended citation: Global Volcanism Program, Smithsonian Institution. *Volcanoes of the World (VOTW) Database*. <https://volcano.si.edu/>

## Earthquakes

**[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/)** — real-time and recent earthquake data via the [USGS earthquake summary feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary). A work of the U.S. Government; USGS earthquake data is in the public domain.

## US Volcano Alerts

**[USGS Hazard Alert Notification System (HANS)](https://volcanoes.usgs.gov/hans-public/api/)** — current alert levels and color codes for USGS-monitored volcanoes. Also the source for **VONA** (Volcano Observatory Notification for Aviation) records, via HANS's `getVonasWithinLastYear` endpoint.

## Aviation Volcanic Ash Advisories

**[Aviation Weather Center, NOAA/NWS](https://aviationweather.gov/)** — Volcanic Ash SIGMETs (VA-SIGMETs), via the [Aviation Weather API](https://aviationweather.gov/data/api/).

## Tsunamis

**[National Weather Service, NOAA](https://www.weather.gov/)** — active tsunami warnings, watches, and advisories, via the [NWS Alerts API](https://api.weather.gov/). A work of the U.S. Government; NWS alert data is in the public domain.

**[NOAA National Centers for Environmental Information (NCEI) / World Data Service (WDS) — Global Historical Tsunami Database](https://www.ncei.noaa.gov/products/natural-hazards)** — historical tsunami event records referenced on the [Tsunamis](/view/tsunamis) page.

## Landslides

**[NASA Cooperative Open Online Landslide Repository (COOLR)](https://gpm.nasa.gov/landslides/) / Global Landslide Catalog** — global landslide event records, via NASA's [maps.nccs.nasa.gov ArcGIS FeatureServer](https://maps.nccs.nasa.gov/). A work of the U.S. Government; NASA data is generally not subject to copyright in the United States.

**[USGS Landslide Hazards Program](https://www.usgs.gov/programs/landslide-hazards)** — hazard mapping and technical reports referenced on the [Landslides](/view/landslides) page.

**NASA Global Precipitation Measurement (GPM) / LHASA nowcast** — rainfall-triggered landslide nowcasting, referenced on the [Landslides](/view/landslides) page.

## Platform

geohazardwatch is built as a domain add-on for **[ngdpbase](https://github.com/jwilleke/ngdpbase)**, an open-source content platform.

## Corrections

If a source is missing, miscredited, or a citation needs updating, please [contact us](/Contact) or open an issue at [github.com/jwilleke/geohazardwatch](https://github.com/jwilleke/geohazardwatch/issues).
