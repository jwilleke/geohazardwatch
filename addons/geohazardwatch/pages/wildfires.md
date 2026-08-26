---
title: Wildfires
uuid: 8d673582-02e8-47fe-80fb-1e27ea98d34a
slug: wildfires
system-category: general
description: Global wildfire thermal hotspots from NASA FIRMS/VIIRS
tags: [geology, wildfires, fire, nasa, firms]
author: system
---
## Wildfires

Global near-real-time thermal anomaly detections from NASA's Fire Information for Resource Management System (FIRMS), using the VIIRS Suomi-NPP satellite product. Each point is a single satellite detection, not a confirmed fire boundary — heat sources other than wildfire (agricultural burning, industrial flares, volcanic activity) can also trigger a detection.

## Global Hotspot Map

High-confidence detections only, sized by fire radiative power (FRP) — larger markers mean a more intense signal. Ingested via the platform [`feeds` addon](https://github.com/jwilleke/ngdpbase/issues/685) and rendered from the record store at view time (no page churn).

[{DataFeed source='firms-viirs' format='map' exclude='confidence~^[ln]$' sizeBy='frp' sort='frp-desc' max='500'}]

If nothing renders above, the `firms-viirs` feed source is not yet configured (see Configuration).

## Reading the map

- __Marker size__ scales with FRP (fire radiative power, in megawatts) among the detections shown — bigger markers are more intense, not necessarily larger fires.
- __High-confidence only.__ Low and nominal-confidence detections are filtered out here to keep the map readable — VIIRS confidence reflects the satellite's certainty about the detection itself, not the fire's severity.
- __Click a marker__ for the raw detection: coordinates, FRP, confidence, and acquisition time (UTC).
- This is a snapshot of the current ~24-hour NRT window, refreshed hourly — it is not a historical fire-tracking map.

## Data Source

| Source | Provider | Coverage |
|--------|----------|---------|
| Thermal hotspots | NASA FIRMS — VIIRS Suomi-NPP (NRT) | Global, rolling 24-hour window |

## Configuration

The live feed is served by the ngdpbase `feeds` addon (#685). Enable it and declare the source in the instance `app-custom-config.json`, then restart:

```json
{
  "ngdpbase.addons.feeds.enabled": true,
  "ngdpbase.addons.feeds.sources": {
    "firms-viirs": {
      "adapter": "csv",
      "url": "https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/VIIRS_SNPP_NRT/world/1",
      "type": "Event",
      "intervalMinutes": 60,
      "map": {
        "latitude": "latitude",
        "longitude": "longitude",
        "frp": "frp",
        "confidence": "confidence",
        "acq_date": "acq_date",
        "acq_time": "acq_time"
      }
    }
  }
}
```

Requires a free [NASA FIRMS API key](https://firms.modaps.eosdis.nasa.gov/api/) — never commit the key itself to a repository; it belongs only in the instance's own `app-custom-config.json` on the data volume.

----

__Status:__ page and feed wiring live. For live data outside this instance visit [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/).

## Related Pages

- [Fire Danger|nfdrs] — NFDRS indices and fuel moisture, for conditions rather than active fires
- [Volcanoes] — search, filter, and map every GVP-catalogued volcano
- [Earthquakes] — recent seismic activity
- [Alerts] — cross-hazard summary of what's currently active
