#!/usr/bin/env bash
# Pregătește harta României pentru rutare pe jos (OSRM). O singură dată, ~10–15 minute, câțiva GB de RAM.
# Folosește fișierul descărcat de import-places.sh (data/osm/romania-latest.osm.pbf).
# După asta: docker compose up -d osrm
set -euo pipefail
cd "$(dirname "$0")/.."   # folderul backend/

PBF="data/osm/romania-latest.osm.pbf"
IMAGE="ghcr.io/project-osrm/osrm-backend"
if [ ! -f "$PBF" ]; then
  echo "Lipsește $PBF. Rulează întâi ./scripts/import-places.sh" >&2
  exit 1
fi

run() { docker run --rm -t -v "$PWD/data/osm:/data" "$IMAGE" "$@"; }

echo "→ 1/3 Extrag străzile pentru mers pe jos (profilul foot)…"
run osrm-extract -p /opt/foot.lua /data/romania-latest.osm.pbf
echo "→ 2/3 Partiționez…"
run osrm-partition /data/romania-latest.osrm
echo "→ 3/3 Personalizez…"
run osrm-customize /data/romania-latest.osrm

echo "Gata. Pornește serverul de rutare cu: docker compose up -d osrm"
