# Public Data Sources for LooFinder

The seed script loads toilet data from the following public sources (in priority order):

## 1. FindToilet API (Primary)

- **URL**: https://beta.findtoilet.dk/api/v3/toilets?term_id=2
- **Region**: Copenhagen (term_id=2)
- **Format**: JSON with `toilets` array
- **License**: Public data from Danish municipalities
- **Fields**: name, address, lat/long, payment type

## 2. opendata.dk (Copenhagen Toilets TMF)

- **Dataset**: https://www.opendata.dk/city-of-copenhagen/toiletter-tmf
- **Format**: GeoJSON
- **License**: CC0 (public domain)
- **Fields**: coordinates, name, address, opening hours
- **Note**: Used as fallback when FindToilet API is unavailable

## 3. Embedded Data (Fallback)

When external APIs fail, the seed uses:
- 8 sample public toilets in Copenhagen
- 22 cafés (purchase_required, 4-digit access code)
- 8 McDonald's locations (code_required, 4-digit access code)
