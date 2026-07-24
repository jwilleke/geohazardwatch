# syntax=docker/dockerfile:1.25

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

ARG NGDPBASE_VERSION=3.64.0
FROM ghcr.io/jwilleke/ngdpbase:${NGDPBASE_VERSION}

LABEL org.opencontainers.image.title="geohazardwatch"
LABEL org.opencontainers.image.description="Volcano and geology platform built on ngdpbase with the geohazardwatch addon"
LABEL org.opencontainers.image.source="https://github.com/jwilleke/geohazardwatch"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

ARG GEOHAZARDWATCH_ADDON_VERSION
COPY .npmrc ./

# Installs the addon as an ordinary npm dependency into /app/node_modules,
# where ngdpbase's `node_modules:@jwilleke/*-addon` addons-path glob finds
# it. The GitHub token is mounted only for this RUN step (BuildKit secret)
# and is never written to an image layer; .npmrc is removed in the same
# layer once the install completes.
RUN --mount=type=secret,id=github_token \
    NODE_AUTH_TOKEN="$(cat /run/secrets/github_token)" \
    npm install "@jwilleke/geohazardwatch-addon@${GEOHAZARDWATCH_ADDON_VERSION}" --omit=dev && \
    rm -f .npmrc
