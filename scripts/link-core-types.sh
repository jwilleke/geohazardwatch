#!/usr/bin/env bash
# Give addons/geohazardwatch/.ngdpbase-src (gitignored) ngdpbase's dist/src,
# which the add-on's tsconfig maps `#ngdpbase/*` to (geohazardwatch#292). The
# add-on imports core for types only, so this is needed to typecheck and build,
# never at run time.
#
# Where core comes from, first match wins:
#   - NGDPBASE_DIST_SRC, a built ngdpbase's dist/src;
#   - dist/src at the repository root: publish.yml builds ngdpbase at
#     ngdpbase.minVersion and links it there;
#   - the ghcr.io/jwilleke/ngdpbase:<version>-devtools image, when Docker is
#     present. <version> is NGDPBASE_VERSION, else the add-on's
#     ngdpbase.minVersion;
#   - ../ngdpbase/dist/src, a sibling checkout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADDON="$ROOT/addons/geohazardwatch"
LINK="$ADDON/.ngdpbase-src"

rm -rf "$LINK"

if [[ -n "${NGDPBASE_DIST_SRC:-}" ]]; then
  ln -sfn "$NGDPBASE_DIST_SRC" "$LINK"
  echo "link-core-types: ngdpbase from $NGDPBASE_DIST_SRC"
  exit 0
fi

if [[ -d "$ROOT/dist/src" ]]; then
  ln -sfn "$ROOT/dist/src" "$LINK"
  echo "link-core-types: ngdpbase from $ROOT/dist/src"
  exit 0
fi

VER="${NGDPBASE_VERSION:-}"
if [[ -z "$VER" ]]; then
  VER="$(node -p "require('$ADDON/package.json').ngdpbase.minVersion")"
fi

if command -v docker >/dev/null 2>&1; then
  IMAGE="ghcr.io/jwilleke/ngdpbase:${VER}-devtools"
  docker pull --platform linux/amd64 "$IMAGE"
  cid="$(docker create --platform linux/amd64 "$IMAGE")"
  docker cp "$cid:/app/dist/src" "$LINK"
  docker rm "$cid" >/dev/null
  echo "link-core-types: ngdpbase $VER from $IMAGE"
  exit 0
fi

DIST_SRC="$ROOT/../ngdpbase/dist/src"
if [[ ! -d "$DIST_SRC" ]]; then
  echo "link-core-types: no NGDPBASE_DIST_SRC, no dist/src at the repository root, no Docker, and no ngdpbase at $DIST_SRC" >&2
  echo "  Set NGDPBASE_DIST_SRC, or install Docker to pull ghcr.io/jwilleke/ngdpbase:${VER}-devtools" >&2
  exit 1
fi
ln -sfn "$DIST_SRC" "$LINK"
echo "link-core-types: ngdpbase from $DIST_SRC (a sibling checkout, whatever version it is)"
