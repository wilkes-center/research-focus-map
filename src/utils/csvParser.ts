import { ResearchArea } from '../types/ResearchArea';
import Papa from 'papaparse';

export interface ResearchFocusData {
  Name: string;
  Term: string;
  Type: string;
  'Project Title': string;
  'Project Summary': string;
  'Geographic Focus (Title)': string;
  'Geographic Focus (Data)': string;
  Map: string;
  Department: string;
  Collaborator: string;
  Links: string;
}

// Interface for pre-geocoded data
interface GeocodedData {
  [address: string]: {
    address: string;
    lat: number;
    lng: number;
    mapCategory: string;
    method: 'coordinates' | 'geocoded' | 'fallback';
    timestamp: string;
    error?: string;
  };
}

// Cache for geocoded addresses
let geocodedCache: Record<string, { lat: number; lng: number }> | null = null;

/**
 * Loads pre-geocoded addresses from JSON file
 */
async function loadGeocodedAddresses(): Promise<Record<string, { lat: number; lng: number }>> {
  if (geocodedCache) {
    return geocodedCache;
  }

  try {
    // Use PUBLIC_URL for correct path in production builds
    const geocodedPath = `${process.env.PUBLIC_URL || ''}/geocoded-addresses.json`;
    console.log('Attempting to fetch geocoded addresses from:', geocodedPath);
    
    const response = await fetch(geocodedPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const geocodedData = await response.json();
    
    // Transform the geocoded data to the expected format
    geocodedCache = {};
    Object.entries(geocodedData).forEach(([address, data]: [string, any]) => {
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        geocodedCache![address] = { lat: data.lat, lng: data.lng };
      }
    });
    
    console.log(`📍 Loaded ${Object.keys(geocodedCache || {}).length} pre-geocoded addresses`);
    return geocodedCache || {};
  } catch (error) {
    console.warn('⚠️ Could not load pre-geocoded addresses:', error);
    geocodedCache = {};
    return {};
  }
}

// Get coordinates from pre-geocoded data or cache
const getCoordinates = async (address: string, mapCategory: string): Promise<{ lat: number; lng: number } | null> => {
  // Load pre-geocoded data if not already loaded
  if (!geocodedCache) {
    geocodedCache = await loadGeocodedAddresses();
  }

  // Check pre-geocoded data
  if (geocodedCache[address]) {
    return geocodedCache[address];
  }

  // Check if address contains coordinates
  const coords = parseCoordinates(address);
  if (coords) {
    geocodedCache[address] = coords;
    return coords;
  }

  // If no pre-geocoded data found, use fallback
  console.warn(`⚠️  Address not found in pre-geocoded data: ${address}`);
  const fallbackCoords = { lat: 40.76407, lng: -111.84360 }; // Campus center
  geocodedCache[address] = fallbackCoords;
  return fallbackCoords;
};

// Function to parse coordinates from coordinate strings
export const parseCoordinates = (coordString: string): { lat: number; lng: number } | null => {
  if (!coordString || coordString.trim() === '') return null;
  
  // Handle coordinate pairs like "39.217341473967124, -114.1987696163944"
  const coords = coordString.split(',').map(coord => parseFloat(coord.trim()));
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return { lat: coords[0], lng: coords[1] };
  }
  
  return null;
};

// Function to parse CSV text using Papa Parse
const parseCSVText = async (csvText: string): Promise<ResearchFocusData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data as ResearchFocusData[]);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

