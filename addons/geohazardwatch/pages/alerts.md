---
title: Alerts
uuid: db1a542e-71e2-489a-80ff-4b5b022a2bf6
slug: alerts
system-category: general
description: Everything currently active and dangerous across volcanoes, tsunamis, and volcanic ash — one page, all hazard types
tags: [geology, alerts, volcanoes, tsunamis, hans, vaac]
author: system
---
## Alerts

What's actively dangerous right now, across every hazard type this site covers. Each section below pulls live data — see [Related Pages](#related-pages) for the full browsing experience per hazard type.

## Volcano Alert Levels (USGS HANS)

Currently elevated US volcanoes, from the [USGS Hazard Alert Notification System](https://volcanoes.usgs.gov/hans-public/api/).

[{HansAlerts}]

See [US Volcano Alerts (USGS HANS)] for the full alert-level reference and per-observatory breakdown.

## Tsunami Warnings & Advisories

Live U.S. tsunami messages from the NOAA/NWS Tsunami Warning Centers.

[{DataFeed source='tsunami-alerts' columns='event,severity,area,effective' badge='severity' sort='effective-desc' max='15' link='event=:url'}]

If nothing renders above, no tsunami messages are currently active.

## Volcanic Ash Advisories (VAAC)

Active Volcanic Ash Advisories from the Washington VAAC, structured directly from NOAA OSPO — not VolcanoDiscovery's re-published copy, which is filtered out of [Volcano Activity] in favor of this section (geohazardwatch#159).

[{VaacAdvisories}]

__Coverage note:__ Washington VAAC only (Americas, E. Pacific, Caribbean) — one of nine ICAO-mandated regional VAACs. The other eight are not yet integrated ([geohazardwatch#5](https://github.com/jwilleke/geohazardwatch/issues/5)).

## Wildfire Alerts

Highest-intensity high-confidence FIRMS/VIIRS detections globally, most intense first. Each entry is a single satellite detection, not a confirmed named fire — see [geohazardwatch#161](https://github.com/jwilleke/geohazardwatch/issues/161) for why this stays a threshold-only list rather than clustered events (real clustering work, not started) and [geohazardwatch#169](https://github.com/jwilleke/geohazardwatch/issues/169) for the pending reverse-geocoded place-name upgrade.

[{DataFeed source='firms-viirs' columns='latitude,longitude,frp,acq_date,acq_time' exclude='confidence~^[ln]$' sort='frp-desc' max='20'}]

If nothing renders above, the `firms-viirs` feed source is not yet configured — see [Wildfires] for configuration details. The full interactive map, with every high-confidence detection plotted, is also on [Wildfires].

----

## Related Pages

- [Volcanoes] — search, filter, and map every GVP-catalogued volcano
- [Earthquakes] — recent seismic activity
- [Tsunamis] — tsunami hazard background and historical sources
- [Wildfires] — global thermal hotspot map
- [US Volcano Alerts (USGS HANS)] — full alert-level reference

__Status:__ HANS, Tsunami, VAAC, and Wildfire sections all live. Wildfire entries are threshold-only detections, not clustered named events — see [geohazardwatch#161](https://github.com/jwilleke/geohazardwatch/issues/161).
