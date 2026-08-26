---
title: Fire Danger
uuid: 3f7c1a58-9d24-4b6e-b0a3-6e2f5c81d47a
slug: nfdrs
system-category: general
description: National Fire Danger Rating System indices from FEMS — ERC, Burning Index, Spread Component, and fuel moisture by RAWS station
tags: [wildfires, fire, nfdrs, fire-danger, fems, raws, usfs]
author: system
---
## Fire Danger (NFDRS)

The National Fire Danger Rating System (NFDRS) rates how readily wildland fuels will ignite, spread, and resist control at a given place and time. Unlike the satellite detections on the [Wildfires] page — which show fires that are *already burning* — NFDRS describes the *conditions*: how dry the fuels are, and how a fire would behave if one started.

Ratings are calculated by the [Fire Environment Mapping System (FEMS)](https://fems.fs2c.usda.gov/), the interagency system that ingests weather from the RAWS network and performs the NFDRS calculations. Coverage is the United States only.

## Current Indices

Recent observations and the 7-day forecast for the stations configured on this instance. Ingested via the platform [`feeds` addon](https://github.com/jwilleke/ngdpbase/issues/685) and rendered from the record store at view time (no page churn).

[{DataFeed source='fems-nfdr' format='table' columns='station,date,type,erc,bi,sc,ic,fm1hr,fm10hr,fm100hr' sort='date-asc' max='60' badge='type' empty='No NFDRS records are currently in the store for the configured stations.'}]

If nothing renders above, the `fems-nfdr` feed source is not yet configured (see Configuration).

## Reading the table

- __type__ distinguishes an `O` (observation — what was measured) row from an `F` (forecast — what is predicted). The table runs oldest-first, so observations come first and the forecast follows.
- __ERC__ (Energy Release Component) tracks the total heat available per unit area at the flaming front. It responds to the *heavy, slow-drying* fuels, so it moves slowly and is the best single number for seasonal dryness.
- __BI__ (Burning Index) combines ERC with the Spread Component and scales roughly to expected flame length. It is the index most often used for staffing and preparedness decisions.
- __SC__ (Spread Component) estimates the forward rate of spread, and is strongly wind-driven — so it can spike on a single windy day while ERC barely moves.
- __IC__ (Ignition Component) is the probability, 0–100, that a firebrand landing in the fuel will start a fire that needs suppression.
- __fm1hr / fm10hr / fm100hr__ are dead fuel moisture percentages for progressively larger fuel classes — roughly grass and litter, twigs, and branch-sized material. Lower means drier.

Every value is for a __single station__ and its fuel model. NFDRS is a point calculation, not a map: a station describes its own site, and conditions a valley away can differ sharply.

## What this page does not show

__There is no adjective rating here__ (the familiar Low / Moderate / High / Very High / Extreme signs). That class is not published by the API — it is derived by comparing a station's current index against percentiles of that station's own multi-year climatology, and the thresholds are set locally by each unit. Showing a computed rating without those local thresholds would misstate an operational number, so the raw indices are shown instead.

For an official adjective rating, use the issuing unit's own posting or the [NWS fire weather forecast](https://www.weather.gov/fire/) for the area.

## Data Source

| Source | Provider | Coverage |
|--------|----------|---------|
| NFDRS indices & fuel moisture | FEMS (USFS / interagency), RAWS network | United States, 5 days back + 7-day forecast |

## Configuration

The live feed is served by the ngdpbase `feeds` addon (#685). Enable it and declare the source in the instance `app-custom-config.json`, then restart:

```json
{
  "ngdpbase.addons.feeds.enabled": true,
  "ngdpbase.addons.feeds.sources": {
    "fems-nfdr": {
      "adapter": "csv",
      "url": "https://fems.fs2c.usda.gov/api/ext-climatology/download-nfdr-daily-summary/?dataset=all&presetDate=-5Days7Days&dataFormat=csv&stationIds=101222,101708,102712,101710&fuelModels=Y",
      "type": "Observation",
      "intervalMinutes": 360,
      "map": {
        "station": "StationName",
        "stationId": "StationId",
        "date": "ObservationTime",
        "type": "NFDRType",
        "fuelModel": "FuelModel",
        "erc": "ERC",
        "bi": "BI",
        "sc": "SC",
        "ic": "IC",
        "kbdi": "KBDI",
        "gsi": "GSI",
        "fm1hr": "1HrFM",
        "fm10hr": "10HrFM",
        "fm100hr": "100HrFM",
        "fm1000hr": "1000HrFM",
        "herbFm": "HerbFM",
        "woodyFm": "WoodyFM"
      }
    }
  }
}
```

__No API key is required__ for this endpoint, and none should be added — the `download-nfdr-daily-summary` path is open. FEMS does publish a richer GraphQL API covering station metadata and coordinates, but it is key-gated behind a FAMAuth account and is POST-only, which the feeds addon's GET-only `rest-json` adapter cannot call (see `docs/wildfire-sources.md`).

### Choosing stations

`stationIds` is a comma-separated list of FEMS station numbers, and the four above are examples — replace them with stations relevant to your instance. There is __no public station-catalog endpoint__, so station numbers have to be looked up by hand from the station map and search on [fems.fs2c.usda.gov](https://fems.fs2c.usda.gov/), which lists roughly 2,200 RAWS across the US, Alaska, Hawaii, Guam, and Puerto Rico.

FEMS limits how many stations one request may span: unlimited under a 2-week window, 10 stations for 2 weeks to a year, and 1 station beyond a year. `presetDate=-5Days7Days` is a 12-day window, so it sits in the unlimited tier — but each station adds 12 rows per poll, so keep the list to a curated handful rather than a region.

`fuelModels=Y` selects the NFDRS 2016 fuel model used most widely for general reporting. Other models can be requested, comma-separated, but every model returns its own row per station per day.

----

__Status:__ page and feed wiring live. For the full station map, historical data, and analysis tools, visit [FEMS](https://fems.fs2c.usda.gov/).

## Related Pages

- [Wildfires] — satellite thermal hotspot detections for fires already burning
- [Alerts] — cross-hazard summary of what's currently active
- [Attribution] — credit and citation for every data source
