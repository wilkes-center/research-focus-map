# How to Update Research Map Data

## Easy Method: Replace the CSV File

1. **Replace your data**: Place the new CSV file at `public/ResearchFocus.csv`
2. **Run the update**: Type `node geocoder.js` in terminal
3. **Done!** Your map will automatically update

## CSV File Requirements

Your CSV needs these columns:
- **Name** - Researcher name
- **Geographic Focus (Data)** - Address or coordinates  
- **Map** - Type: "campus", "utah", or "world"
- **Department** - Department name

### For coordinates: 
Use format `latitude, longitude` like `40.7608, -111.8910`

### For addresses:
Use full address like `123 Main St, Salt Lake City, UT`

## If You Have Pre-Geocoded Data

Replace these 2 files with your data:
- `public/geocoded-addresses.json`
- `src/data/geocodedAddresses.ts`

Both files must have the same data in this format:
```json
{
  "Your Address Here": {
    "address": "Your Address Here",
    "lat": 40.7608,
    "lng": -111.8910,
    "mapCategory": "campus",
    "method": "external",
    "timestamp": "2025-08-19T15:00:00.000Z"
  }
}
```
