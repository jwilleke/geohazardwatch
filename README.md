# geohazardwatch

Volcano and geology data platform built as an [ngdpbase](https://github.com/jwilleke/ngdpbase) add-on.
Powered by [Global Volcanism Program (GVP)](https://volcano.si.edu/) volcano data,
[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) feeds, and
[USGS HANS](https://volcanoes.usgs.gov/hans-public/api/) real-time volcano alerts.

## What it does

- Imports 2,600+ GVP volcano and eruption records into a local JSON snapshot
- Imports USGS earthquake data matched to the nearest volcano within 50 km
- Imports real-time US volcano alert levels from USGS HANS
- Registers seven wiki markup plugins (infoboxes, tables, search widgets, Leaflet maps, alert tables)
- Seeds demo wiki pages into your ngdpbase instance automatically on first load
- Exposes a REST API at `/api/geohazardwatch/*`

## Quick start

```sh
git clone https://github.com/jwilleke/geohazardwatch.git
cd geohazardwatch
npm install
npm run import:all && npm run import:earthquakes && npm run import:hans
```

Then wire to ngdpbase and restart — see [SETUP.md](./SETUP.md) for full instructions.

## Documentation

| Doc | Owns |
|-----|------|
| [SETUP.md](./SETUP.md) | Full install, config, verification, troubleshooting |
| [addons/geohazardwatch/README.md](./addons/geohazardwatch/README.md) | Plugin syntax, API endpoints, import options |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Repo structure, data pipeline, tech stack, adding new sources |
| [AGENTS.md](./AGENTS.md) | Agent guidance, commands, key decisions, open issues |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Linting, formatting, commit conventions |

## Related

- [ngdpbase platform guide](https://github.com/jwilleke/ngdpbase/blob/master/docs/platform/ngdp-as-platform.md)
- [ngdpbase add-on development guide](https://github.com/jwilleke/ngdpbase/blob/master/docs/platform/addon-development-guide.md)
