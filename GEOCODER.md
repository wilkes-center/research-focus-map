# Geocoder Tool

This project includes a separate geocoder tool that pre-processes all addresses from the CSV file to avoid geocoding them every time the application runs.

## How it works

The geocoder:
1. Reads the CSV file (`public/ResearchFocus1.csv`)
2. Extracts all addresses that need geocoding (Campus addresses)
3. Handles coordinate strings directly (World/Utah addresses)
4. Uses the Mapbox Geocoding API to geocode Campus addresses
5. Saves all results to `geocoded-addresses.json`
6. The main application then loads this pre-geocoded data instead of making API calls

## Setup

1. Set your Mapbox token as an environment variable:
```bash
export MAPBOX_TOKEN=your_mapbox_token_here
```

Or copy it from your `.env` file:
```bash
export MAPBOX_TOKEN=$(grep REACT_APP_MAPBOX_TOKEN .env | cut -d '=' -f2)
```

## Usage

### Run the geocoder
```bash
npm run geocode
```

Or run it directly:
```bash
node geocoder.js
```

### Check geocoded addresses
```bash
npm run geocode:check
```

## Features

- **Incremental processing**: Only geocodes addresses that haven't been processed yet
- **Progress saving**: Saves progress after each batch in case of interruption
- **Rate limiting**: Respects API limits with delays between batches
- **Fallback handling**: Uses campus center coordinates for failed geocoding attempts
- **Detailed logging**: Shows progress and statistics during processing

## Output

The geocoder creates a `geocoded-addresses.json` file with the following structure:

```json
{
  "address_string": {
    "address": "315 S 1400 E, SALT LAKE CITY, UT 84112",
    "lat": 40.764123,
    "lng": -111.843456,
    "mapCategory": "campus",
    "method": "geocoded",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Methods

- `coordinates`: Direct coordinate parsing (World/Utah addresses)
- `geocoded`: Successfully geocoded via Mapbox API
- `fallback`: Failed geocoding, using campus center coordinates

## Integration

The main application automatically loads the pre-geocoded data from `geocoded-addresses.json`. If the file doesn't exist, it will fall back to the original geocoding behavior.

## Benefits

- **Faster loading**: No API calls during application startup
- **Offline capability**: Works without internet once addresses are geocoded
- **Cost reduction**: Reduces Mapbox API usage
- **Reliability**: Eliminates geocoding failures during application use
- **Caching**: Persistent storage of geocoded results 