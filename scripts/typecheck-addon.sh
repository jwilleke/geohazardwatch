#!/usr/bin/env bash
# Typecheck addons/geohazardwatch against ngdpbase dist types (geohazardwatch#292).
# Creates addons/geohazardwatch/.ngdpbase-src → host dist/src (gitignored).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADDON="$ROOT/addons/geohazardwatch"
LINK="$ADDON/.ngdpbase-src"
VER="$(grep -E '^ARG NGDPBASE_VERSION=' "$ROOT/Dockerfile" | cut -d= -f2)"
IMAGE="ghcr.io/jwilleke/ngdpbase:${VER}-devtools"

rm -rf "$LINK"

if command -v docker >/dev/null 2>&1; then
  docker pull "$IMAGE"
  cid="$(docker create "$IMAGE")"
  docker cp "$cid:/app/dist/src" "$LINK"
  docker rm "$cid" >/dev/null
else
  DIST_SRC="${NGDPBASE_DIST_SRC:-$ROOT/../ngdpbase/dist/src}"
  if [[ ! -d "$DIST_SRC" ]]; then
    echo "typecheck-addon: no docker and no ngdpbase dist/src at $DIST_SRC" >&2
    echo "  Set NGDPBASE_DIST_SRC or install Docker to pull $IMAGE" >&2
    exit 1
  fi
  ln -sfn "$DIST_SRC" "$LINK"
fi

cd "$ADDON"
npx tsc --noEmit -p tsconfig.json
