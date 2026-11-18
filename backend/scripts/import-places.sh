#!/usr/bin/env bash
# Importă locurile din OpenStreetMap în tabela `places` (o singură dată; rulează din nou pentru date noi).
#   ./scripts/import-places.sh                  → România
#   ./scripts/import-places.sh europe/hungary   → altă regiune de pe https://download.geofabrik.de
# Ai nevoie de: osmium (sudo apt install osmium-tool), Docker cu baza pornită, backend-ul OPRIT.
set -euo pipefail
cd "$(dirname "$0")/.."   # folderul backend/

REGION="${1:-europe/romania}"
NAME="$(basename "$REGION")"
DIR="data/osm"
mkdir -p "$DIR"

# Fără download din nou: ./scripts/import-places.sh păstrează fișierul .osm.pbf deja descărcat.
# 1. Harta regiunii (~300 MB pentru România), descărcată o singură dată
if [ ! -f "$DIR/$NAME-latest.osm.pbf" ]; then
  echo "→ Descarc $REGION de pe Geofabrik…"
  curl -L --fail -o "$DIR/$NAME-latest.osm.pbf" "https://download.geofabrik.de/$REGION-latest.osm.pbf"
fi

# 2. Păstrăm doar tipurile de locuri care ne interesează (vezi PoiKind.java)
echo "→ Filtrez locurile…"
osmium tags-filter "$DIR/$NAME-latest.osm.pbf" \
  nwr/amenity=cafe,ice_cream,restaurant,bar,pub,biergarten,marketplace,fountain,place_of_worship,theatre,arts_centre \
  nwr/tourism=museum,gallery,artwork,attraction,viewpoint \
  nwr/place=square \
  nwr/historic \
  nwr/leisure=park,garden \
  nwr/building=cathedral,church,chapel,palace,castle \
  --overwrite -o "$DIR/$NAME-pois.osm.pbf"

# 3. GeoJSON, un loc pe linie, cu id-ul din OSM (n123 / w456 / r789)
echo "→ Export GeoJSON…"
osmium export "$DIR/$NAME-pois.osm.pbf" -f geojsonseq --add-unique-id=type_id \
  --overwrite -o "$DIR/$NAME-pois.geojsonseq"

# 4. Importul în Postgres (după import, serverul rămâne pornit ca de obicei)
echo "→ Import în baza de date…"
mvn spring-boot:run -Dspring-boot.run.arguments="--import-places=$PWD/$DIR/$NAME-pois.geojsonseq"
