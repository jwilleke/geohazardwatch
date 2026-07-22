---
title: Landslides
uuid: e32456ef-4cfa-40ed-a20a-382aa81438b7
slug: landslides
system-category: addon
description: Landslide events, warnings, and historical catalog for geohazardwatch
tags: [geology, landslides, mass-wasting, nasa, usgs]
author: system
---
## Landslides

A landslide is the downslope movement of rock, soil, or debris under gravity. Triggers include intense or prolonged rainfall, earthquakes, volcanic activity, rapid snowmelt, and slope disturbance by human activity. Landslides are among the most widespread geologic hazards, and often cascade from other events — a strong earthquake or a volcanic eruption can unleash thousands of slope failures.

## Recent Events

Recent reports from NASA's Cooperative Open Online Landslide Repository (COOLR), ingested via the platform [`feeds` addon](https://github.com/jwilleke/ngdpbase/issues/685) and rendered from the record store at view time (no page churn).

[{DataFeed source='landslide-events' columns='title,date,trigger,category,fatalities,country' sort='date-desc' max='25' link='title=:url'}]

If nothing renders above, the `landslide-events` feed source is not yet configured (see Configuration).

## Types

| Type | Description |
|------|-------------|
| Fall | Free-fall of rock or debris from a steep slope or cliff. |
| Slide | Movement of material along a distinct failure surface (rotational or translational). |
| Flow | Fast, fluid-like movement of saturated debris or mud (debris flow, mudflow, lahar). |
| Spread | Lateral extension over a weak or liquefied layer, often earthquake-triggered. |

## Data Sources

| Source | Provider | Coverage |
|--------|----------|---------|
| Global catalog | NASA COOLR / Global Landslide Catalog | Global, 2007–present |
| Hazard mapping & reports | USGS Landslide Hazards Program | United States |
| Rainfall triggers | NASA GPM / LHASA nowcast | Global |

## Configuration

The live feed is served by the ngdpbase `feeds` addon (#685). Enable it and declare the source in the instance `app-custom-config.json`, then restart:

```json
{
  "ngdpbase.addons.feeds.enabled": true,
  "ngdpbase.addons.feeds.sources": {
    "landslide-events": {
      "adapter": "geojson",
      "url": "https://maps.nccs.nasa.gov/mapping/rest/services/COOLR/COOLR_Events_Point/FeatureServer/0/query?where=1%3D1&outFields=*&orderByFields=event_date%20DESC&resultRecordCount=50&f=geojson",
      "type": "Event",
      "schemaType": "Article",
      "dailyAt": "06:00",
      "recordIdField": "properties.event_id",
      "map": {
        "title": "properties.event_title",
        "date": "properties.event_date",
        "category": "properties.landslide_category",
        "trigger": "properties.landslide_trigger",
        "fatalities": "properties.fatality_count",
        "country": "properties.country_name",
        "location": "properties.location_description",
        "url": "properties.source_link"
      }
    }
  }
}
```

The COOLR layer field names (`event_title`, `event_date`, `landslide_category`, …) should be verified against the live FeatureServer schema — ArcGIS field casing can differ per service revision. `type` is the domain label; `schemaType` stays `Article` until the framework implements the `Event` schema.org union type ([ngdpbase#762](https://github.com/jwilleke/ngdpbase/issues/762)).

----

__Status:__ page and feed wiring live. For live data outside this instance visit [USGS Landslide Hazards](https://www.usgs.gov/programs/landslide-hazards) and [NASA Landslides](https://gpm.nasa.gov/landslides/).
