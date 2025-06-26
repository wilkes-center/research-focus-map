# Research Focus Map

An interactive map application built with React, TypeScript, and Mapbox that visualizes research focus areas for various students. The map displays different research locations with color-coded markers based on research categories.

## Features

- Interactive map with research area markers
- Category-based filtering (Ecology, Geology, Climate, Art/Environment, Forestry)
- Clickable markers with detailed information popups
- Color-coded markers by research category
- Responsive design
- **Pre-geocoded addresses** - Fast loading with no API calls during runtime

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Mapbox token:**
   - Create a free account at [Mapbox](https://www.mapbox.com/)
   - Get your access token from the Mapbox dashboard
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Replace `your_mapbox_access_token_here` with your actual Mapbox token

3. **Pre-geocode addresses (optional but recommended):**
   ```bash
   # Set your Mapbox token for the geocoder
   export MAPBOX_TOKEN=$(grep REACT_APP_MAPBOX_TOKEN .env | cut -d '=' -f2)
   
   # Run the geocoder to pre-process all addresses
   npm run geocode
   ```
   
   This step geocodes all campus addresses and saves them to `geocoded-addresses.json`. The application will load much faster and won't make API calls during runtime.

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Geocoder Tool

This project includes a separate geocoder tool that pre-processes all addresses to avoid geocoding them every time the application runs. See [GEOCODER.md](./GEOCODER.md) for detailed documentation.

### Quick Start with Geocoder
```bash
# Check if addresses are already geocoded
npm run geocode:check

# Run the geocoder if needed
npm run geocode
```

## Data Sources

The application reads research data from `public/ResearchFocus1.csv` which contains:
- Researcher information
- Project details
- Geographic focus areas
- Department affiliations
- Collaboration details

## Technology Stack

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Mapbox GL JS** - Interactive maps
- **react-map-gl** - React wrapper for Mapbox
- **Papa Parse** - CSV parsing
- **Node.js** - Geocoder tool

## Project Structure

```
src/
├── components/          # React components
│   ├── MapComponent.tsx # Main map component
│   └── FilterComponent.tsx # Filter sidebar
├── utils/              # Utility functions
│   ├── csvParser.ts    # CSV parsing and geocoding
│   └── mapUtils.ts     # Map-related utilities
├── types/              # TypeScript type definitions
│   └── ResearchArea.ts # Research area interface
├── App.tsx             # Main app component
└── index.tsx           # App entry point

geocoder.js             # Standalone geocoder tool
geocoded-addresses.json # Pre-geocoded address data (generated)
public/
└── ResearchFocus1.csv  # Research data source
```

## Performance Optimization

- **Pre-geocoding**: Addresses are geocoded once and cached
- **Batch processing**: Efficient handling of multiple addresses
- **Memory caching**: Fast access to frequently used coordinates
- **Fallback handling**: Graceful degradation for missing data

## Research Areas

The application displays the following research areas:

- **Great Salt Lake** (Ecology) - Research on water levels and ecosystem
- **Canyonlands** (Geology) - Study of geological formations
- **Bonneville Salt Flats** (Climate) - Climate impact on salt crust
- **Olympic Park** (Ecology) - Wildlife monitoring and conservation
- **Moab** (Geology) - Soil erosion and land use
- **Spiral Jetty** (Art/Environment) - Art and environmental change
- **Rocky Mountain** (Forestry) - Forest health and fire risk