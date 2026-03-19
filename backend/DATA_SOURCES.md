# Public Data Sources for LooFinder

The seed script loads toilet data from multiple public sources across **ALL DENMARK** and merges them with deduplication by location. Coverage spans all five regions: Hovedstaden, Sjælland, Syddanmark, Midtjylland, and Nordjylland.

## 1. FindToilet API (Primary) – ALL DENMARK

- **URL**: https://beta.findtoilet.dk/api/v3/toilets
- **Region**: All Denmark (98 municipalities, 27+ participating)
- **Format**: JSON with `toilets` array
- **License**: Public data from Danish municipalities
- **Fields**: nid, title, location (street, city, postal_code, lat, long), type (handicap/pissoir/unisex), payment, manned, changing_table, tap, needle_container, contact, images, description (Placering, Åbningstider, Helårsåbent, Døgnåbent)
- **Images**: First image URL stored when available
- **Crawl**: Full API is fetched first. If it fails or returns no data, the seed crawls each municipality individually (`?tid=1` through `?tid=98`). Results are deduplicated by `findtoilet_nid`. Retries (3x) on fetch failure.

## 2. opendata.dk Copenhagen (WFS) – supplement

- **TMF toilets**: https://wfs-kbhkort.kk.dk/k101/ows (typeName: toilet_puma_agg_tmf_kk)
- **Other administrations**: typeName: toilet_puma_agg_andre_kk
- **Format**: GeoJSON via WFS
- **License**: CC0 (public domain)
- **Fields**: toilet_lokalitet, vejnavn_husnummer, postnummer, toilet_betegnelse, handicapadgang, aabningstid_doegn, aabningsperiode, status
- **Note**: Merged with FindToilet; duplicates removed by location (~11m)

## 3. opendata.dk Aarhus – supplement

- **Offentlige toiletter + Bytoiletter**: webkort.aarhuskommune.dk/spatialmap (GeoJSON)
- **Format**: GeoJSON
- **License**: CC-BY-4.0
- **Note**: Merged with deduplication

## 4. opendata.dk Frederiksberg – supplement

- **URL**: gc2ekstern.frederiksberg.dk/api/v2/sql (GeoJSON)
- **Format**: GeoJSON
- **License**: CC-BY-4.0
- **Note**: Merged with deduplication

## 5. opendata.dk Vejle – supplement

- **URL**: kortservice.vejle.dk/gis/rest/services/OPENDATA (ArcGIS REST, f=geojson)
- **Format**: GeoJSON via ArcGIS REST API
- **License**: CC-BY-4.0
- **Note**: Merged with deduplication

## 6. OpenStreetMap (Overpass API) – ALL DENMARK supplement

- **API**: https://overpass-api.de/api/interpreter
- **Query**: `amenity=toilets` and `building=toilets` in Denmark (bbox 54.55,8.0,57.75,15.2)
- **Coverage**: Nationwide – ~5000+ toilets across all regions
- **License**: ODbL (attribution required)
- **Fields**: name, addr:street, addr:city, opening_hours, fee, access, wheelchair
- **Note**: Adds cafés, restaurants, gas stations, etc. with toilets. Merged with deduplication; verification_status: unverified

## 7. Embedded Data (Fallback)


When external APIs fail, the seed uses:
- 8 sample public toilets in Copenhagen

## 8. Hotel Lobbies, Cafés, Restaurants, Fast Food, Gyms, Swimming Pools, Sports Halls (Always Included)

These are always merged into the database regardless of API success:
- 22 hotel lobbies in Copenhagen (free – lobby toilets)
- 22 cafés in Copenhagen (purchase_required – a buy is required)
- 18 restaurants in Copenhagen (purchase_required – a buy is required)
- 8 McDonald's locations in Denmark (purchase_required – a buy is required)
- 13 Burger King locations in Denmark (purchase_required – a buy is required)
- 12 KFC locations in Denmark (purchase_required – a buy is required)
- 11 Subway locations in Denmark (purchase_required – a buy is required)
- Restaurant chains: Sticks'n'Sushi (12), Lagkagehuset (11), Ole & Steen (1), Joe and the Juice (4), MASH (6), A Hereford Beefstouw (6), Jensen's Bøfhus (12) – all purchase_required
- 18 Michelin and notable restaurants (Geranium, Alchemist, Kong Hans Kælder, Søllerød Kro, formel B, Jordnær, Frederikshøj, Domestic, Substans, Henne Kirkeby Kro, Dragsholm Slot, Hotel Frederiksminde, LYST, Ti Trin Ned, Syttende, ARO, Kiin Kiin, Sushi Anaba) – all purchase_required
- Gyms (PureGym, FitnessX, CrossFit) – purchase_required (membership required)
- Swimming pools – purchase_required (entry fee)
- Sports halls – free access
