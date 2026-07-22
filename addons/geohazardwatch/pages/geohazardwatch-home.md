---
title: Volcanoes and Earthquakes
uuid: 4bf246b9-ebcc-4774-8175-427c275d407c
slug: volcanoes-and-earthquakes
system-category: addon
description: Home page for the geohazardwatch volcano and earthquake data platform
tags: [geology, volcanoes, earthquakes, home]
author: system
---

## Volcanoes and Earthquakes

Earth is a restless planet. Beneath our feet, tectonic plates grind against one another,
magma surges toward the surface, and the ground shakes with energy released from hundreds
of kilometers below. This site brings together the best available open data to help you
explore that activity — from the ancient calderas of the Pleistocene to volcanoes erupting
right now.

## Volcanoes

The [Smithsonian Global Volcanism Program (GVP)](https://volcano.si.edu/) maintains the
world's most comprehensive catalog of volcanic activity — more than 2,600 volcanoes
documented across the Holocene and Pleistocene epochs, with eruption histories stretching
back thousands of years.

[{VolcanoMap height='400' epoch='Holocene'}]

[Explore volcanoes](/view/volcanoes) · [US volcano alerts](/view/volcano-alerts)

## Earthquakes

The [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) monitors seismic
activity globally. This site tracks significant earthquakes and identifies those occurring
within 50 km of a known volcano — a relationship that can signal volcanic unrest.

[{EarthquakeList nearVolcano='true' minMagnitude='4.5' limit='10'}]

[Explore earthquakes](/view/earthquakes)

## Currently Elevated US Volcanoes

[{HansAlerts}]

## About this site

This site is powered by **geohazardwatch**, an open-source add-on for the
[ngdpbase](https://github.com/jwilleke/ngdpbase) platform.

| Data source | Provider | Coverage |
|-------------|----------|---------|
| Volcano catalog | Smithsonian GVP | Global, Holocene + Pleistocene |
| Eruption history | Smithsonian GVP | Global, historical records |
| Earthquake data | USGS Earthquake Hazards | Global, near-real-time |
| Volcano alerts | USGS HANS | US volcanoes, 65 monitored |

Data is imported periodically from public APIs. For live data visit the source portals directly.