// Function to parse CSV data and convert to ResearchArea format
export const parseResearchFocusCSV = async (csvData: ResearchFocusData[]): Promise<ResearchArea[]> => {
  const researchAreas: ResearchArea[] = [];
  
  // Process entries in batches to maintain consistent behavior
  const batchSize = 10;
  for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (row) => {
      // Skip rows with missing essential data
      if (!row.Name || !row['Geographic Focus (Data)'] || !row.Map || !row.Department) {
        return null;
      }
      
      let coordinates: { lat: number; lng: number } | null = null;
      
      // Get coordinates using the new unified method
      coordinates = await getCoordinates(row['Geographic Focus (Data)'], row.Map);
      
      if (coordinates) {
        const researchArea: ResearchArea = {
          name: row['Project Title'] || row.Name || 'Unknown Project',
          description: row['Project Summary'] || 'No description available',
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          category: row.Department,
          term: row.Term || 'Unknown',
          type: row.Type || 'Unknown',
          mapFocus: row.Map as 'World' | 'Utah' | 'Campus',
          researcherName: row.Name || 'Unknown Researcher',
          collaborator: row.Collaborator || '',
          links: row.Links || '',
          geographicFocus: row['Geographic Focus (Title)'] || ''
        };
        
        return researchArea;
      }
      
      return null;
    });
    
    const batchResults = await Promise.all(batchPromises);
    researchAreas.push(...batchResults.filter((area): area is ResearchArea => area !== null));
  }
  
  return researchAreas;
};

// Function to get cache statistics
export const getCacheStats = () => {
  const totalEntries = Object.keys(geocodedCache || {}).length;
  const cacheSize = totalEntries > 0 ? `${Math.round(JSON.stringify({ geocodedCache }).length / 1024)}KB` : '0KB';
  
  return {
    totalEntries,
    cacheSize,
    memoryCache: Object.keys(geocodedCache || {}).length,
    preGeocodedCache: Object.keys(geocodedCache || {}).length
  };
};

// Function to load and parse CSV file
export const loadResearchFocusData = async (): Promise<ResearchArea[]> => {
  try {
    // Use PUBLIC_URL for correct path in production builds
    const csvPath = `${process.env.PUBLIC_URL || ''}/ResearchFocus.csv`;
    console.log('Attempting to fetch CSV from:', csvPath);
    
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.statusText} (${response.status})`);
    }
    
    const csvText = await response.text();
    const csvData = await parseCSVText(csvText);
    
    console.log('Starting to process research areas...');
    
    // Log initial cache statistics
    const initialCacheStats = getCacheStats();
    console.log(`💾 Cache status: ${initialCacheStats.memoryCache} in memory, ${initialCacheStats.preGeocodedCache} pre-geocoded`);
    
    const startTime = Date.now();
    const researchAreas = await parseResearchFocusCSV(csvData);
    const endTime = Date.now();
    
    // Log final cache statistics
    const finalCacheStats = getCacheStats();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n🎯 Processing Complete:`);
    console.log(`✅ Loaded ${researchAreas.length} research areas`);
    console.log(`⏱️  Processing time: ${duration} seconds`);
    console.log(`💾 Using ${finalCacheStats.preGeocodedCache} pre-geocoded addresses`);
    console.log(`🚀 Memory cache: ${finalCacheStats.memoryCache} addresses`);
    
    if (finalCacheStats.preGeocodedCache > 0) {
      console.log(`⚡ All geocoding data loaded from pre-generated file - no API calls needed!`);
    }
    
    return researchAreas;
  } catch (error) {
    console.error('Error loading research focus data:', error);
    return [];
  }
};

// Function to determine category based on department
export const getDepartmentCategory = (department: string): string => {
  const categoryMap: Record<string, string> = {
    'ENVST': 'Climate',
    'Environmental Studies': 'Climate',
    'Atmospheric Sciences': 'Climate',
    'Biology': 'Ecology',
    'School of Biological Sciences': 'Ecology',
    'Ecology': 'Ecology',
    'Chemistry': 'Research',
    'Materials Science Engineering': 'Research',
    'Geology & Geophysics': 'Geology',
    'Department of Geology and Geophysics': 'Geology',
    'Anthropology': 'Research',
    'Communication': 'Research',
    'Civil & Environmental Engineering': 'Research',
    'Medicine': 'Research',
    'Biomedical Engineering': 'Research',
    'Biomedical Informatics': 'Research',
    'Mathematics': 'Research',
    'Gender Studies': 'Research',
    'Sociology': 'Research',
    'Psychology': 'Research',
    'Political Science': 'Research'
  };
  
  return categoryMap[department] || 'Research';
}; 