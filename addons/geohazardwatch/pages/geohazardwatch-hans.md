---
title: US Volcano Alerts (USGS HANS)
uuid: ea663c20-6809-4443-91ba-6cefbf48b2e1
slug: volcano-alerts
description: Real-time US volcano alert levels from the USGS Hazard Alert Notification System
tags: [geology, volcanoes, alerts, usgs]
---

## US Volcano Alerts

Real-time alert levels for monitored US volcanoes, sourced from the
[USGS Hazard Alert Notification System (HANS)](https://volcanoes.usgs.gov/hans-public/api/).

## Currently Elevated Volcanoes

[{HansAlerts}]

## Alert Levels

| Level | Aviation Code | Meaning |
|-------|--------------|---------|
| NORMAL | GREEN | Volcano is in typical background state |
| ADVISORY | YELLOW | Elevated unrest above known background levels |
| WATCH | ORANGE | Heightened unrest with increased eruption potential |
| WARNING | RED | Highly hazardous eruption imminent or underway |

## By Observatory

### Alaska Volcano Observatory (AVO)

[{HansAlerts observatory='avo'}]

### Hawaiian Volcano Observatory (HVO)

[{HansAlerts observatory='hvo'}]

### Cascades Volcano Observatory (CVO)

[{HansAlerts observatory='cvo'}]

## Data Source

HANS data is imported via `npm run import:hans` and reflects a point-in-time snapshot.
For live data visit [volcanoes.usgs.gov](https://volcanoes.usgs.gov/).
