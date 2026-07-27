---
title: US Volcano Alerts (USGS HANS)
uuid: ea663c20-6809-4443-91ba-6cefbf48b2e1
slug: us-volcano-alerts-usgs-hans
system-category: general
description: Real-time US volcano alert levels from the USGS Hazard Alert Notification System
tags: [geology, volcanoes, alerts, usgs]
---

## US Volcano Alerts

Real-time alert levels for monitored US volcanoes, sourced from the [USGS Hazard Alert Notification System (HANS)](https://volcanoes.usgs.gov/hans-public/api/).

## Currently Elevated Volcanoes

[{HansAlerts}]

## By Observatory

### Alaska Volcano Observatory (AVO)

[{HansAlerts observatory='avo'}]

### Hawaiian Volcano Observatory (HVO)

[{HansAlerts observatory='hvo'}]

### Cascades Volcano Observatory (CVO)

[{HansAlerts observatory='cvo'}]

## Alert Levels

%%table-fit
%%table-bordered
%%table-striped
%%table-hover
%%sortable
|| Level || Aviation Code || Meaning ||
| NORMAL | %%feed-badge %%feed-badge--green GREEN/% /% | Volcano is in typical background state |
| ADVISORY | %%feed-badge %%feed-badge--yellow YELLOW/% /% | Elevated unrest above known background levels |
| WATCH | %%feed-badge %%feed-badge--orange ORANGE/% /% | Heightened unrest with increased eruption potential |
| WARNING | %%feed-badge %%feed-badge--red RED/% /% | Highly hazardous eruption imminent or underway |
/%
/%
/%
/%
/%

## Data Source

HANS data is imported via `npm run import:hans` and reflects a point-in-time snapshot. For live data visit [volcanoes.usgs.gov](https://volcanoes.usgs.gov/).
