---
title: Geology Demo
uuid: 37a05b59-a793-4204-b389-f5e89fb80537
slug: geology-demo
author: system
user-keywords:
  - demo
  - plugins
  - geology
lastModified: '2026-03-29T00:00:00.000Z'
editor: system
---
## geohazardwatch Plugin Demo

This page demonstrates all plugins provided by the __geohazardwatch__ addon.

----

## VolcanoInfobox

Full infobox for Kīlauea (GVP 332010):

[{VolcanoInfobox number='332010'}]

Full infobox for Mount Etna (GVP 211060):

[{VolcanoInfobox number='211060'}]

----

## VolcanoList

Active stratovolcanoes in Japan (up to 10):

[{VolcanoList country='Japan' volcanoType='Stratovolcano' limit='10'}]

Holocene volcanoes in Iceland:

[{VolcanoList country='Iceland' epoch='Holocene' limit='10'}]

----

## VolcanoMap

Volcanoes of Japan:

[{VolcanoMap country='Japan' lat='36' lon='138' zoom='5' height='400'}]

----

## EarthquakeList

Significant earthquakes (M5.5+):

[{EarthquakeList minMagnitude='5.5' limit='15'}]

Earthquakes near volcanoes:

[{EarthquakeList nearVolcano='true' limit='15'}]

----

## EarthquakeMap

Recent earthquakes with volcano overlay:

[{EarthquakeMap showVolcanoes='true' minMagnitude='4.5' height='450'}]

----

## Plugin Reference

|| Plugin || Example ||
| VolcanoInfobox | [{VolcanoInfobox number='332010'}] |
| VolcanoList | [{VolcanoList country='Japan' limit='5'}] |
| VolcanoSearch | [{VolcanoSearch}] |
| VolcanoMap | [{VolcanoMap epoch='Holocene'}] |
| EarthquakeList | [{EarthquakeList nearVolcano='true'}] |
| EarthquakeMap | [{EarthquakeMap showVolcanoes='true'}] |
