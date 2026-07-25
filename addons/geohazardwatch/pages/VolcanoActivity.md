---
title: Volcano Activity
uuid: 42fd6ec1-e8a6-4f0c-a21e-bb1a87483700
slug: volcano-activity
system-category: addon
description: Original volcanic activity news and eruption reports from VolcanoDiscovery — for VAAC ash advisories, see Alerts
tags: [geology, volcanoes, volcanodiscovery]
author: system
---
## Volcano Activity

Original volcanic activity news from around the world — eruption narratives and the daily "Volcanoes Today" digest — reported by [VolcanoDiscovery|https://www.volcanodiscovery.com/|target="_blank"]. For individual volcano records and eruption history, see [Volcanoes]; for Volcanic Ash Advisory (VAAC) bulletins, see [Alerts]; for USGS alert levels, see [Volcano Alerts|US Volcano Alerts (USGS HANS)].

## Recent Reports

Live activity reports, ingested via the platform [`feeds` addon|https://github.com/jwilleke/ngdpbase/issues/685|target="_blank"] and rendered from the record store at view time (no page churn). Each headline links back to the full report on volcanodiscovery.com — source: __VolcanoDiscovery__.

Volcanic Ash Advisory (VAAC) bulletins are excluded from this list — VolcanoDiscovery re-publishes the same NOAA OSPO Washington VAAC bulletins this addon already fetches directly (see `docs/volcano-sources.md`), so the structured, GVP-matched original is shown on [Alerts] instead of a re-published copy here. This page keeps VolcanoDiscovery's original content: eruption narratives and the "Volcanoes Today" digest.

[{DataFeed source='volcanodiscovery-activity' columns='title,pubDate' exclude='summary~VAAC:|VA ADVISORY|DTG:' sort='pubDate-desc' max='15' link='title=:link'}]

If nothing renders above, no recent reports are available — or the `volcanodiscovery-activity` feed source is not yet configured (see Configuration).

## Data Sources

%%table-fit
%%table-bordered
%%table-striped
%%table-hover
|| Source || Provider || Coverage
| Volcano activity news | [VolcanoDiscovery|https://www.volcanodiscovery.com/|target="_blank"] | Global — original eruption narratives and daily digest only; VAAC bulletins excluded (see [Alerts])
/%
/%
/%
/%

## Configuration

The live feed is served by the ngdpbase `feeds` addon (#685). Enable it and declare the source in the instance `app-custom-config.json`, then restart. The production config uses flat dot-notation keys (not nested JSON):

```json
{
  "ngdpbase.addons.feeds.enabled": true,
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.adapter": "xml",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.url": "https://www.volcanodiscovery.com/volcanonews.rss",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.itemsPath": "rss.channel.item",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.type": "VolcanoActivityReport",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.schemaType": "Article",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.intervalMinutes": 30,
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.recordIdField": "link",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.map.title": "title",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.map.link": "link",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.map.pubDate": "pubDate",
  "ngdpbase.addons.feeds.sources.volcanodiscovery-activity.map.summary": "description"
}
```

`type` is the domain label (`VolcanoActivityReport`); `schemaType` stays `Article` per the same constraint noted on [Tsunamis]. `recordIdField` is `link`, not `guid` — VolcanoDiscovery's `<guid isPermaLink="true">` element carries an attribute, so the XML parser returns it as `{@isPermaLink, #text}` rather than a plain string, and the adapter silently drops any record whose id doesn't resolve to a string/number. `<link>` has no attributes and is guaranteed unique per article, so it's used as the id instead.

## Licensing

Used with permission from VolcanoDiscovery (Dr. Tom Pfeiffer, 2026-07-23), conditional on every displayed item linking directly back to its source page on volcanodiscovery.com and the source being clearly marked — see the `link='title=:link'` binding above and [Attribution]. See [issue #7|https://github.com/jwilleke/geohazardwatch/issues/7|target="_blank"] for the full licensing correspondence.

----

__Status:__ page and feed wiring live in production — `volcanodiscovery-activity` is registered in `app-custom-config.json` and ingesting (20 items on first fetch). VAAC-shaped items are filtered out via `exclude='summary~VAAC:|VA ADVISORY|DTG:'` per [geohazardwatch#159|https://github.com/jwilleke/geohazardwatch/issues/159|target="_blank"]; the structured original is on [Alerts] instead.
