---
project_state: "active"
last_updated: "2026-07-22"
agent_priority_level: "medium"
blockers: []
requires_human_review: ["major architectural changes", "security policy modifications", "deployment to production"]
agent_autonomy_level: "high"
kit_version: "3aa1bb4"
---

<!-- KIT:START 3aa1bb4 — managed by mjs-project-template; edit below the KIT:END marker -->
# Agent Context & Protocols

This section is **managed by the kit** (`install-kit.sh`) — it is identical across repos. Put repo-specific context **below the `KIT:END` marker**; do not edit here.

## Session continuity

- Before starting, read the `▶ Resume here` block at the top of `TODO.md` (committed, so it syncs across machines) and recent `git log`. That is where the last session left off — repeating finished work is the most common avoidable mistake.
- Commit a chunk of work with `/session-commit`: commits code + `TODO.md`, appends a journal entry to `private/project_log.md` (the log is never committed).
- Run `/pstatus` often (after every `/session-commit`): it ranks open work and recommends the next step.
- End a session with `/wrap`: commits anything outstanding, refreshes the `▶ Resume here` pointer, and reports whether it is safe to shut down the editor.

## Priorities — GitHub labels are the source of truth

Priority labels are mutually exclusive and mean:

- `P0` — **Broken. Stop all work and fix it.** (production down / blocked / security breach)
- `P1` — **Delivers value to the mission.**
- `P2` — **Nice to have.**
- `deferred` — consciously postponed; `needs-triage` — awaiting a priority decision.

Then:

- Security comes first. Scanner alerts (Dependabot / code-scanning / GitGuardian) become issues labeled `security` + a graded priority: critical/high → `P0`, medium → `P1`, low → `P2`.
- `TODO.md` = a `▶ Resume here` block (maintained by `/wrap`) on top, then priority bands that `/pstatus` regenerates from the labels. Do not hand-edit the bands.

## Working agreement

- Think before coding: state assumptions, surface trade-offs, ask when scope is ambiguous.
- Simplicity first: the minimum that solves the problem; nothing speculative.
- Use Conventional Commits for messages.
- Issue decomposition — NEVER put "Steps", "Phases", or numbered sequences inside a single GitHub issue. Break each step into its own issue and link them using GitHub relationships: `closes #N` / `fixes #N` (resolves another), `blocked by #N` (dependency), `relates to #N` (context link). Example: a 3-phase migration = 3 issues with "blocked by" chains, not one issue with Phase headings.
- Issue/PR links — Never use a bare `#N` reference alone. Always pair it with the full GitHub URL: `[#333](https://github.com/owner/repo/issues/333)`. This applies in commit messages, PR descriptions, comments, and any agent output. Use `/issues/N` for issues and `/pull/N` for PRs.
- Awaiting approval — When work is complete but requires human sign-off before closing, apply the `in-review` label and leave a comment on the issue/PR that states: what was done, what the human needs to verify, and what action closes it. Never self-close an issue or PR.
- Commits — always use the `/session-commit` skill. Never run a bare `git commit` directly. `/session-commit` enforces the session log update, conventional commit format, and co-author trailer.

## Markdown conventions

- Dash (`-`) bullets; no bare numbered lists. ATX (`#`) headings. Spaced tables (`| a | b |`).
- Inline HTML is **not** allowed. Long lines are fine.
- Rules live in `.markdownlint.jsonc`; the editor, CLI, CI and agents all read that one file.
<!-- KIT:END -->

## Project Context for AI Agents

This file is the single source of truth for project context and agent guidance.
Read this before starting any work. Update `last_updated` and relevant sections after significant changes.

## CRITICAL

Read [GLOBAL-CODE-PREFERENCES.md](./GLOBAL-CODE-PREFERENCES.md) first — overarching principles that govern all work.

## What This Project Is

