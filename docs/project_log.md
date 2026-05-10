# Project Log

This document tracks ongoing work and session history for the ve-geology project.

## Format

```
### yyyy-MM-dd-##

- **Agent:** [Claude/Gemini/Other]
- **Subject:** [Brief description]
- **Work Done:**
  - [task 1]
  - [task 2]
- **Commits:** [hash list]
- **Files Modified:**
  - [file1.js]
  - [file2.md]
```

## Current Status

- **Phase:** Active development — core addon complete, data sources expanding
- **Build Status:** No build step (CommonJS JS). Lint passing (`npm run lint`)
- **Last Updated:** 2026-05-09
- **Overall Health:** Stable. v1.2.0 released — first release on the post-rename name, includes ngdpbase 3.11.3 base-image bump (CVEs), VolcanoInfobox `placement` param, and the Renovate annotation that wires the upstream-bump auto-PR loop. Lint clean.

## Next Steps

- **Close auto-deploy loop end-to-end (#31)** — fix dead `ci.yml`, drop missing `npm run test` step, add `auto-tag.yml` so Renovate auto-merges trigger image rebuild + Flux reconcile without intervention. Filed today as a result of finishing the Renovate plumbing in v1.2.0.
- Implement `system-category: addon` in ngdpbase seedAddonPages (ngdpbase#414)
- Implement Domain vs Additive addon type distinction (ngdpbase#415) — note: this addon does NOT yet declare `ngdpbase: { type: 'domain' }` in any `package.json`; flagged on ngdpbase#668 as a follow-up
- Admin panel Add-ons section (ngdpbase#412)
- New data sources (ve-geology#4 FIRMS, #5 VAACs, #6 MIROVA, #7 VolcanoDiscovery) — require licensing/API key review
- ~~Add pagination to VolcanoList and EarthquakeList (ve-geology#1)~~ ✓ done
- ~~Add end-user plugin documentation wiki pages (ve-geology#9)~~ ✓ done
- ~~Implement periodic data refresh via BackgroundJobManager (ve-geology#8)~~ ✓ done

---

## Session Logs

### 2026-05-10-01

- **Agent:** Claude Opus 4.7
- **Subject:** Implemented `jwilleke/geohazardwatch#35` — addon-rename
  downstream-config checklist (CONTRIBUTING.md) + `addon-rename-detector.yml`
  CI workflow. Closes #35.
- **Current Issue:** #35 (closed by this commit). Triggered by today's
  `geohazardwatch.com` outage (`jwilleke/ngdpbase#671`); companion runtime
  safety net shipped same day in `ngdpbase` v3.13.1
  (`assertConfiguredAddonsExist`, `jwilleke/ngdpbase#672`).
- **Work Done:**
  - Added a "Renaming the addon ID" subsection under *Making Changes* in
    `CONTRIBUTING.md`. Two-stage checklist: (1) pre-merge — update the
    `name:` field in `index.js` + `package.json`, run
    `gh search code "ngdpbase.addons.<old-id>" --owner jwilleke` to find
    downstream references, mention impact in the PR description, bump
    major semver; (2) post-merge — open companion `mj-infra-flux` PR with
    the matching configmap rename, coordinate merge order so the
    configmap reaches the cluster before the new image rolls out.
  - TOC at the top of `CONTRIBUTING.md` updated to surface the new
    subsection.
  - New `.github/workflows/addon-rename-detector.yml` workflow. Runs on
    push and PR. Diffs the addon's `name:` field against the previous
    tag; if a rename is detected, runs `gh search code` and fails the
    workflow if downstream matches are found, posting a check-run
    failure with the offending paths and a link back to the
    CONTRIBUTING.md section. Also posts a PR comment when triggered by
    `pull_request` events. Caveat documented: the default
    `GITHUB_TOKEN` may have limited access to private repos.
  - Lint-fixed long-line markdown in `CONTRIBUTING.md` for this repo's
    `MD013.line_length: 300` (different from `ngdpbase`'s 900). Wrapped
    long prose paragraphs at sentence boundaries.
  - Origin context: today's `geohazardwatch.com` outage was caused by
    exactly this failure mode — `jwilleke/geohazardwatch@fe8c4d3`
    renamed the addon from `ve-geology` → `geohazardwatch` (shipped in
    v1.2.0), but `mj-infra-flux/apps/production/geohazardwatch/configmap.yaml`
    still had `ngdpbase.addons.ve-geology.enabled: true`. AddonsManager
    silently disabled the addon. The runtime invariant in `ngdpbase`
    v3.13.1 catches this on next boot; this PR catches it at PR-author
    time.
- **Commits:** `e721636`
- **Files Modified:**
  - `CONTRIBUTING.md` (new "Renaming the addon ID" subsection + TOC update)
  - `.github/workflows/addon-rename-detector.yml` (new)

### 2026-05-09-03

- **Agent:** Claude Opus 4.7
- **Subject:** Close end-to-end deploy loop —
  [#31](https://github.com/jwilleke/geohazardwatch/issues/31) Fixes 2 and 3
  (`auto-tag.yml` + cascade validation), Node 20+ matrix requirement, full GitHub
  Actions upgrade to Node-24-compatible versions, resolves
  [#34](https://github.com/jwilleke/geohazardwatch/issues/34); files
  [#33](https://github.com/jwilleke/geohazardwatch/issues/33) (delete dead
  `deploy.yml`).
- **Current Issue:** [#31](https://github.com/jwilleke/geohazardwatch/issues/31)
  (open, fully resolved pending Flux-side observation);
  [#33](https://github.com/jwilleke/geohazardwatch/issues/33) (filed, open);
  [#34](https://github.com/jwilleke/geohazardwatch/issues/34) (resolved by
  `847cca4`, open pending close)
- **Tests:** CI ran for the first time ever after Gap 1 fix; first run failed on
  Node 18 (string-width's ES2024 `/v` regex flag); after dropping to Node 20+
  matrix, all subsequent runs green. End-to-end cascade exercised twice via
  `auto-tag.yml workflow_dispatch` — once after Commit A
  (checkout/setup-node v4→v6) producing `v1.2.1`, once after Commit B (Docker
  stack + codeql v3→v4) producing `v1.2.2`. Both image builds passed smoke test
  (start container, wait healthy, HTTP probe, Trivy scan).
- **Work Done:**
  - First push to `main` after Gap 1 fix (commit `b5ced42` from session
    2026-05-09-02) revealed a hidden Gap 5: `npx tsc --noEmit` failed on Node
    18 with 17 `Cannot find name fs/path/process/console` errors because
    `@types/node` was missing; fixed in same commit. Then the Node 18 leg of
    the matrix failed with `SyntaxError: Invalid regular expression flags` in
    `node_modules/string-width/index.js` — the `/v` regex flag is ES2024-only
    and requires Node 20+. Decision: drop Node 18 from the matrix
    (`engines.node: ">=20.0.0"`, `engines.npm: ">=10.0.0"`) — operator
    confirmed ngdpbase requires the same minimum. Commit `33c9922`.
  - Verified branch protection on `main` is fully open
    (`gh api repos/.../branches/main/protection` → 404; rulesets `[]`) —
    bot push for `auto-tag.yml` will not be blocked.
  - Walked the operator through fine-grained PAT setup and validated the
    resulting `RELEASE_PAT` end-to-end via a one-off
    `_test-release-pat.yml` workflow that did `gh api user` (returned
    `jwilleke`) plus push-and-delete of a throwaway non-`v*` tag (proves
    `contents: write` and that pushes from this token will trigger downstream
    workflows — the whole reason for using a PAT instead of `GITHUB_TOKEN`,
    which silently suppresses workflow chaining). Validation workflow added
    in `e9884ef` and removed in `89c6f2e`.
  - Drafted `auto-tag.yml`. Triggers: push to `main` with path filter
    (`addons/**`, `Dockerfile`, `package.json`, `package-lock.json`) plus
    `workflow_dispatch`. Concurrency group `auto-tag` with
    `cancel-in-progress: false` to serialize back-to-back pushes. Loop guard
    via `if: ${{ !contains(github.event.head_commit.message, 'chore: release') }}` —
    matches the canonical message `version.ts` documents and the workflow
    itself emits. Checkout uses `RELEASE_PAT` so the eventual
    `git push --follow-tags` is signed by the user identity. First push of
    the workflow file (`f94b5ee`) failed YAML validation: the unquoted `if:`
    expression had a colon-space inside `'chore: release'` parsed as a YAML
    mapping
    separator at the outer plain-scalar level. GitHub showed the run as
    failed-with-no-jobs and the workflow's `name` field as the file path,
    which is the diagnostic signature of a YAML parse failure. Fixed in
    `fe453b9` by wrapping the whole expression in double quotes.
    `node -e "yaml.load(...)"` catches this; `gh run view` does not.
  - Cascade verification round 1: triggered
    `auto-tag.yml workflow_dispatch` (run 25599929931, 19s green) →
    bumped `1.2.0` → `1.2.1` → committed `chore: release v1.2.1`
    (`e6e2bc4`) → tagged `v1.2.1` and pushed → `publish-image.yml` fired
    automatically on the tag push (run 25599934870) → built and published
    `ghcr.io/jwilleke/geohazardwatch:1.2.1`, smoke test passed, Trivy
    scan green. Loop guard verified empirically: the
    `chore: release v1.2.1` commit also triggered
    `auto-tag.yml` (run 25599934919) which immediately skipped via the `if:`
    guard (1s, status `skipped`). PAT chaining works.
  - Addressed deprecation warnings observed across all workflow runs:
    "Node.js 20 actions are deprecated" (forced to Node 24 by 2026-06-02;
    Node 20 removed from runners 2026-09-16) and "CodeQL Action v3 will be
    deprecated in December 2026". Audited all action versions in use, then
    split the bumps into two commits for bisectability.
  - **Commit A** (`6ae95ba`): bumped `actions/checkout@v4 → v6` and
    `actions/setup-node@v4 → v6` across `ci.yml`, `auto-tag.yml`, and
    `publish-image.yml`. (Did NOT touch `deploy.yml` — slated for deletion
    in #33.) CI run 25600041521 green; Node 20 deprecation annotation gone
    from logs.
  - **Commit B** (`847cca4`): bumped Docker stack and codeql in
    `publish-image.yml` — `setup-buildx@v3 → v4`, `metadata@v5 → v6`,
    `login@v3 → v4`, `build-push@v5 → v7`, `codeql-action/upload-sarif@v3
    → v4`. Highest risk was `build-push` v6 changing default provenance
    behavior with `push: true + load: true` together; validated by
    triggering `auto-tag.yml workflow_dispatch` again (cuts `v1.2.2`,
    `3abc946`) and watching the cascade — `publish-image.yml` ran 2m11s
    green with all smoke-test steps and Trivy scan passing. Node 20 +
    CodeQL v3 deprecation warnings both gone after this commit. This
    resolves [#34](https://github.com/jwilleke/geohazardwatch/issues/34).
    Left `aquasecurity/trivy-action@master` unpinned — orthogonal hygiene
    concern, separate small follow-up if desired (not filed).
  - Filed [#33](https://github.com/jwilleke/geohazardwatch/issues/33) —
    delete dead `deploy.yml` (Gap 4 surfaced during #31 verification: dead
    branch listener `master`, calls nonexistent `npm run test`/`build`,
    ends in stub `echo`). Recommended low priority — workflow is dead, not
    actively harmful.
- **Open work (next sessions):**
  - Wait for Flux's 10-minute `ImageRepository` poll to pick up `v1.2.2`
    in `mj-infra-flux/apps/production/geohazardwatch`; verify
    `ImageUpdateAutomation` commits the bump to `mj-infra-flux/master`;
    verify cluster reconcile rolls the geohazardwatch pod onto `1.2.2`.
    Then close #31.
  - #33 — delete `deploy.yml` (one-line PR).
  - #34 — close (resolved by `847cca4`).
  - Pin `aquasecurity/trivy-action` from `@master` to a tag (not filed,
    optional hygiene).
- **Commits (this session):**
  `33c9922`, `e9884ef`, `89c6f2e`, `f94b5ee`, `fe453b9`, `e6e2bc4` (bot —
  v1.2.1 release via auto-tag self-test), `6ae95ba`, `847cca4`, `3abc946`
  (bot — v1.2.2 release via auto-tag self-test of Commit B), plus this
  log entry.
- **Files Modified:**
  - `package.json` (engines.node `>=18.0.0` → `>=20.0.0`, engines.npm
    `>=9.0.0` → `>=10.0.0`; version `1.2.0` → `1.2.1` → `1.2.2` via bot)
  - `package-lock.json` (corresponding lockfile updates)
  - `.github/workflows/ci.yml` (matrix `[18.x, 20.x]` → `[20.x]`,
    `actions/checkout@v4 → v6`, `actions/setup-node@v4 → v6`)
  - `.github/workflows/auto-tag.yml` (NEW — 56 lines; later YAML quote
    fix; later checkout/setup-node bumps)
  - `.github/workflows/publish-image.yml` (full action stack bumps;
    `actions/checkout@v4 → v6`, Docker stack v3/v5 → v4/v6/v7, codeql
    `v3 → v4`)
  - `.github/workflows/README.md` (dropped stale Node 18.x references in
    docs to match new matrix)
  - `.github/workflows/_test-release-pat.yml` (NEW then DELETED — PAT
    validation, see commits `e9884ef` + `89c6f2e`)
  - `addons/geohazardwatch/index.js` (version constant bumped twice via
    bot — `1.2.0` → `1.2.1` → `1.2.2`)
  - `CHANGELOG.md` (two new sections from `version:bump` —
    `[1.2.1]`, `[1.2.2]`; bodies left as the empty Added/Changed/Fixed
    scaffold for retroactive fill)
  - `docs/project_log.md` (this entry)

### 2026-05-09-02

- **Agent:** Claude Opus 4.7
- **Subject:** Close [#31](https://github.com/jwilleke/geohazardwatch/issues/31) Gaps 1, 2, and 2b — make `ci.yml` actually runnable on `main`
- **Current Issue:** [#31](https://github.com/jwilleke/geohazardwatch/issues/31) (open; auto-tag + end-to-end verification still pending)
- **Tests:** `npm run lint` clean; `npx tsc --noEmit` clean (after `@types/node` added)
- **Work Done:**
  - Verified all three gaps in #31 against the actual repo state and posted
    findings as a
    [comment on #31](https://github.com/jwilleke/geohazardwatch/issues/31#issuecomment-4412321055).
    Confirmed Gap 1 (default branch is `main`, workflow listened on
    `master`/`develop`, `gh run list --workflow=ci.yml` returned empty),
    Gap 2 (no `test` or `test:coverage` script in `package.json`), and Gap 3
    (`publish-image.yml` only triggers on `v*` tags).
  - Surfaced two extras the issue had missed: **Gap 2b** — `ci.yml`'s third
    job called `npm run build`, also nonexistent; and **Gap 4** —
    `.github/workflows/deploy.yml` is dead and broken (listens on `master`,
    calls `npm run test` and `npm run build`, ends in a stub `echo`).
    Recommended deleting `deploy.yml` separately rather than fixing it; not
    actioned in this session.
  - Debunked one earlier concern: `version:bump` (i.e. `src/utils/version.ts`)
    only edits files — it does NOT git-commit or git-tag, so a future
    `auto-tag.yml` doing those manually is correct, not redundant.
  - Edited `.github/workflows/ci.yml` — changed
    `branches: [master, develop]` → `[main]`, removed the `Run tests` and
    `Check test coverage` steps, removed the `build` job entirely, and
    renamed the lint job `lint-and-test` → `lint-and-typecheck` so the name
    matches what runs. Kept lint + `tsc --noEmit` + `npm audit`.
  - Hit a hidden Gap 5 during local verification: `npx tsc --noEmit` failed
    with 17 errors (`fs`, `path`, `__dirname`, `process`, `console` all
    unresolvable) because `@types/node` was not in `devDependencies`. The
    original CI never actually ran (Gap 1), so this would have surfaced
    immediately once the branch listener was fixed. Added
    `@types/node@^25.6.2` as devDep — `tsc` now silent, no other code
    touched.
  - Drive-by: `.claude/commands/check-todos.md` got one extra line pointing
    at the GitHub Actions URL (relevant now that CI will actually start
    running).
  - **Did NOT cut a release.** This change is CI-only + a devDep — no runtime behavior changes, so `/semver` was skipped.
- **Open work for #31 (next session):**
  - Decide whether `auto-tag.yml` should path-filter (`addons/**`, `Dockerfile`, `package.json`, `package-lock.json`) or accept rebuild-on-every-commit.
  - Verify `main` branch protection won't block a bot-pushed tag commit before wiring `auto-tag.yml`.
  - Delete `deploy.yml` (Gap 4) — separate small PR.
  - End-to-end verification: a no-op commit on `main` should cascade auto-tag → `publish-image.yml` → Flux ImagePolicy → cluster reconcile.
- **Commits:** `b5ced42` (this session's CI fix); session log commit follows.
- **Files Modified:**
  - `.github/workflows/ci.yml`
  - `package.json` (+ `@types/node` devDep)
  - `package-lock.json`
  - `.claude/commands/check-todos.md`
  - `docs/project_log.md` (this entry)

### 2026-05-09-01

- **Agent:** Claude Opus 4.7
- **Subject:** v1.2.0 release — ngdpbase 3.11.3 base-image bump, Renovate annotation
  enabling upstream auto-PRs, and the broader
  [ngdpbase#668](https://github.com/jwilleke/ngdpbase/issues/668) decision context. Filed
  [#31](https://github.com/jwilleke/geohazardwatch/issues/31) for the remaining auto-deploy
  gap.
- **Current Issue:** PR [#30](https://github.com/jwilleke/geohazardwatch/pull/30) (merged); [#31](https://github.com/jwilleke/geohazardwatch/issues/31) (filed)
- **Tests:** lint clean (`npm run lint`); CI itself does NOT run today — see #31 Gap 1.
- **Work Done:**
  - Collaborated with the operator on [ngdpbase#668](https://github.com/jwilleke/ngdpbase/issues/668)
    ("Deterministic method for container deployment builds"). Investigated existing pipelines on
    both sides and concluded: ngdpbase already auto-publishes `ghcr.io/jwilleke/ngdpbase:<v>`
    on every `v*` tag (its `docker-build.yml` has been working all along); the actual gap was
    on the consumer side (this repo), where `Dockerfile`'s `ARG NGDPBASE_VERSION` was
    hand-bumped via release PRs (#25, #27, #28) and had drifted to `3.10.3` despite ngdpbase
    shipping `3.11.0`/`3.11.1`/`3.11.2`/`3.11.3`. Decision: keep the FROM-the-prebuilt-image
    pattern; close the drift gap with a Renovate annotation. Documented in
    [ngdpbase#668 closing comment](https://github.com/jwilleke/ngdpbase/issues/668).
  - Opened PR [#30](https://github.com/jwilleke/geohazardwatch/pull/30) — added
    `# renovate: datasource=docker depName=ghcr.io/jwilleke/ngdpbase` annotation above the
    `ARG NGDPBASE_VERSION` line in `Dockerfile`. The existing `renovate.json` already had the
    right `packageRules` for `ghcr.io/jwilleke/ngdpbase` (auto-merge minor/patch via
    `automergeType: branch + platformAutomerge: true`, manual review on major); what was
    missing was the annotation that lets Renovate's dockerfile manager *find* the dependency
    when the version lives in an `ARG` rather than a literal `FROM image:tag` line. Without
    it, Renovate had been silently ignoring this dep (which is why every prior bump was a
    hand-titled PR). Bumped ARG `3.10.3 → 3.11.3` in the same commit; squash-merged.
  - Cut **v1.2.0** as a minor release. CHANGELOG `[Unreleased]` (the rebadge from
    `ve-geology` → `geohazardwatch` that's been sitting since `fe8c4d3`) was promoted into
    the `[1.2.0]` section, plus today's two additions appended: VolcanoInfobox `placement`
    param (works with the new platform-wide `.plugin-placement-*` CSS contract from ngdpbase
    3.11.3) and the Dockerfile bump + Renovate annotation. Tag pushed; GitHub release
    created with auto-generated notes; `publish-image.yml` ran and built
    `ghcr.io/jwilleke/geohazardwatch:1.2.0` successfully (10:06 UTC).
  - **Side finding investigated and filed as
    [#31](https://github.com/jwilleke/geohazardwatch/issues/31):** when the operator asked
    "will geohazardwatch auto-build a container after a future Renovate auto-merge?",
    checking turned up three concrete gaps: (1) `ci.yml` listens on
    `branches: [master, develop]` but the default branch is `main` — workflow has literally
    never run; (2) `ci.yml` calls `npm run test` and `npm run test:coverage` which don't
    exist in `package.json` (only lint scripts do) — would fail at the test step once Gap 1
    is fixed; (3) `publish-image.yml` triggers only on `v*` tag pushes, so a Renovate
    auto-merge to `main` wouldn't produce a new image. The proposed fix in #31 closes all
    three: branch+scripts patch on `ci.yml`, new `auto-tag.yml` workflow that bumps
    patch+tags on every push to main, and end-to-end verification.
  - Confirmed the deployment-side automation in
    [`jwilleke/mj-infra-flux/apps/production/geohazardwatch/image-policy.yaml`](https://github.com/jwilleke/mj-infra-flux/tree/master/apps/production/geohazardwatch)
    is already complete (`ImageRepository` polls every 10 min; `ImagePolicy` semver
    `>=1.0.0 <2.0.0`; `ImageUpdateAutomation` commits the bump to `mj-infra-flux/master`).
    The chain only stalls at #31's gaps; everything before and after is already automated.
- **Notable observations:**
  - This addon does not declare `ngdpbase: { type: 'domain' }` in any `package.json` —
    neither the repo-level one nor an inner `addons/geohazardwatch/package.json` (the latter
    doesn't exist). So `AddonsManager` has been loading it as the default `additive` type
    even though architecturally it IS the site identity. The `domainAddonName` enforcement
    at `AddonsManager.ts:633-643` therefore never trips. Flagged on ngdpbase#668 closing
    comment; worth a separate small fix in this repo (add an inner
    `addons/geohazardwatch/package.json` with `"ngdpbase": { "type": "domain" }`) but out
    of scope for both #30 and #31.
  - The "GeoHazardWatch" name surfacing in PM2 process listings on the operator's
    `ngdpbase-veg` deployment is the `ngdpbase.application-name` value set in that
    instance's custom config — `ecosystem.config.js`'s `readAppName()` priority puts custom
    config above `.env PROJECT_NAME=ve-geology`. Same single process, two display names
    depending on which file you read first.
- **Commits:** `334dfa2` (PR #30 merged squash → `84f6763` on main), `82daf5f` (release v1.2.0)
- **Files Modified:**
  - `Dockerfile` (Renovate annotation + ARG bump 3.10.3 → 3.11.3)
  - `package.json` (1.1.6 → 1.2.0)
  - `package-lock.json` (1.1.6 → 1.2.0; also picks up the post-rename name correction `ve-geology` → `geohazardwatch` that had been sitting in the lockfile)
  - `addons/geohazardwatch/index.js` (version constant bumped by `version:bump`)
  - `CHANGELOG.md` (`[Unreleased]` promoted to `[1.2.0]`, expanded with today's additions)
  - `docs/project_log.md` (this entry; also updated Current Status and Next Steps)

### 2026-05-08-03

- **Agent:** Claude Opus 4.7
- **Subject:** Post-rename hygiene — slash commands, issue closures, AGENTS table refresh
- **Current Issue:** #23 (closed), #11 (closed)
- **Tests:** lint clean (`npm run lint`)
- **Work Done:**
  - Committed 7 project-shared slash command definitions (`docs`, `othersites`, `perf-test`, `release`, `semver`, `session-commit`, `sync-template`) under `.claude/commands/`.
  - Deleted stale `ve-geology.code-workspace`; the updated `.gitignore` already catches `geohazardwatch.code-workspace`.
  - Pushed `main` (geohazardwatch) and `master` (ngdpbase) to their remotes.
  - Posted summary comment on #23 and closed as completed — the rename EPIC shipped in this session via `fe8c4d3`.
  - Verified #11 was already implemented in `1c6973f` but never closed; posted comment noting the post-rename mount path (`/addons/geohazardwatch`) and closed as completed.
  - Refreshed AGENTS.md "Key open issues" table — removed 5 closed issues (#1, #2, #8, #411, #412), added 4 open ones (#12, #13, #14, #29).
- **Commits:** `51a4299`, `6d577d8`
- **Files Modified:**
  - `.claude/commands/docs.md`
  - `.claude/commands/othersites.md`
  - `.claude/commands/perf-test.md`
  - `.claude/commands/release.md`
  - `.claude/commands/semver.md`
  - `.claude/commands/session-commit.md`
  - `.claude/commands/sync-template.md`
  - `AGENTS.md`
  - `ve-geology.code-workspace` *(deleted)*

### 2026-05-08-02

- **Agent:** Claude Opus 4.7
- **Subject:** Full rebadge from `ve-geology` to `geohazardwatch` (runtime identity, not just repo name)
- **Work Done:**
  - Renamed npm package name, addon directory, REST API and admin mount paths, config keys (`ngdpbase.addons.geohazardwatch.*`), background job IDs, capability flag, default `dataPath`, stylesheet path, and dashboard title.
  - Updated all 5 plugin files, both routes files, import scripts, EJS admin view, CSS banner comment, `default-config.json`, `Dockerfile`, `publish-image.yml`, `version.ts`, and `.gitignore`/`.dockerignore` paths and workspace pattern.
  - Swept top-level `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SETUP.md`, addon `README.md`, and all 7 seed pages.
  - CHANGELOG and this project_log left as historical record; new `[Unreleased]` CHANGELOG section and this session entry added describing the rename.

### 2026-05-08-01

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.6 — bump ngdpbase base image to 3.10.3 + seed `request-access` page
- **Current Issue:** PR #28 (merged)
- **Tests:** lint clean (`npm run lint`)
- **Work Done:**
  - Bumped `Dockerfile` `ARG NGDPBASE_VERSION` from `3.10.2` to `3.10.3` to pick up `jwilleke/ngdpbase#654` — adds the `ngdpbase.application.registration` config flag.
  - Added new seed page `addons/ve-geology/pages/ve-geology-request-access.md`
    (slug `request-access`, UUID v4 `2731a6b1-1ef6-465b-80b3-2f8ed148476b`).
    Destination for the **Request access** button shown when
    `ngdpbase.application.registration: false`. Page contains a starter
    contact instruction; operator edits in the wiki UI.
  - `npm run version:bump -- patch` → 1.1.5 → 1.1.6. Filled in CHANGELOG `[1.1.6]` under Added (new seed page) and Changed (base image bump).
  - Tagged and published `v1.1.6` to `ghcr.io/jwilleke/geohazardwatch:1.1.6` (publish workflow run `25547558465` green).
- **Commits:** `088e786` (squash-merged)
- **Files Modified:**
  - `Dockerfile`
  - `addons/ve-geology/pages/ve-geology-request-access.md` (new)
  - `package.json`
  - `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-06

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.4 — bump ngdpbase base image to 3.10.1
- **Symptom on cluster:** Logged-in `admin` user had no Edit button and no admin dashboard. The page showed `GeoHazardWatch v3.9.0`.
- **Root cause:** Cluster image was layered on `ghcr.io/jwilleke/ngdpbase:3.9.0`.
  ngdpbase 3.10 introduced OrganizationRole records in `data/roles/` (per
  `User.ts:78` deprecation note for the legacy `roles[]` field). 3.9's headless
  install never created those records, so `UserManager.resolveUserRoles('admin')`
  returned an empty role set and the policy evaluator treated the admin user as
  `Anonymous|All`.
- **Fix:** Bumped `Dockerfile` `ARG NGDPBASE_VERSION=3.9.0` → `3.10.1`. v3.10.0 was cut earlier today and v3.10.1 (just published) is the first release with the image landing in `ghcr.io/jwilleke/ngdpbase`.
- **Files Modified:**
  - `Dockerfile`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-05

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.3 — replace placeholder UUIDs with real v4 UUIDs in seed pages
- **Work Done:**
  - Live cluster boot logs (after the `addons-path` array fix in `mj-infra-flux#49`) showed all 8 seed pages skipped: `[AddonsManager] Skipping ve-geology/pages/ve-geology-*.md — missing or invalid uuid in frontmatter`.
  - Root cause: placeholder UUIDs of the form `a1b2c3d4-000N-4000-8000-ve0geology00N` contain non-hex characters (`v`, `g`, `l`, `o`, `y`) and fail ngdpbase's `AddonsManager` validator regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`.
  - Confirmed against ngdpbase's `docs/platform/addon-development-guide.md` (UUID requirements section) which states the rules and recommends `node -e "console.log(require('crypto').randomUUID())"` for generation.
  - Generated 8 fresh v4 UUIDs and replaced each page's frontmatter `uuid` field. Existing valid UUIDs on `left-menu-content.md` and `footer-content.md` were left as-is.
  - Bumped to v1.1.3 (patch — bug in seeded content).
- **Files Modified:**
  - `addons/ve-geology/pages/ve-geology-about.md`
  - `addons/ve-geology/pages/ve-geology-demo.md`
  - `addons/ve-geology/pages/ve-geology-earthquakes.md`
  - `addons/ve-geology/pages/ve-geology-hans.md`
  - `addons/ve-geology/pages/ve-geology-home.md`
  - `addons/ve-geology/pages/ve-geology-japan.md`
  - `addons/ve-geology/pages/ve-geology-plugins.md`
  - `addons/ve-geology/pages/ve-geology-volcanoes.md`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-04

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.2 — fix `npm ci --omit=dev` failure on husky prepare script
- **Work Done:**
  - v1.1.1 publish workflow failed at `RUN npm ci --omit=dev` with `sh: husky: not found, npm error code 127`.
  - Root cause: package.json `prepare` script calls `husky install`. With `--omit=dev`, husky (a devDependency) isn't installed, so the script fails. The container build doesn't need git hooks anyway.
  - Added `--ignore-scripts` to the npm ci invocation to skip lifecycle scripts during the runtime build.
  - Bumped to v1.1.2.
- **Files Modified:**
  - `Dockerfile`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-03

- **Agent:** Claude Opus 4.7
- **Subject:** v1.1.1 — fix broken Dockerfile base image reference
- **Work Done:**
  - v1.1.0 publish-image workflow failed at `FROM ghcr.io/jwilleke/ngdpbase:v3.10.0` — `not found`.
  - Two issues: ngdpbase's `docker/metadata-action` strips the `v` from published image tags (so the published tag is `3.10.0`, not `v3.10.0`), AND ngdpbase's latest *published* release is `v3.9.0` — `v3.10.0` is in-progress in `package.json` but not yet tagged on the ngdpbase repo.
  - Pinned base image to `3.9.0`. Renovate will auto-PR an upgrade once `ngdpbase` publishes `3.10.0`.
  - Bumped to v1.1.1 (patch — broken-on-arrival fix).
- **Files Modified:**
  - `Dockerfile`
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `docs/project_log.md` (this file)

### 2026-05-07-02

- **Agent:** Claude Opus 4.7
- **Subject:** Release v1.1.0 — first dockerized release
- **Work Done:**
  - Merged `#19` (Dockerfile, image-publish workflow, Renovate) onto `main`.
  - `npm run version:bump -- minor` → 1.0.1 → 1.1.0 (updated `package.json`, `addons/ve-geology/index.js`, `CHANGELOG.md`).
  - Filled in CHANGELOG `[1.1.0]` section with the new artifacts and the repo rename note.
  - Replaced stale `jwilleke/ve-geology` URLs in `src/utils/version.ts` and CHANGELOG link footers with the new `jwilleke/geohazardwatch` canonical URL.
  - Tag `v1.1.0` will trigger `publish-image.yml` to publish `ghcr.io/jwilleke/geohazardwatch:{1.1.0, 1.1, 1, latest}`.
- **Files Modified:**
  - `package.json`, `addons/ve-geology/index.js`
  - `CHANGELOG.md`
  - `src/utils/version.ts`
  - `docs/project_log.md` (this file)

### 2026-05-07-01

- **Agent:** Claude Opus 4.7
- **Subject:** Repo rename `ve-geology` → `geohazardwatch`, dockerization, image-publish workflow, Renovate
- **Key Decision:** Bake addon code into a per-release `ghcr.io/jwilleke/geohazardwatch` image layered on `ghcr.io/jwilleke/ngdpbase`. Data (volcanoes, eruptions, HANS) lives on a persistent volume in the cluster, refreshed by a CronJob — not in the image.
- **Work Done:**
  - Renamed GitHub repo `jwilleke/ve-geology` → `jwilleke/geohazardwatch`; old URLs redirect.
  - Updated local clone's origin URL.
  - Decided (with operator) to bypass Traefik on the public path for `geohazardwatch.com` (Cloudflare Tunnel → k8s Service direct). See sibling change in `mj-infra-flux`.
  - Decided to keep the addon in this repo (no separate addon repo). Repo's reason for existence is the addon.
  - Added `Dockerfile` (FROM `ghcr.io/jwilleke/ngdpbase:v3.10.0`, copies addon + root deps into `/opt/geohazardwatch/`).
  - Added `.dockerignore` (excludes `node_modules`, `private/`, `addons/ve-geology/data/`, etc.).
  - Added `.github/workflows/publish-image.yml` (mirrors ngdpbase pattern: tag-triggered, multi-tag semver, ghcr.io push, smoke test, Trivy scan).
  - Added `renovate.json` — minor/patch auto-merge for both the base image and npm deps; major bumps require review.
- **Follow-up (separate PR):** Cluster-side manifests in `mj-infra-flux` (`apps/production/geohazardwatch/`) including image automation (Flux `ImageRepository` / `ImagePolicy` / `ImageUpdateAutomation`).
- **Files Modified:**
  - `Dockerfile` (new)
  - `.dockerignore` (new)
  - `.github/workflows/publish-image.yml` (new)
  - `renovate.json` (new)
  - `docs/project_log.md` (this file)

### 2026-03-31-03

- **Agent:** Claude Sonnet 4.6
- **Subject:** SEMVER setup, cleanup, 409 fix, v1.0.1 release
- **Work Done:**
  - Added `src/utils/version.ts` — bumps version atomically across `package.json`, `index.js`, `CHANGELOG.md`; added `npm run version:bump` script; installed `tsx` + `typescript` devDeps
  - Added `CHANGELOG.md` following Keep a Changelog format; tagged `v1.0.0`
  - Released `v1.0.1`: deleted unused template boilerplate (`.env.example`, `SECURITY.md`, `TEMPLATE_INTEGRATION.md`); added `.markdownlintignore` to exclude `private/`; updated `lint:md` scripts
  - Fixed 409 Page Conflict on admin edit: added missing `uuid` front-matter to `ve-geology-hans`, `ve-geology-home`, `ve-geology-about`, `ve-geology-plugins`; patched live ngdpbase pages directly
  - Consolidated `addons/ve-geology/private/dev-notes.md` into root `private/dev-notes.md`; added `private/` to `.gitignore`
  - Updated ngdpbase#411 with workaround details
- **Commits:** `2255932` `147e488` `1bd7975` `c6e64b3` `084b988` + this session
- **Files Modified:**
  - `src/utils/version.ts` (new)
  - `CHANGELOG.md`
  - `package.json`
  - `addons/ve-geology/index.js`
  - `addons/ve-geology/pages/ve-geology-hans.md`
  - `addons/ve-geology/pages/ve-geology-home.md`
  - `addons/ve-geology/pages/ve-geology-about.md`
  - `addons/ve-geology/pages/ve-geology-plugins.md`
  - `.gitignore`
  - `.markdownlintignore`
  - `docs/project_log.md`

### 2026-03-31-02

- **Agent:** Claude Sonnet 4.6
- **Subject:** Periodic data refresh via BackgroundJobManager (ve-geology#8)
- **Work Done:**
  - Refactored all three import scripts to export `runImport()` functions without side-effects
    at module load — CLI entry point gated behind `require.main === module`
  - `import-hans.js`: extracted `runImport(dataDir)` → returns `{ elevatedCount, monitoredCount }`
  - `import-earthquakes.js`: extracted `runImport(dataDir, feedName)` → returns `{ total, nearVolcano }`;
    moved CLI arg validation inside the `require.main` guard
  - `import-volcanoes.js`: extracted `runImport(dataDir, { eruptions, activity })` → returns
    `{ total, holocene, pleistocene }`; CLI flags parsed only when run directly
  - `index.js`: added `runHansImport` / `runEarthquakeImport` requires; added `_intervals` array;
    registered `ve-geology.import-hans` and `ve-geology.import-earthquakes` jobs with
    BackgroundJobManager; scheduled polling via `setInterval`; clears intervals in `shutdown()`
  - Config keys: `hansIntervalMs` (default 600 000 ms / 10 min), `eqIntervalMs` (default 1 200 000 ms / 20 min); set to `0` to disable
  - BackgroundJobManager is optional — addon starts cleanly if manager not available
  - After each job the corresponding manager calls `load()` to hot-reload snapshot into memory
- **Commits:** (this session)
- **Files Modified:**
  - `addons/ve-geology/import/import-hans.js`
  - `addons/ve-geology/import/import-earthquakes.js`
  - `addons/ve-geology/import/import-volcanoes.js`
  - `addons/ve-geology/index.js`
  - `docs/project_log.md`

### 2026-03-31-01

- **Agent:** Claude Sonnet 4.6
- **Subject:** End-user plugin documentation (ve-geology#9); close ve-geology#1
- **Work Done:**
  - Closed ve-geology#1 (pagination already done in commit abd6030)
  - Created `pages/ve-geology-plugins.md` — editor-focused guide covering all 7 plugins with
    what-it-renders descriptions, copy-paste markup examples, filter combinations, and data
    freshness notes; seeded at `/wiki/ve-geology-plugins`
  - Created `pages/ve-geology-about.md` — addon context page covering data sources (GVP, USGS,
    HANS), data freshness/cadence, plugin summary table, and links to source portals;
    seeded at `/wiki/ve-geology-about`
  - Updated `addons/ve-geology/README.md` — added HansAlerts to plugin table, added realistic
    "common use" examples after each parameter table, added link to in-wiki user guide
  - Issues #4–7 (new external data sources) and #8 (BackgroundJobManager) flagged for human
    review per AGENTS.md (new data source licensing; register() lifecycle change)
- **Commits:** (this session)
- **Files Modified:**
  - `addons/ve-geology/pages/ve-geology-plugins.md` (new)
  - `addons/ve-geology/pages/ve-geology-about.md` (new)
  - `addons/ve-geology/README.md`
  - `docs/project_log.md`

### 2026-03-30-05

- **Agent:** Claude Sonnet 4.6
- **Subject:** Pagination for VolcanoList and EarthquakeList (ve-geology#1)
- **Work Done:**
  - Added prev/next pagination controls to `VolcanoListPlugin.js` and `EarthquakeListPlugin.js`
  - Each plugin instance gets a unique widget ID; multiple instances on one page work independently
  - Filters embedded as JSON in the script closure at render time; client-side `goTo(offset)` fetches the API and swaps tbody rows in-place
  - Disabled prev/next buttons reflect boundary conditions (first/last page)
  - Added shared `.vl-pagination` / `.vl-page-btn` CSS to `ve-geology.css`
  - Verified on `/wiki/geology-demo`: "Showing 1–10 of 114" with working Prev/Next
- **Commits:** `abd6030`
- **Files Modified:**
  - `addons/ve-geology/plugins/VolcanoListPlugin.js`
  - `addons/ve-geology/plugins/EarthquakeListPlugin.js`
  - `addons/ve-geology/public/css/ve-geology.css`

### 2026-03-30-04

- **Agent:** Claude Sonnet 4.6
- **Subject:** Fix Leaflet maps not rendering — bundle Leaflet locally
- **Work Done:**
  - Diagnosed root cause: machine has no external network access; `unpkg.com` unreachable from browser, so Leaflet.js never loaded
  - Installed `leaflet@1.9.4` as npm dependency
  - Copied Leaflet JS, CSS, and all image assets to `addons/ve-geology/public/vendor/leaflet/`
  - Updated `VolcanoMapPlugin.js` and `EarthquakeMapPlugin.js` to load from `/addons/ve-geology/vendor/leaflet/` instead of unpkg CDN
  - Verified `http://localhost:3333/addons/ve-geology/vendor/leaflet/leaflet.js` returns 200
- **Commits:** `8c97605`
- **Files Modified:**
  - `addons/ve-geology/plugins/VolcanoMapPlugin.js`
  - `addons/ve-geology/plugins/EarthquakeMapPlugin.js`
  - `addons/ve-geology/public/vendor/leaflet/` (new — leaflet.js, leaflet.css, images/)
  - `package.json`

### 2026-03-30-03

- **Agent:** Claude Sonnet 4.6
- **Subject:** Fix domain home page not visible at root URL
- **Work Done:**
  - Diagnosed root cause: `WikiRoutes.homePage()` hardcoded `res.redirect('/view/Welcome')` — never read `ngdpbase.front-page` config
  - Fixed `homePage()` to read `ngdpbase.front-page` config, defaulting to `Welcome`
  - Filed and fixed ngdpbase#416
  - Rebuilt ngdpbase and restarted — `/` now redirects to `/view/volcanoes-and-earthquakes`
  - Verified home page renders with VolcanoMap, EarthquakeList, and HansAlerts plugins
- **Commits:** `f1915e2e` (ngdpbase)
- **Files Modified:**
  - `ngdpbase/src/routes/WikiRoutes.ts`

### 2026-03-30-02

- **Agent:** Claude Sonnet 4.6
- **Subject:** Domain front page, addon type architecture, DRY docs, project template integration
- **Work Done:**
  - Created `ve-geology-home.md` — domain front page (slug: `volcanoes-and-earthquakes`) with VolcanoMap, EarthquakeList, HansAlerts, and data source table
  - Updated `ngdpbase/data/config/app-custom-config.json` — set `ngdpbase.front-page: volcanoes-and-earthquakes`
  - Applied `mjs-project-template` via `integrate_template.sh` (Normal copy mode) — added ESLint, Prettier, Husky, markdownlint, GitHub Actions CI, `.claude/` commands, `ARCHITECTURE.md`, `CODE_STANDARDS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SETUP.md`, `AGENTS.md`, `DOCUMENTATION.md`
  - Merged `package.json` and `.gitignore` manually (template + ve-geology-specific entries preserved)
  - Fixed `.eslintrc.json` — removed TypeScript project-aware rules incompatible with JS-only addon code
  - Upgraded `@typescript-eslint` to v8 to resolve devDependency vulnerabilities
  - Fixed markdown lint errors across wiki pages (MD025, MD036, MD060 disabled)
  - Populated `AGENTS.md` with ve-geology-specific content — commands, architecture, key decisions, open issues, agent autonomy matrix
  - Created `CLAUDE.md` redirect to `AGENTS.md`
  - Populated `ARCHITECTURE.md` — addon lifecycle, data pipeline, tech stack, guide for adding new data sources
  - Populated `SETUP.md` — prereqs, 5-step setup, verification, troubleshooting
  - DRY pass across all docs — each doc owns one topic, others link to SSoT
  - Filed ngdpbase#414 — `system-category: addon` for addon-seeded pages
  - Filed ngdpbase#415 — Domain vs Additive addon type distinction with `domainDefaults()` proposal
  - Filed ve-geology#9 — end-user plugin documentation (supersedes #2)
  - Closed ve-geology#2 (superseded by #9)
- **Commits:** `507e257`, `679f204`, `df2ceb0`, `0846fa1`
- **Files Modified:**
  - `addons/ve-geology/pages/ve-geology-home.md` (new)
  - `AGENTS.md`, `CLAUDE.md` (new), `ARCHITECTURE.md`, `SETUP.md`
  - `README.md`, `package.json`, `.gitignore`, `.eslintrc.json`, `.markdownlint.json`
  - `addons/ve-geology/pages/ve-geology-*.md` (lint fixes)
  - All template files added (`.editorconfig`, `.husky/`, `.github/`, `.claude/`, `docs/`, `tools/`, etc.)

### 2026-03-30-01

- **Agent:** Claude Sonnet 4.6
- **Subject:** USGS HANS API integration, security fixes, GitHub issue tracking
- **Work Done:**
  - Created `import/import-hans.js` — fetches elevated + monitored volcanoes and daily synopsis, writes `activity.json`
  - Created `HansDataManager.js` — loads snapshot, lookup by GVP volcano number, filter by alert level/color code/observatory
  - Created `HansAlertPlugin.js` — `[{HansAlerts}]` plugin with ORANGE/YELLOW/RED/GREEN color-coded badges, supports `alertLevel=`, `colorCode=`, `observatory=` filters
  - Added HANS API routes: `/hans/elevated`, `/hans/volcano/:number`, `/hans/status`
  - Wired HansDataManager and HansAlertPlugin into `index.js` register/status/shutdown
  - Added HANS CSS styles to `ve-geology.css`
  - Created `pages/ve-geology-hans.md` (slug: `volcano-alerts`)
  - Added `npm run import:hans` script
  - Live test: Kilauea WATCH/ORANGE, Great Sitkin WATCH/ORANGE, Atka ADVISORY/YELLOW, Shishaldin ADVISORY/YELLOW
  - Fixed ngdpbase security vulnerabilities: handlebars 4.7.9, path-to-regexp 8.4.0, brace-expansion 2.0.3, yaml 2.8.3 via `npm update`
  - Filed and closed ngdpbase#413 (security)
  - Filed ve-geology#3 (HANS) — closed on completion
  - Filed ve-geology#4 (NASA FIRMS), #5 (VAACs), #6 (satellite monitoring), #7 (VolcanoDiscovery)
  - Filed ve-geology#8 (periodic refresh via BackgroundJobManager)
  - Filed ngdpbase#412 (admin addons panel)
  - Audited all data sources vs volcano-lists reference docs
  - Created root `README.md` and updated `addons/ve-geology/README.md` with earthquake and HANS content
- **Commits:** `b89cc91`, `52c23cf`, `905469e1` (ngdpbase)
- **Files Modified:**
  - `addons/ve-geology/import/import-hans.js` (new)
  - `addons/ve-geology/managers/HansDataManager.js` (new)
  - `addons/ve-geology/plugins/HansAlertPlugin.js` (new)
  - `addons/ve-geology/pages/ve-geology-hans.md` (new)
  - `addons/ve-geology/routes/api.js`
  - `addons/ve-geology/index.js`
  - `addons/ve-geology/public/css/ve-geology.css`
  - `package.json`
  - `README.md` (new), `addons/ve-geology/README.md`
  - `ngdpbase/package-lock.json` (security fixes)

### 2026-03-29-01

- **Agent:** Claude Sonnet 4.6
- **Subject:** Initial scaffold, GVP + earthquake data, plugins, wiki pages, favicon, bug fixes
- **Work Done:**
  - Scaffolded ve-geology addon following ngdpbase `addons/template/` pattern
  - Created `VolcanoDataManager.js` — loads volcanoes.json + eruptions.json, search/filter/distinct
  - Created `EarthquakeDataManager.js` — loads earthquakes.json, Haversine proximity matching
  - Created 6 plugins: `VolcanoInfobox`, `VolcanoList`, `VolcanoSearch`, `VolcanoMap`, `EarthquakeList`, `EarthquakeMap`
  - Created `routes/api.js` — volcano search, distinct, single volcano, eruptions, earthquake search, near-volcano, status
  - Created `import/import-volcanoes.js` — GVP WFS API, Holocene + Pleistocene, `--eruptions`, `--activity` flags
  - Created `import/import-earthquakes.js` — USGS feeds, Haversine proximity, `--feed=` flag
  - Added GVP number links to Smithsonian (`https://volcano.si.edu/volcano.cfm?vn=`)
  - Created 4 demo wiki pages in `addons/ve-geology/pages/` (volcanoes, earthquakes, demo, japan)
  - Set ngdpbase to port 3333
  - Updated volcano theme favicon (SVG with radial glow, lava sparks, cone gradient)
  - Fixed ngdpbase bugs during development:
    - ngdpbase#407 — external addon repos need own `package.json` + `npm install`
    - ngdpbase#408 — `getAddonConfig()` rewritten to scan flat dot-notation keys via `getAllProperties()`
    - ngdpbase#409 — favicon override fixed via `getCustomProperty()` in ConfigurationManager
    - ngdpbase#410 — `AddonsManager.seedAddonPages()` implemented (Option B for addon wiki pages)
  - Added `ConfigurationManager.getCustomProperty()` — returns value only if explicitly set in custom config
  - Added `getAllProperties()` to ConfigurationManager
  - Updated `header.ejs` for SVG favicon `type` attribute
  - Completed ngdpbase install wizard, imported all data, verified API responses
- **Commits:** `ca8eae0`, `2e10640`, `5f1c215`, `c94f4b2`
- **Files Modified:**
  - `addons/ve-geology/index.js` (new)
  - `addons/ve-geology/managers/VolcanoDataManager.js` (new)
  - `addons/ve-geology/managers/EarthquakeDataManager.js` (new)
  - `addons/ve-geology/plugins/*.js` (6 new plugins)
  - `addons/ve-geology/routes/api.js` (new)
  - `addons/ve-geology/import/import-volcanoes.js` (new)
  - `addons/ve-geology/import/import-earthquakes.js` (new)
  - `addons/ve-geology/public/css/ve-geology.css` (new)
  - `addons/ve-geology/pages/*.md` (4 new pages)
  - `package.json`
  - `ngdpbase/src/managers/AddonsManager.ts`
  - `ngdpbase/src/managers/ConfigurationManager.ts`
  - `ngdpbase/src/routes/WikiRoutes.ts`
  - `ngdpbase/views/header.ejs`
  - `ngdpbase/themes/volcano/assets/favicon.svg`
  - `ngdpbase/data/config/app-custom-config.json`
