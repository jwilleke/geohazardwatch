# Setup Guide

Step-by-step instructions to set up geohazardwatch locally for development.

**First:** Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) and [AGENTS.md](AGENTS.md).

## Prerequisites

- **Node.js** v18+ (`node --version`)
- **npm** v9+ (`npm --version`)
- A running [ngdpbase](https://github.com/jwilleke/ngdpbase) instance (see ngdpbase README)
- Internet access for initial data import

## Step 1 — Clone and install

```bash
git clone https://github.com/jwilleke/geohazardwatch.git
cd geohazardwatch
npm install
```

## Step 2 — Import data

Volcano data must be imported before starting ngdpbase:

```bash
npm run import:all          # Volcanoes + eruptions + global activity
npm run import:earthquakes  # USGS M4.5+ earthquakes (past 7 days)
npm run import:hans         # USGS HANS US volcano alert levels
```

Data is written to `addons/geohazardwatch/data/` (gitignored). Re-run any time to refresh. For all import options (custom feeds, data directories) see [addons/geohazardwatch/README.md](./addons/geohazardwatch/README.md#import-scripts).

## Step 3 — Wire to ngdpbase

This is the **drop-in** path — the right choice for local development (edit-in-place, no publish step). Add to `$FAST_STORAGE/config/app-custom-config.json` on your ngdpbase instance:

```json
{
  "ngdpbase.managers.addons-manager.addons-path": "/absolute/path/to/geohazardwatch/addons",
  "ngdpbase.addons.geohazardwatch.enabled": true,
  "ngdpbase.addons.geohazardwatch.dataPath": "./data/geohazardwatch"
}
```

> Production instead installs the addon as a versioned npm package (`@jwilleke/geohazardwatch-addon`) into a generic ngdpbase image — see `Dockerfile` and [#152](https://github.com/jwilleke/geohazardwatch/issues/152). That config uses `"node_modules:@jwilleke/*-addon"` in `addons-path` instead of a directory path. Local dev keeps using drop-in as shown above.

## Step 4 — Restart ngdpbase

```bash
cd /path/to/ngdpbase
npm run build        # Required if any ngdpbase .ts files were changed
./server.sh restart
```

On startup the addon seeds four demo pages into the ngdpbase instance (`/view/volcanoes`, `/view/earthquakes`, `/view/geology-demo`, `/view/volcano-alerts`).

## Step 5 — Verify

```bash
curl http://localhost:3333/api/geohazardwatch/search?limit=1
# Should return { volcanoes: [...], total: 1400+ }

curl http://localhost:3333/api/geohazardwatch/hans/status
# Should return { elevatedCount, monitoredCount, fetchedUtc }
```

Check `pm2 logs ngdpbase-ngdpbase` for addon load confirmation.

## Development workflow

```bash
npm run lint        # Check code and markdown before committing
npm run lint:fix    # Auto-fix lint issues
```

The Husky pre-commit hook runs `npm run lint` automatically. Commits are rejected if lint fails.

## Troubleshooting

**Addon not loading:** Check `pm2 logs` — common causes are missing `node_modules` in the geohazardwatch directory or incorrect `addons-path` config.

**Empty API responses `{ volcanoes: [], total: 0 }`:** Data files are missing — run `npm run import:all`.

**HANS data not showing:** `activity.json` is absent — run `npm run import:hans`. The addon starts cleanly without it; HANS is optional.

**Earthquake proximity not working:** `volcanoes.json` must exist before running `import:earthquakes` — the proximity match requires volcano coordinates.
