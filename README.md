# geohazardwatch

Volcano and geology data platform built as an [ngdpbase](https://github.com/jwilleke/ngdpbase) add-on. Powered by [Global Volcanism Program (GVP)](https://volcano.si.edu/) volcano data, [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) feeds, and [USGS HANS](https://volcanoes.usgs.gov/hans-public/api/) real-time volcano alerts.

## What it does

- Imports 2,600+ GVP volcano and eruption records into a local JSON snapshot
- Imports USGS earthquake data matched to the nearest volcano within 50 km
- Imports real-time US volcano alert levels from USGS HANS
- Refreshes all three as ngdpbase scheduled jobs (HANS every 10 minutes, earthquakes every 20, GVP daily), with retries, failure notices and Run now in Admin → Scheduled Jobs
- Surfaces active volcanic ash advisories from the Washington VAAC and NASA FIRMS thermal anomalies near known volcanoes via ngdpbase's `feeds` addon (no import script of its own for either)
- Registers nine markup plugins (infoboxes, tables, search widgets, Leaflet maps, alert tables)
- Seeds demo pages into your ngdpbase instance automatically on first load, including Tsunami and Landslide pages that render live NOAA/NASA feeds when ngdpbase's `feeds` addon is configured
- Exposes a REST API at `/api/geohazardwatch/*` and an admin panel for manual data refreshes

## Run it on a site

This repository is the add-on only. It builds no image and holds no deployment files. A site runs the stock ngdpbase image (`ghcr.io/jwilleke/ngdpbase`), and core installs the add-on from npm, `@jwilleke/geohazardwatch-addon`, when the site's configuration names it. Add two keys to the site's `app-custom-config.json` (under `FAST_STORAGE/config` on the data volume) and restart:

```json
{
  "ngdpbase.addons.install": {
    "geohazardwatch": {
      "package": "@jwilleke/geohazardwatch-addon",
      "version": "1.2.289",
      "repository": "github.com/jwilleke/geohazardwatch"
    }
  },
  "ngdpbase.addons.geohazardwatch.enabled": true
}
```

Core checks the release's provenance against this repository before it installs it, and pins it in `<FAST_STORAGE>/addons/addons-lock.json`. To update, change `version` and restart. The details (what is checked, rollback, the admin-save trap) are in ngdpbase's [domain site deployment guide](https://github.com/jwilleke/ngdpbase/blob/master/docs/platform/deployment/domain-site.md) and the add-ons guide's [Installed add-ons](https://github.com/jwilleke/ngdpbase/blob/master/docs/guides/addons-developer-guide.md#installed-add-ons) section.

geohazardwatch.com runs this way. Its deployment (the stock image, Flux image automation for core, ingress, certificate) lives in [jwilleke/mj-infra-flux](https://github.com/jwilleke/mj-infra-flux), `apps/production/geohazardwatch/`. Its configuration lives on its data volume, never in YAML.

For local development against an ngdpbase checkout, see [SETUP.md](./SETUP.md) (drop-in, no install step).

## Release it

[`.github/workflows/publish.yml`](./.github/workflows/publish.yml) publishes the add-on to npm with provenance (npm trusted publishing, no stored token) when a `geohazardwatch-v<version>` tag is pushed, then makes a GitHub release holding the published tarball and its sha512.

- 1 Bump the version: `npm run version:bump -- patch` (updates `package.json`, `addons/geohazardwatch/package.json`, `addons/geohazardwatch/index.ts` and `CHANGELOG.md`). Merge it to `main` by PR.
- 2 Tag the merged commit and push the tag: `git tag geohazardwatch-v<version> && git push origin geohazardwatch-v<version>`. The tag's version must equal `addons/geohazardwatch/package.json`'s, or the workflow refuses it.
- 3 Sites pick it up only when their configured `version` is changed to it and they restart.

[`core-compat.yml`](./.github/workflows/core-compat.yml) builds and tests the add-on daily against `ngdpbase.minVersion` and the newest ngdpbase release, so a core release that breaks it shows here before a site restarts onto it.

## Develop the addon

```sh
git clone https://github.com/jwilleke/geohazardwatch.git
cd geohazardwatch
npm install
```

Then import data from a built ngdpbase checkout, wire to ngdpbase and restart — see [SETUP.md](./SETUP.md) for full instructions.

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
