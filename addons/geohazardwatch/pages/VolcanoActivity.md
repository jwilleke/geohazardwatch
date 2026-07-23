---
title: Volcano Activity
uuid: 42fd6ec1-e8a6-4f0c-a21e-bb1a87483700
slug: volcano-activity
system-category: addon
description: Recent global volcanic activity reports, aggregated from all nine VAACs and national observatories
tags: [geology, volcanoes, volcanodiscovery]
author: system
---
## Volcano Activity

Recent volcanic activity reports from around the world, aggregated by [VolcanoDiscovery](https://www.volcanodiscovery.com/) from all nine Volcanic Ash Advisory Centers (VAACs) and national observatories. For individual volcano records and eruption history, see [Volcanoes]; for aviation ash advisories, see [Volcano Alerts|US Volcano Alerts (USGS HANS)].

## Recent Reports

Live activity reports, ingested via the platform [`feeds` addon](https://github.com/jwilleke/ngdpbase/issues/685) and rendered from the record store at view time (no page churn). Each headline links back to the full report on volcanodiscovery.com — source: __VolcanoDiscovery__.

[{DataFeed source='volcanodiscovery-activity' columns='title,pubDate' sort='pubDate-desc' max='15' link='title=:link'}]

If nothing renders above, no recent reports are available — or the `volcanodiscovery-activity` feed source is not yet configured (see Configuration).

## Data Sources

| Source | Provider | Coverage |
|--------|----------|---------|
| Volcano activity news | [VolcanoDiscovery](https://www.volcanodiscovery.com/) | Global, aggregated from all 9 VAACs and national observatories |

## Configuration

The live feed is served by the ngdpbase `feeds` addon (#685). Enable it and declare the source in the instance `app-custom-config.json`, then restart:

```json
{
  "ngdpbase.addons.feeds.enabled": true,
  "ngdpbase.addons.feeds.sources": {
    "volcanodiscovery-activity": {
      "adapter": "xml",
      "url": "https://www.volcanodiscovery.com/volcanonews.rss",
      "itemsPath": "rss.channel.item",
      "type": "VolcanoActivityReport",
      "schemaType": "Article",
      "intervalMinutes": 30,
      "recordIdField": "guid",
      "map": {
        "title": "title",
        "link": "link",
        "pubDate": "pubDate",
        "summary": "description"
      }
    }
  }
}
```

`type` is the domain label (`VolcanoActivityReport`); `schemaType` stays `Article` per the same constraint noted on [Tsunamis].

## Licensing

Used with permission from VolcanoDiscovery (Dr. Tom Pfeiffer, 2026-07-23), conditional on every displayed item linking directly back to its source page on volcanodiscovery.com and the source being clearly marked — see the `link='title=:link'` binding above and [Attribution]. See [issue #7](https://github.com/jwilleke/geohazardwatch/issues/7) for the full licensing correspondence.

----

__Status:__ page and feed wiring live; requires the `volcanodiscovery-activity` source to be added to the instance `app-custom-config.json` (not yet deployed to production — tracked in #7).
