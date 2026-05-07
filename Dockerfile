# geohazardwatch — ngdpbase + ve-geology addon
#
# Layered on top of the upstream ngdpbase image. The ve-geology addon code
# is copied into /opt/geohazardwatch/ and registered with ngdpbase via the
# addons-path config setting (set in the runtime ConfigMap, not here).
#
# Imported volcano/quake/HANS data lives on a persistent volume mounted at
# /app/data — NOT baked into the image — so a CronJob can refresh it
# without rebuilding.

ARG NGDPBASE_VERSION=3.9.0
FROM ghcr.io/jwilleke/ngdpbase:${NGDPBASE_VERSION}

LABEL org.opencontainers.image.title="geohazardwatch"
LABEL org.opencontainers.image.description="Volcano and geology platform built on ngdpbase with the ve-geology addon"
LABEL org.opencontainers.image.source="https://github.com/jwilleke/geohazardwatch"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /opt/geohazardwatch

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY addons ./addons
COPY src ./src
COPY tools ./tools

WORKDIR /app
