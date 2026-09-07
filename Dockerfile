# syntax=docker/dockerfile:1.27

# geohazardwatch — ngdpbase + geohazardwatch addon (packaged/npm model, #152)
#
# The geohazardwatch addon ships as a published npm package
# (@jwilleke/geohazardwatch-addon) rather than being copied into the image.
# This keeps the ngdpbase base-image pin (NGDPBASE_VERSION, above) and the
# addon package pin on independent, Renovate-tracked versions — see
# ngdpbase's docs/platform/deployment/addon-packaged.md.
#
# Imported volcano/quake/HANS data lives on a persistent volume mounted at
# /app/data — NOT baked into the image — so a CronJob can refresh it
# without rebuilding.
#
# NOTE: the running instance's addons-path config (app-custom-config.json,
# set via the runtime ConfigMap, not here) must include
# "node_modules:@jwilleke/*-addon" for this image to actually load the addon.
#
# Two stages, not one: ngdpbase#956 removed npm/npx from the ngdpbase
# runtime image entirely (as of NGDPBASE_VERSION >= 3.70.3) — reasonable
# for ngdpbase's own runtime, which never shells out to npm, but this
# repo's "packaged/npm model" needs npm to install the addon package at
# build time. ngdpbase#1001/v4.0.0 added an official `-devtools` tag
# (npm restored, not for deployment) precisely for this — the installer
# stage below builds FROM that instead of a generic Node image, so it
# stays in lockstep with ngdpbase's own Node version automatically. Only
# its node_modules gets copied into the plain (npm-free) runtime stage.

ARG NGDPBASE_VERSION=4.16.5

# =============================================================================
# Stage 1: addon-installer — ngdpbase's own devtools variant (has npm)
# =============================================================================
FROM ghcr.io/jwilleke/ngdpbase:${NGDPBASE_VERSION}-devtools AS addon-installer

WORKDIR /app

ARG GEOHAZARDWATCH_ADDON_VERSION
COPY .npmrc ./

# Installs the addon as an ordinary npm dependency into /app/node_modules.
# The GitHub token is mounted only for this RUN step (BuildKit secret) and
# is never written to an image layer; .npmrc is removed in the same layer
# once the install completes.
#
# The addon ships its source as .ts (see package.json "files"); this stage
# compiles it to .js before stage 2 copies node_modules into the runtime
# image. typescript and @types/* aren't dependencies of the addon package
# itself — only needed here, at image-build time — and tsconfig.json's
# strict mode + "types": ["node"] means tsc needs both @types/node and
# @types/express resolvable to compile at all.
#
# This base image's -devtools variant was itself built with `npm ci
# --omit=dev`, so even though its own package.json declares a
# `typescript` devDependency, `npm install typescript` inside /app just
# re-validates that already-declared (but omitted) spec instead of
# installing it — and `--include=dev` would pull ngdpbase's entire
# ~300-package dev toolchain just for tsc. Installed instead into an
# isolated throwaway project (/tmp/tsbuild) that has no lockfile/omit-dev
# baggage of its own; its @types/* are copied into /app/node_modules/@types
# so tsc's default typeRoots resolution (walking up from the compiled
# files) finds them, then removed after compiling so stage 2's COPY
# doesn't bake them into the runtime image.
RUN --mount=type=secret,id=github_token \
    NODE_AUTH_TOKEN="$(cat /run/secrets/github_token)" \
    npm install "@jwilleke/geohazardwatch-addon@${GEOHAZARDWATCH_ADDON_VERSION}" --omit=dev && \
    mkdir -p /tmp/tsbuild && cd /tmp/tsbuild && npm init -y >/dev/null && \
    npm install --no-save typescript@6 @types/node @types/express && \
    cd /app && \
    mkdir -p node_modules/@types && cp -r /tmp/tsbuild/node_modules/@types/. node_modules/@types/ && \
    ln -sfn /app/dist/src /app/node_modules/@jwilleke/geohazardwatch-addon/.ngdpbase-src && \
    /tmp/tsbuild/node_modules/.bin/tsc -p /app/node_modules/@jwilleke/geohazardwatch-addon/tsconfig.json && \
    rm -rf node_modules/@types /tmp/tsbuild && \
    rm -f .npmrc

# =============================================================================
# Stage 2: runtime — ngdpbase base image, no npm needed or present
# =============================================================================
FROM ghcr.io/jwilleke/ngdpbase:${NGDPBASE_VERSION}

LABEL org.opencontainers.image.title="geohazardwatch"
LABEL org.opencontainers.image.description="Volcano and geology platform built on ngdpbase with the geohazardwatch addon"
LABEL org.opencontainers.image.source="https://github.com/jwilleke/geohazardwatch"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Merges the addon-installer's node_modules (the addon + its own deps, e.g.
# express) into the runtime image's existing node_modules from ngdpbase's
# own build — the trailing `/.` copies contents into the destination
# rather than replacing it, so ngdpbase's own dependencies are preserved.
# ngdpbase's `node_modules:@jwilleke/*-addon` addons-path glob finds the
# addon here exactly as before.
COPY --from=addon-installer /app/node_modules/. ./node_modules/
