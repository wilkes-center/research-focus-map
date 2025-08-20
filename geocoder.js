#!/usr/bin/env node
// Geocoding script for research focus map data - processes CSV addresses and converts them to coordinates using Mapbox API

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN;
const CSV_FILE_PATH = './public/ResearchFocus.csv';
const OUTPUT_FILE_PATH = './geocoded-addresses.json';
const PUBLIC_OUTPUT_PATH = './public/geocoded-addresses.json';
const TYPESCRIPT_OUTPUT_PATH = './src/data/geocodedAddresses.ts';
const BATCH_SIZE = 5;
const DELAY_MS = 200;

if (!MAPBOX_TOKEN) {
  console.error('Error: MAPBOX_TOKEN or REACT_APP_MAPBOX_TOKEN environment variable is required');
  console.error('Set it using: export MAPBOX_TOKEN=your_token_here');
  console.error('Or make sure REACT_APP_MAPBOX_TOKEN is set in your .env file');
  process.exit(1);
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

async function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const searchQuery = address.includes('Salt Lake City') || address.includes('SALT LAKE CITY') 
      ? address 
      : `${address}, Salt Lake City, Utah`;
    
    const encodedAddress = encodeURIComponent(searchQuery);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.features && parsed.features.length > 0) {
            const [lng, lat] = parsed.features[0].geometry.coordinates;
            resolve({ lat, lng, success: true });
          } else {
            resolve({ lat: null, lng: null, success: false, error: 'No results found' });
          }
        } catch (error) {
          resolve({ lat: null, lng: null, success: false, error: error.message });
        }
      });
    }).on('error', (error) => {
      resolve({ lat: null, lng: null, success: false, error: error.message });
    });
  });
}

