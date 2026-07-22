# geohazardwatch

Volcano and geology data platform built as an [ngdpbase](https://github.com/jwilleke/ngdpbase) add-on. Powered by [Global Volcanism Program (GVP)](https://volcano.si.edu/) volcano data, [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) feeds, and [USGS HANS](https://volcanoes.usgs.gov/hans-public/api/) real-time volcano alerts.

## What it does

- Imports 2,600+ GVP volcano and eruption records into a local JSON snapshot
- Imports USGS earthquake data matched to the nearest volcano within 50 km
- Imports real-time US volcano alert levels from USGS HANS, refreshed on a background timer
- Imports active volcanic ash advisories from the Washington VAAC, refreshed on a background timer
- Surfaces NASA FIRMS thermal anomalies near known volcanoes via ngdpbase's `feeds` addon (no import script of its own)
- Registers nine markup plugins (infoboxes, tables, search widgets, Leaflet maps, alert tables)
- Seeds demo pages into your ngdpbase instance automatically on first load, including Tsunami and Landslide pages that render live NOAA/NASA feeds when ngdpbase's `feeds` addon is configured
- Exposes a REST API at `/api/geohazardwatch/*` and an admin panel for manual data refreshes

## Quick try (30 seconds)

Want to see what GeoHazardWatch looks like running locally? One command:

```sh
docker run --rm -p 3000:3000 ghcr.io/jwilleke/geohazardwatch:latest
```

Open `http://localhost:3000` — you'll see the site running with the volcano and earthquake addons active. Ctrl-C to stop. No data persists; for a real instance see *Deploy your own* below.

## Deploy your own

For a real GeoHazardWatch instance with persistent data, two commands:

```sh
git clone https://github.com/jwilleke/geohazardwatch.git
cd geohazardwatch
docker compose up -d
```

The bundled `docker-compose.yml` pulls the published image, mounts a named volume for persistent storage, and exposes the site on `http://localhost:3000`. Override the host port with `HOST_PORT=8080 docker compose up -d`. For HTTPS, put a reverse proxy in front (Caddy, nginx, Cloudflare Tunnel) or pin to a specific image tag.

Need to run without Docker? See [SETUP.md](./SETUP.md) for the direct install path (clone ngdpbase + this addon side-by-side, no containers).

## Develop the addon

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
