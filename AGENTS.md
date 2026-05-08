---
project_state: "active"
last_updated: "2026-03-30"
agent_priority_level: "medium"
blockers: []
requires_human_review: ["major architectural changes", "security policy modifications", "deployment to production"]
agent_autonomy_level: "high"
---

# Project Context for AI Agents

This file is the single source of truth for project context and agent guidance.
Read this before starting any work. Update `last_updated` and relevant sections after significant changes.

## CRITICAL

Read [GLOBAL-CODE-PREFERENCES.md](./GLOBAL-CODE-PREFERENCES.md) first — overarching principles that govern all work.

## What This Project Is

**geohazardwatch** is an [ngdpbase](https://github.com/jwilleke/ngdpbase) add-on that provides volcano and geology data to a wiki platform. It is **not a standalone app** — it runs inside an ngdpbase instance as an external addon loaded via `AddonsManager`.

The addon:

- Imports GVP volcano/eruption data and USGS earthquake/HANS alert data into local JSON snapshots
- Registers data managers with the ngdpbase engine so plugins can access them
- Registers seven wiki markup plugins (`[{PluginName param='value'}]` syntax)
- Mounts REST API routes at `/api/geohazardwatch/*`
- Seeds demo wiki pages into the ngdpbase instance on first load

## Commands

### Data import

```bash
npm run import                   # Volcanoes only
npm run import:eruptions         # + eruption records
npm run import:all               # + eruptions + global activity
npm run import:earthquakes       # USGS M4.5+ past 7 days
npm run import:earthquakes:month # USGS M4.5+ past 30 days
npm run import:hans              # USGS HANS real-time US volcano alerts
```

Earthquake import requires `volcanoes.json` to exist first (proximity matching).
All data lands in `addons/geohazardwatch/data/` (gitignored).

### Lint

```bash
npm run lint          # ESLint (JS) + markdownlint (all .md)
npm run lint:fix      # Auto-fix both
npm run lint:code     # ESLint only  — targets addons/**/*.js
npm run lint:md       # Markdownlint only
```

Pre-commit hook runs `npm run lint` automatically via Husky.

### No build step, no test suite

The addon is plain CommonJS JavaScript — no TypeScript compile needed.
No test suite exists yet (see open issue jwilleke/geohazardwatch#1 area for future work).

### ngdpbase (sister repo at `/Volumes/hd2A/workspaces/github/ngdpbase`)

```bash
npm run build          # Compile TypeScript (required after any .ts change)
./server.sh restart    # Restart via PM2
./server.sh start      # First start
pm2 logs ngdpbase-ngdpbase --lines 50   # Tail logs
```

ngdpbase runs on port 3333. Admin panel at `/admin`, wiki at `/wiki/<slug>`.

## Architecture

### How the addon loads

ngdpbase's `AddonsManager` discovers addons via the `addons-path` config key, finds
`addons/geohazardwatch/index.js`, and calls `module.exports.register(engine, config)`.
The `engine` object provides access to all ngdpbase managers and the Express app.

```
ngdpbase/src/managers/AddonsManager.ts
  → loads addons/geohazardwatch/index.js
  → calls register(engine, config)
    → initialises VolcanoDataManager, EarthquakeDataManager, HansDataManager
    → registers 7 plugins with PluginManager
    → mounts Express static + API routes
    → seeds pages/ into ngdpbase data dir (first load only)
```

### Data flow

```
External API (GVP WFS / USGS / HANS)
  → import/*.js scripts          (run manually or via npm run import:*)
  → addons/geohazardwatch/data/*.json  (gitignored snapshots)
  → managers/*DataManager.js     (load on addon start, serve from memory)
  → plugins/*Plugin.js           (render HTML from manager data)
  → routes/api.js                (REST endpoints for client-side widgets)
```

### Plugin system

Plugins are plain objects `{ name, execute(context, params) }` registered with
ngdpbase's `PluginManager`. The wiki markup `[{PluginName key='val'}]` is resolved
at page render time. `context.engine.getManager('XxxDataManager')` gives plugin
access to in-memory data.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for repo structure, data pipeline depth, and guide to adding new data sources.
See [addons/geohazardwatch/README.md](./addons/geohazardwatch/README.md) for config keys, plugin syntax, and API reference.

## Key Decisions

- **CommonJS, not ESM** — ngdpbase uses CommonJS `require()`. Addon must match.
- **JSON snapshots, not live API calls** — plugins read pre-imported files for performance and offline resilience. Import scripts are the only place external APIs are called.
- **Pages seeded, never overwritten** — `seedAddonPages()` in ngdpbase copies `.md` files from `pages/` on first load only. User edits are preserved.
- **HansDataManager loads silently if `activity.json` is absent** — HANS data is optional; the addon starts cleanly without it.
- **ESLint config targets TS but addon code is JS** — `.eslintrc.json` is from the project template and is wired for future TS work. Current `lint:code` targets `addons/**/*.js` with plain JS linting rules only.

## Open Issues

Track all bugs and features on GitHub:

- jwilleke/geohazardwatch — addon and deployment issues
- jwilleke/ngdpbase — platform issues

Key open issues:

| Issue | Repo | Summary |
|-------|------|---------|
| #4 | geohazardwatch | NASA FIRMS satellite thermal data |
| #5 | geohazardwatch | VAAC ash advisories |
| #6 | geohazardwatch | MIROVA/MODVOLC satellite monitoring |
| #7 | geohazardwatch | VolcanoDiscovery RSS (licensing TBD) |
| #12 | geohazardwatch | [BUG] VolcanoInfobox placement on page |
| #13 | geohazardwatch | Tsunami and landslide feeds *(good first issue)* |
| #14 | geohazardwatch | [EPIC] Cloudflare Tunnel Setup for geohazardwatch.com |
| #29 | geohazardwatch | Deterministic container deployment builds |

## Agent Priority Matrix

### Agents CAN work autonomously on

- Adding new import scripts or data managers following existing patterns
- Adding new plugins (follow `plugins/*Plugin.js` pattern)
- Bug fixes and lint/format issues
- Documentation updates
- Adding API routes to `routes/api.js`
- Updating wiki page seeds in `pages/`
- Dependency updates (patch/minor)

### Agents MUST request human review for

- Changes to ngdpbase core (`/Volumes/hd2A/workspaces/github/ngdpbase/src/`)
- New external data sources (licensing, API key requirements)
- Changes to the addon's `register()` or `shutdown()` lifecycle
- Breaking changes to API route shapes (clients may depend on them)
- Production deployment

## Project Log

See [docs/project_log.md](docs/project_log.md) for session history and next steps.

## Quick Navigation

- [README.md](./README.md) — Setup and repo layout
- [addons/geohazardwatch/README.md](./addons/geohazardwatch/README.md) — Plugin syntax and API reference
- [GLOBAL-CODE-PREFERENCES.md](./GLOBAL-CODE-PREFERENCES.md) — Overarching principles
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) — Linting, formatting, commit conventions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Repo structure, data pipeline, adding new sources
- [docs/project_log.md](docs/project_log.md) — Session log