**geohazardwatch** is an [ngdpbase](https://github.com/jwilleke/ngdpbase) add-on that provides volcano and geology data to an ngdpbase-based platform. It is **not a standalone app** — it runs inside an ngdpbase instance as an external addon loaded via `AddonsManager`.

The addon:

- Imports GVP volcano/eruption data and USGS earthquake/HANS alert data into local JSON snapshots
- Registers data managers with the ngdpbase engine so plugins can access them
- Registers seven markup plugins (`[{PluginName param='value'}]` syntax)
- Mounts REST API routes at `/api/geohazardwatch/*`
- Mounts an admin panel (`/addons/geohazardwatch`) with manual HANS/earthquake refresh buttons
- Registers background jobs that poll USGS HANS and earthquake feeds on a timer
- Seeds demo pages into the ngdpbase instance on first load, including Tsunami and
  Landslide pages that render live via the separate ngdpbase `feeds` addon (see Key Decisions)

## Commands

### Data import

```bash
npm run import                   # Volcanoes only
npm run import:eruptions         # + eruption records
npm run import:activity          # + global activity snapshot
npm run import:all               # + eruptions + global activity
npm run import:earthquakes       # USGS M4.5+ past 7 days
npm run import:earthquakes:month # USGS M4.5+ past 30 days
npm run import:hans              # USGS HANS real-time US volcano alerts
npm run import:vaac              # Washington VAAC active ash advisories
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

ngdpbase runs on port 3333. Admin panel at `/admin`, pages at `/view/<slug>`.

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
    → mounts Express static + API routes + admin routes (routes/admin.js)
    → registers BackgroundJobManager jobs (HANS + earthquake refresh, timer-driven)
    → registers an AddonsManager dashboard card
    → seeds pages/ into ngdpbase data dir (first load only)
```

### Data flow

```
External API (GVP WFS / USGS / HANS)
  → import/*.js scripts          (run manually, or on a timer via BackgroundJobManager)
  → addons/geohazardwatch/data/*.json  (gitignored snapshots)
  → managers/*DataManager.js     (load on addon start, serve from memory)
  → plugins/*Plugin.js           (render HTML from manager data)
  → routes/api.js                (REST endpoints for client-side widgets)
```

The Tsunami and Landslide pages (`pages/Tsunamis.md`, `pages/Landslides.md`) are a
separate, content-only path: they carry no import script or data manager in this repo.
They render live data via `[{DataFeed source='...'}]` markup, a plugin provided by
ngdpbase's own `feeds` addon ([ngdpbase#685](https://github.com/jwilleke/ngdpbase/issues/685)),
configured independently in the instance's `app-custom-config.json`. See
[Key Decisions](#key-decisions) and the page files themselves for the feed source config.

### Plugin system

Plugins are plain objects `{ name, execute(context, params) }` registered with
ngdpbase's `PluginManager`. The markup `[{PluginName key='val'}]` is resolved
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
- **Tsunami/Landslide pages depend on an addon this repo does not own** — `pages/Tsunamis.md` and `pages/Landslides.md` render live data through `[{DataFeed}]` markup from ngdpbase's `feeds` addon ([ngdpbase#685](https://github.com/jwilleke/ngdpbase/issues/685)). If that addon is absent or its `tsunami-alerts` / `landslide-events` sources aren't configured, the pages fall back to static informational content — geohazardwatch never fetches or stores this data itself. Field mappings (esp. NASA COOLR) should be re-verified against the live upstream schema before relying on them.
- **`type` vs `schemaType` on DataFeed sources** — `schemaType` stays `Article` for these two feeds until ngdpbase implements the `WarningAlert`/`Event` schema.org union types ([ngdpbase#762](https://github.com/jwilleke/ngdpbase/issues/762)); `type` carries the intended domain label in the meantime.

## Open Issues

Track all bugs and features on GitHub:

- jwilleke/geohazardwatch — addon and deployment issues
- jwilleke/ngdpbase — platform issues

Key open issues:

| Issue | Repo | Summary |
|-------|------|---------|
| #4 | geohazardwatch | NASA FIRMS satellite thermal data |
| #6 | geohazardwatch | MIROVA/MODVOLC satellite monitoring |
| #7 | geohazardwatch | VolcanoDiscovery RSS (licensing TBD) |
| #36 | geohazardwatch | Best sources for (P2) |

## Agent Priority Matrix

### Agents CAN work autonomously on

- Adding new import scripts or data managers following existing patterns
- Adding new plugins (follow `plugins/*Plugin.js` pattern)
- Bug fixes and lint/format issues
- Documentation updates
- Adding API routes to `routes/api.js`
- Updating page seeds in `pages/`
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
