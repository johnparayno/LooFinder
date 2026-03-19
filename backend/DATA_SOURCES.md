# Public Data Sources for LooFinder

The seed script loads toilet data from multiple public sources and merges them with deduplication by location.

## 1. FindToilet API (Primary) – same data as findtoilet.dk

- **URL**: https://beta.findtoilet.dk/api/v3/toilets
- **Region**: All Denmark (98 municipalities)
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

## 3. opendata.dk Aarhus (optional)

- **Dataset**: https://www.opendata.dk/city-of-aarhus/toiletter-i-aarhus-kommune
- **Format**: GeoJSON, WFS
- **License**: CC-BY-4.0
- **Note**: Tried when available; merged with deduplication

## 4. OpenStreetMap (Overpass API) – supplement

- **API**: https://overpass-api.de/api/interpreter
- **Query**: `amenity=toilets` in Denmark (bbox 54.55,8.0,57.75,15.2)
- **License**: ODbL (attribution required)
- **Fields**: name, addr:street, addr:city, opening_hours, fee, access, wheelchair
- **Note**: Adds cafés, restaurants, gas stations, etc. with toilets. Merged with deduplication; verification_status: unverified

## 5. Embedded Data (Fallback)

When external APIs fail, the seed uses:
- 8 sample public toilets in Copenhagen

## 6. Hotel Lobbies, Cafés, Restaurants, Fast Food & Restaurant Chains (Always Included)

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
