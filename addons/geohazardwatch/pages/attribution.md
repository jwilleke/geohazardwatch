---
title: Attribution
uuid: efaa8c71-593a-4155-84cd-04c770bc5247
slug: attribution
system-category: documentation
description: Credit and citation for every data source geohazardwatch imports, links to, or displays
tags: [attribution, credits, data-sources, licensing, gvp, usgs, nasa, noaa, firms, fems]
author: system
---
## Attribution

geohazardwatch is a data platform, not a data producer. Every hazard record shown here — volcanoes, eruptions, earthquakes, alerts, tsunamis, and landslides — originates from a public data provider. This page credits each one and links back to the source.

## Volcanoes & Eruptions

__[Global Volcanism Program (GVP), Smithsonian Institution](https://volcano.si.edu/)__ — the Volcanoes of the World (VOTW) database. Volcano records, eruption history, and global activity snapshots are imported from the [GVP-VOTW WFS service](https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows).

> Recommended citation: Global Volcanism Program, Smithsonian Institution. *Volcanoes of the World (VOTW) Database*. <https://volcano.si.edu/>

__[VolcanoDiscovery](https://www.volcanodiscovery.com/)__ — aggregated global volcanic activity reports, via their RSS feed. Used with permission (Dr. Tom Pfeiffer, VolcanoDiscovery, 2026-07-23); each item displayed here links back to its source page on volcanodiscovery.com.

## Earthquakes

__[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/)__ — real-time and recent earthquake data via the [USGS earthquake summary feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary). A work of the U.S. Government; USGS earthquake data is in the public domain.

## US Volcano Alerts

__[USGS Hazard Alert Notification System (HANS)](https://volcanoes.usgs.gov/hans-public/api/)__ — current alert levels and color codes for USGS-monitored volcanoes. Also the source for __VONA__ (Volcano Observatory Notification for Aviation) records, via HANS's `getVonasWithinLastYear` endpoint.

## Aviation Volcanic Ash Advisories

__[Aviation Weather Center, NOAA/NWS](https://aviationweather.gov/)__ — Volcanic Ash SIGMETs (VA-SIGMETs), via the [Aviation Weather API](https://aviationweather.gov/data/api/).

## Tsunamis

__[National Weather Service, NOAA](https://www.weather.gov/)__ — active tsunami warnings, watches, and advisories, via the [NWS Alerts API](https://api.weather.gov/). A work of the U.S. Government; NWS alert data is in the public domain.

__[NOAA National Centers for Environmental Information (NCEI) / World Data Service (WDS) — Global Historical Tsunami Database](https://www.ncei.noaa.gov/products/natural-hazards)__ — historical tsunami event records referenced on the [Tsunamis](/view/tsunamis) page.

## Landslides

__[NASA Cooperative Open Online Landslide Repository (COOLR)](https://gpm.nasa.gov/landslides/) / Global Landslide Catalog__ — global landslide event records, via NASA's [maps.nccs.nasa.gov ArcGIS FeatureServer](https://maps.nccs.nasa.gov/). A work of the U.S. Government; NASA data is generally not subject to copyright in the United States.

__[USGS Landslide Hazards Program](https://www.usgs.gov/programs/landslide-hazards)__ — hazard mapping and technical reports referenced on the [Landslides](/view/landslides) page.

__NASA Global Precipitation Measurement (GPM) / LHASA nowcast__ — rainfall-triggered landslide nowcasting, referenced on the [Landslides](/view/landslides) page.

## Wildfire & Fire Danger

__[NASA Fire Information for Resource Management System (FIRMS)](https://firms.modaps.eosdis.nasa.gov/)__ — global near-real-time thermal anomaly detections from the VIIRS Suomi-NPP product, shown on the [Wildfires](/view/wildfires) page. A work of the U.S. Government; NASA data is generally not subject to copyright in the United States.

__[Fire Environment Mapping System (FEMS), USDA Forest Service](https://fems.fs2c.usda.gov/)__ — National Fire Danger Rating System (NFDRS) indices and fuel moisture, calculated from the interagency [RAWS](https://raws.nifc.gov/) weather station network and shown on the [Fire Danger](/view/nfdrs) page. A work of the U.S. Government; NFDRS outputs are in the public domain.

## Platform

geohazardwatch is built as a domain add-on for __[ngdpbase](https://github.com/jwilleke/ngdpbase)__, an open-source content platform.

## Corrections

If a source is missing, miscredited, or a citation needs updating, please [contact us](/Contact) or open an issue at [github.com/jwilleke/geohazardwatch](https://github.com/jwilleke/geohazardwatch/issues).
