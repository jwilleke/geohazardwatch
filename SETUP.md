# Setup Guide

Step-by-step instructions to set up geohazardwatch locally for development.

__First:__ Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) and [AGENTS.md](AGENTS.md).

## Prerequisites

- __Node.js__ v18+ (`node --version`)
- __npm__ v9+ (`npm --version`)
- A running [ngdpbase](https://github.com/jwilleke/ngdpbase) instance (see ngdpbase README)
- Internet access for initial data import

## Step 1 — Clone and install

```bash
git clone https://github.com/jwilleke/geohazardwatch.git
cd geohazardwatch
npm install
```

## Step 2 — Import data

Once enabled, the addon refreshes its data itself, as ngdpbase scheduled jobs ([ngdpbase#2054](https://github.com/jwilleke/ngdpbase/issues/2054)): HANS every 10 minutes, earthquakes every 20, and the GVP volcano catalog daily at 08:00 New York time. On a new instance, fill everything at once with __Run now__ on each `geohazardwatch.import-*` job in Admin → Scheduled Jobs (`/admin/jobs`), volcanoes first (the earthquake import matches quakes to volcanoes). See [Data refresh jobs](./addons/geohazardwatch/README.md#data-refresh-jobs).

The import scripts remain as a manual alternative. They fetch through ngdpbase's `guardedFetch`, loaded from `dist/` in the current directory ([#349](https://github.com/jwilleke/geohazardwatch/issues/349)), so run them from a built ngdpbase checkout:

```bash
cd /path/to/ngdpbase && npm run build
GW=/path/to/geohazardwatch/addons/geohazardwatch/import
npx tsx $GW/import-volcanoes.ts --eruptions --activity  # Volcanoes + eruptions + global activity
npx tsx $GW/import-earthquakes.ts                       # USGS M4.5+ earthquakes (past 7 days)
npx tsx $GW/import-hans.ts                              # USGS HANS US volcano alert levels
```

Data is written to `addons/geohazardwatch/data/` (gitignored). Re-run any time to refresh. For all import options (custom feeds, data directories) see [addons/geohazardwatch/README.md](./addons/geohazardwatch/README.md#import-scripts).

## Step 3 — Wire to ngdpbase

This is the __drop-in__ path — the right choice for local development (edit-in-place, no publish step). Add to `$FAST_STORAGE/config/app-custom-config.json` on your ngdpbase instance:

```json
{
  "ngdpbase.managers.addons-manager.addons-path": "/absolute/path/to/geohazardwatch/addons",
  "ngdpbase.addons.geohazardwatch.enabled": true,
  "ngdpbase.addons.geohazardwatch.dataPath": "./data/geohazardwatch"
}
```

> A production site instead runs the stock ngdpbase image and has core install the published package (`@jwilleke/geohazardwatch-addon`) from npm, named in the site's `ngdpbase.addons.install` config. See the README's [Run it on a site](./README.md#run-it-on-a-site). Local dev keeps using drop-in as shown above.

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

__Addon not loading:__ Check `pm2 logs` — common causes are missing `node_modules` in the geohazardwatch directory or incorrect `addons-path` config.

__Empty API responses `{ volcanoes: [], total: 0 }`:__ Data files are missing — Run now `geohazardwatch.import-volcanoes` in Admin → Scheduled Jobs, and check its history there for a failed run.

__HANS data not showing:__ `activity.json` is absent — Run now `geohazardwatch.import-hans` in Admin → Scheduled Jobs. The addon starts cleanly without it; HANS is optional.

__Earthquake proximity not working:__ `volcanoes.json` must exist before the earthquake import runs — the proximity match requires volcano coordinates.
