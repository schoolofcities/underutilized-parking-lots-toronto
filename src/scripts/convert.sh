# convert geojson to pmtiles
input="../data/parking-lots-residential.geojson"
output="../../static/ParkingLotAreaResidential.pmtiles"

# tippecanoe -zg -o "$output" --drop-densest-as-needed --extend-zooms-if-still-dropping "$input" --force

# drop less
tippecanoe -zg -o "$output" --no-feature-limit --extend-zooms-if-still-dropping "$input" --force