function parseCoordinates(coordString) {
  if (!coordString || coordString.trim() === '') return null;
  
  const coords = coordString.split(',').map(coord => parseFloat(coord.trim()));
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return { lat: coords[0], lng: coords[1] };
  }
  
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAllAddresses() {
  console.log('Starting geocoding process...\n');
  
  let csvData;
  try {
    const csvText = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    csvData = parseCSV(csvText);
    console.log(`Loaded ${csvData.length} entries from CSV`);
  } catch (error) {
    console.error('Error reading CSV file:', error.message);
    process.exit(1);
  }
  
  let existingData = {};
  if (fs.existsSync(OUTPUT_FILE_PATH)) {
    try {
      const existingJson = fs.readFileSync(OUTPUT_FILE_PATH, 'utf8');
      existingData = JSON.parse(existingJson);
      console.log(`Loaded ${Object.keys(existingData).length} existing geocoded addresses`);
    } catch (error) {
      console.log('Could not load existing geocoded data, starting fresh');
    }
  }
  
  const geocodedResults = { ...existingData };
  const addressesToGeocode = [];
  
  for (const row of csvData) {
    if (!row.Name || !row['Geographic Focus (Data)'] || !row.Map || !row.Department) {
      continue;
    }
    
    const mapCategory = row.Map.toLowerCase();
    const addressData = row['Geographic Focus (Data)'];
    let needsGeocoding = false;
    let address = '';
    
    switch (mapCategory) {
      case 'world':
      case 'utah':
        const coords = parseCoordinates(addressData);
        if (coords) {
          geocodedResults[addressData] = {
            address: addressData,
            lat: coords.lat,
            lng: coords.lng,
            mapCategory,
            method: 'coordinates',
            timestamp: new Date().toISOString()
          };
        }
        break;
      case 'campus':
        address = addressData;
        if (!geocodedResults[address]) {
          needsGeocoding = true;
          addressesToGeocode.push({ address, mapCategory });
        }
        break;
    }
  }
  
  console.log(`Found ${addressesToGeocode.length} addresses that need geocoding`);
  
  if (addressesToGeocode.length === 0) {
    console.log('All addresses are already geocoded!');
    
    try {
      fs.writeFileSync(PUBLIC_OUTPUT_PATH, JSON.stringify(geocodedResults, null, 2));
      
      console.log('Generating TypeScript file...');
      const tsContent = `// Auto-generated file from geocoder.js - do not edit manually
// Generated on: ${new Date().toISOString()}

export interface GeocodedAddress {
  address: string;
  lat: number;
  lng: number;
  mapCategory: string;
  method: 'coordinates' | 'geocoded' | 'fallback';
  error?: string;
  timestamp: string;
}

export const geocodedAddresses: { [key: string]: GeocodedAddress } = ${JSON.stringify(geocodedResults, null, 2)};

export default geocodedAddresses;
`;
      
      fs.writeFileSync(TYPESCRIPT_OUTPUT_PATH, tsContent);
      
      console.log(`Summary:`);
      console.log(`   Total in database: ${Object.keys(geocodedResults).length}`);
      console.log(`   Public copy saved to: ${PUBLIC_OUTPUT_PATH}`);
      console.log(`   TypeScript file saved to: ${TYPESCRIPT_OUTPUT_PATH}`);
    } catch (error) {
      console.error('Error saving files:', error.message);
      process.exit(1);
    }
    
    return;
  }
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < addressesToGeocode.length; i += BATCH_SIZE) {
    const batch = addressesToGeocode.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async ({ address, mapCategory }) => {
      console.log(`Geocoding: ${address}`);
      const result = await geocodeAddress(address);
      
      if (result.success) {
        geocodedResults[address] = {
          address,
          lat: result.lat,
          lng: result.lng,
          mapCategory,
          method: 'geocoded',
          timestamp: new Date().toISOString()
        };
        successful++;
        console.log(`  Success: ${result.lat}, ${result.lng}`);
      } else {
        const fallbackCoords = { lat: 40.76407, lng: -111.84360 };
        geocodedResults[address] = {
          address,
          lat: fallbackCoords.lat,
          lng: fallbackCoords.lng,
          mapCategory,
          method: 'fallback',
          error: result.error,
          timestamp: new Date().toISOString()
        };
        failed++;
        console.log(`  Failed: ${result.error} (using fallback coordinates)`);
      }
      
      processed++;
      return result;
    });
    
    await Promise.all(batchPromises);
    
    try {
      fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(geocodedResults, null, 2));
      console.log(`Progress saved: ${processed}/${addressesToGeocode.length} addresses processed\n`);
    } catch (error) {
      console.error('Warning: Could not save progress:', error.message);
    }
    
    if (i + BATCH_SIZE < addressesToGeocode.length) {
      await sleep(DELAY_MS);
    }
  }
  
  try {
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(geocodedResults, null, 2));
    fs.writeFileSync(PUBLIC_OUTPUT_PATH, JSON.stringify(geocodedResults, null, 2));
    
    console.log('📝 Generating TypeScript file...');
    const tsContent = `// Auto-generated file from geocoder.js - do not edit manually
// Generated on: ${new Date().toISOString()}

export interface GeocodedAddress {
  address: string;
  lat: number;
  lng: number;
  mapCategory: string;
  method: 'coordinates' | 'geocoded' | 'fallback';
  error?: string;
  timestamp: string;
}

export const geocodedAddresses: { [key: string]: GeocodedAddress } = ${JSON.stringify(geocodedResults, null, 2)};

export default geocodedAddresses;
`;
    
    fs.writeFileSync(TYPESCRIPT_OUTPUT_PATH, tsContent);
    
    console.log('\nGeocoding complete!');
    console.log(`Summary:`);
    console.log(`   Total addresses processed: ${processed}`);
    console.log(`   Successfully geocoded: ${successful}`);
    console.log(`   Failed (using fallback): ${failed}`);
    console.log(`   Total in database: ${Object.keys(geocodedResults).length}`);
    console.log(`   Output saved to: ${OUTPUT_FILE_PATH}`);
    console.log(`   Public copy saved to: ${PUBLIC_OUTPUT_PATH}`);
    console.log(`   TypeScript file saved to: ${TYPESCRIPT_OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error saving final results:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  geocodeAllAddresses().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { geocodeAllAddresses, parseCSV, geocodeAddress }; 