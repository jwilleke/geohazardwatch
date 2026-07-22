# Contributing

Thank you for your interest in contributing to this project! This document provides guidelines for developers and AI agents working on this codebase. All contributions must follow [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md).

## Before You Start

- Read [GLOBAL-CODE-PREFERENCES.md](GLOBAL-CODE-PREFERENCES.md) for overarching project principles
- Read [AGENTS.md](./AGENTS.md) for project context and status
- Review [CODE_STANDARDS.md](./CODE_STANDARDS.md) for coding guidelines
- Check [SECURITY.md](./SECURITY.md) for security practices
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Making Changes](#making-changes)
  - [Renaming the addon ID](#renaming-the-addon-id)
- [Commit Guidelines](#commit-guidelines)
- [Pull Requests](#pull-requests)
- [Code Review Process](#code-review-process)

## Getting Started

See [SETUP.md](./SETUP.md) for complete installation and setup instructions including prerequisites, cloning, dependency installation, environment configuration, and verification steps.

## Development Workflow

### Read Project Context First

Before starting work, read `AGENTS.md` to understand:

- Project goals and current status
- Architecture and tech stack
- Known blockers or issues
- Priority tasks

Use the slash command:

```bash
/context
```

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/bug-description
```

Branch naming: `type/description`

### Make Changes

Follow [CODE_STANDARDS.md](./CODE_STANDARDS.md) for all code conventions including TypeScript strict mode, naming conventions, formatting rules, and the DRY principle.

## Making Changes

### Linting and Formatting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

### Testing

```bash
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Check coverage
```

### Renaming the addon ID

The addon's identity is the `name:` field at the top of `addons/geohazardwatch/index.js`. It's referenced by string in **downstream config repos**, not just here — most importantly in `jwilleke/mj-infra-flux/apps/production/geohazardwatch/configmap.yaml`, which gates the addon at boot via `ngdpbase.addons.<id>.enabled`.

Renaming the field here without updating downstream configs will silently disable the addon in production: `AddonsManager` discovers the renamed addon by directory but doesn't find the matching `enabled` key under its new name, so plugins and managers register zero. This actually happened on 2026-05-10 — see [`jwilleke/ngdpbase#671`](https://github.com/jwilleke/ngdpbase/issues/671) for the post-mortem.

Before merging an addon-rename PR:

- [ ] Update `addons/<dir>/index.js` `name:` field to the new id
- [ ] Update `addons/<dir>/package.json` `name` field
- [ ] Search every downstream config repo for the **old** id:

  ```bash
  gh search code "ngdpbase.addons.<old-id>" --owner jwilleke
  ```

  Every match needs a follow-up commit in that repo before this addon's next image deploys. Today the only known consumer is `jwilleke/mj-infra-flux`, but new clusters / forks may add others.

- [ ] Mention the downstream impact and the linked downstream PR(s) in this PR's description, so the reviewer can confirm the follow-up landed
- [ ] Bump `package.json` version with **major** semver (per the conventional-commits `!`) — addon-id renames are breaking changes for any consumer that names the addon by string
- [ ] Use the conventional-commits `!` marker on the rename commit (e.g., `refactor!: rename addon id from foo to bar`)

After merge, before the new image lands in production:

- [ ] Open the corresponding `mj-infra-flux` PR with the matching configmap change (rename `ngdpbase.addons.<old-id>` keys to `ngdpbase.addons.<new-id>`)
- [ ] Coordinate the merge order: the configmap PR must reach the cluster **before** (or simultaneously with) the new image. Easiest path is to merge `mj-infra-flux` first; Flux will reconcile the configmap, then the next addon image deploy lands cleanly.

The `addon-rename-detector` GitHub Actions workflow (`.github/workflows/addon-rename-detector.yml`) runs on every push and PR. It diffs the addon's `name:` field against the previous tag and posts a check-run failure if it detects a rename without an accompanying downstream update. The CI is the safety net; this checklist is the dev-time discipline.

A complementary safety net runs at **boot time** in `ngdpbase` itself ([`jwilleke/ngdpbase#672`](https://github.com/jwilleke/ngdpbase/issues/672), shipped in v3.13.1): if a deploy ends up with `ngdpbase.addons.<old-id>.enabled = true` after an addon rename, ngdpbase refuses to start with a clear error pointing at the stale key. So even if both this checklist and the CI are missed, the worst case is "pod refuses to start" rather than "site silently broken."

## Commit Guidelines

**All commit messages must follow the format specified in [CODE_STANDARDS.md - Git Commit Messages](./CODE_STANDARDS.md#git-commit-messages).**

This includes:

- Conventional commits format (type, scope, description)
- Required types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Pre-commit hooks that enforce linting standards

## Pull Requests

### Before Creating a PR

1. Update branch: `git fetch origin && git rebase origin/master`
2. Run tests: `npm run lint && npm run test && npm run build`
3. Update [AGENTS.md](./AGENTS.md) if making significant changes

### PR Checklist

- [ ] Code follows [CODE_STANDARDS.md](./CODE_STANDARDS.md)
- [ ] Tests pass
- [ ] Linting passes
- [ ] No hardcoded secrets
- [ ] Commit messages follow [CODE_STANDARDS.md conventions](./CODE_STANDARDS.md#git-commit-messages)
- [ ] [AGENTS.md](./AGENTS.md) updated if applicable

## Code Review Process

- Be respectful and constructive
- Review promptly
- Approve when satisfactory
- All CI checks must pass before merging

## Questions?

- Check AGENTS.md for project context
- Read CODE_STANDARDS.md for guidelines
- Open an issue for questions
