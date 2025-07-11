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
let geocodedCache: GeocodedData | null = null;

/**
 * Loads pre-geocoded addresses from JSON file
 */
async function loadGeocodedAddresses(): Promise<GeocodedData> {
  if (geocodedCache) {
    console.log(`📍 Using cached geocoded addresses: ${Object.keys(geocodedCache).length} entries`);
    return geocodedCache;
  }

  try {
    // Use PUBLIC_URL for correct path in production builds
    const geocodedPath = `${process.env.PUBLIC_URL}/geocoded-addresses.json`;
    console.log('🔍 Loading geocoded addresses from:', geocodedPath);
    console.log('🔍 Current PUBLIC_URL:', process.env.PUBLIC_URL);
    console.log('🔍 Current window.location:', window.location.href);
    
    const response = await fetch(geocodedPath);
    console.log('📡 Fetch response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('📄 Response text length:', responseText.length);
    console.log('📄 Response starts with:', responseText.substring(0, 100));
    
    const data = JSON.parse(responseText);
    geocodedCache = data as GeocodedData;
    
    const cacheSize = Object.keys(geocodedCache || {}).length;
    console.log(`📍 Successfully loaded ${cacheSize} pre-geocoded addresses`);
    
    // Log a sample of campus addresses for debugging
    const campusAddresses = Object.entries(geocodedCache || {})
      .filter(([_, data]) => data && data.mapCategory === 'campus')
      .slice(0, 3);
    console.log('📍 Sample campus addresses:', campusAddresses.map(([key, _]) => key));
    
    return geocodedCache;
  } catch (error) {
    console.error('⚠️ Could not load pre-geocoded addresses:', error);
    console.error('Current PUBLIC_URL:', process.env.PUBLIC_URL);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const emptyCache: GeocodedData = {};
    geocodedCache = emptyCache;
    return emptyCache;
  }
}

// Get coordinates from pre-geocoded data or cache
const getCoordinates = async (address: string, mapCategory: string): Promise<{ lat: number; lng: number } | null> => {
  console.log(`🎯 getCoordinates called with address: "${address}", mapCategory: "${mapCategory}"`);
  
  // Load pre-geocoded data if not already loaded
  if (!geocodedCache) {
    console.log('📦 Geocoded cache not loaded, loading now...');
    geocodedCache = await loadGeocodedAddresses();
  } else {
    console.log(`📦 Using existing geocoded cache with ${Object.keys(geocodedCache).length} entries`);
  }

  // First check if this is a raw coordinate string
  const coords = parseCoordinates(address);
  if (coords) {
    console.log(`📍 Found raw coordinates: ${coords.lat}, ${coords.lng}`);
    // If these are raw coordinates, look up by coordinates to see if we have a geocoded entry
    const coordKey = `${coords.lat}, ${coords.lng}`;
    if (geocodedCache[coordKey]) {
      const data = geocodedCache[coordKey];
      console.log(`✅ Found geocoded entry for coordinates: ${coordKey}`);
      return { lat: data.lat, lng: data.lng };
    }
    // If no geocoded entry found, use the raw coordinates
    console.log(`📍 Using raw coordinates directly: ${coords.lat}, ${coords.lng}`);
    return coords;
  }

  // Normalize mapCategory for comparison
  const normalizedMapCategory = mapCategory.toLowerCase();
  console.log(`🏷️ Normalized mapCategory: "${normalizedMapCategory}"`);

  // For campus addresses, first try to find a geocoded address that matches
  if (normalizedMapCategory === 'campus') {
    console.log(`🏫 Processing campus address: "${address}"`);
    console.log(`🏫 Total geocoded entries: ${Object.keys(geocodedCache || {}).length}`);
    
    // Count campus addresses in cache
    const campusCount = Object.values(geocodedCache || {}).filter(data => data && data.mapCategory === 'campus').length;
    console.log(`🏫 Campus addresses in cache: ${campusCount}`);
    
    // First try exact match
    if (geocodedCache[address]) {
      const data = geocodedCache[address];
      console.log(`✅ Found exact match for: "${address}"`);
      return { lat: data.lat, lng: data.lng };
    }
    
    // Try to find a matching geocoded address by normalizing and comparing
    const normalizedAddress = address.toLowerCase().replace(/\s+/g, ' ').trim();
    console.log(`🔍 Searching for normalized address: "${normalizedAddress}"`);
    
    const geocodedEntry = Object.entries(geocodedCache).find(([key, data]) => {
      if (data && data.mapCategory === 'campus') {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, ' ').trim();
        const matches = normalizedKey === normalizedAddress;
        if (matches) {
          console.log(`✅ Found normalized match: "${key}" matches "${address}"`);
        }
        return matches;
      }
      return false;
    });

    if (geocodedEntry) {
      const [_, data] = geocodedEntry;
      return { lat: data.lat, lng: data.lng };
    }
    
    console.log(`⚠️ No match found for campus address: "${address}"`);
    const availableCampusAddresses = Object.keys(geocodedCache || {}).filter(key => 
      geocodedCache && geocodedCache[key] && geocodedCache[key].mapCategory === 'campus'
    );
    console.log(`🏫 Available campus addresses (${availableCampusAddresses.length}):`, availableCampusAddresses.slice(0, 5));
    
    // Show some similar addresses for debugging
    const similarAddresses = availableCampusAddresses.filter(key => 
      key.toLowerCase().includes('mario') || key.toLowerCase().includes('capecchi')
    );
    if (similarAddresses.length > 0) {
      console.log(`🔍 Similar addresses found:`, similarAddresses);
    }
  }

  // Check pre-geocoded data for exact match (for non-campus addresses)
  if (geocodedCache[address]) {
    const data = geocodedCache[address];
    console.log(`✅ Found exact match for non-campus address: "${address}"`);
    return { lat: data.lat, lng: data.lng };
  }

  // If no pre-geocoded data found, use fallback
  console.warn(`⚠️ Address not found in pre-geocoded data: ${address}`);
  const fallbackCoords = { lat: 40.76407, lng: -111.84360 }; // Campus center
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
export const parseCSVText = (csvText: string): ResearchFocusData[] => {
  const result = Papa.parse<ResearchFocusData>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  console.log(`📄 CSV Parsing Results:`);
  console.log(`   Raw entries parsed: ${result.data.length}`);
  console.log(`   Parsing errors/warnings: ${result.errors.length}`);
  
  // Log a sample of the first few entries to understand the data structure
  if (result.data.length > 0) {
    console.log(`📋 Sample entry (first row):`, {
      Name: result.data[0].Name,
      Department: result.data[0].Department,
      Map: result.data[0].Map,
      'Geographic Focus (Data)': result.data[0]['Geographic Focus (Data)'],
      'Project Title': result.data[0]['Project Title']
    });
  }

  return result.data;
};

// Function to parse CSV data and convert to ResearchArea format
export const parseResearchFocusCSV = async (csvData: ResearchFocusData[]): Promise<ResearchArea[]> => {
  const researchAreas: ResearchArea[] = [];
  let skippedCount = 0;
  let processedCount = 0;
  let coordinateFailures = 0;
  
  console.log(`🔍 Starting to process ${csvData.length} CSV entries`);
  
  // Process entries in batches to maintain consistent behavior
  const batchSize = 10;
  for (let i = 0; i < csvData.length; i += batchSize) {
    const batch = csvData.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (row, batchIndex) => {
      const rowIndex = i + batchIndex;
      
      // Check for missing essential data with detailed logging
      const missingFields = [];
      if (!row.Name) missingFields.push('Name');
      if (!row['Geographic Focus (Data)']) missingFields.push('Geographic Focus (Data)');
      if (!row.Map) missingFields.push('Map');
      if (!row.Department) missingFields.push('Department');
      
      if (missingFields.length > 0) {
        console.log(`⚠️  Row ${rowIndex + 1}: Skipping due to missing fields: ${missingFields.join(', ')}`);
        console.log(`    Name: "${row.Name || 'MISSING'}"`, 
                   `Department: "${row.Department || 'MISSING'}"`,
                   `Map: "${row.Map || 'MISSING'}"`);
        skippedCount++;
        return null;
      }
      
      let coordinates: { lat: number; lng: number } | null = null;
      
      // Get coordinates using the new unified method
      coordinates = await getCoordinates(row['Geographic Focus (Data)'], row.Map);
      
      if (coordinates) {
        processedCount++;
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
          geographicFocus: row.Map === 'Campus' ? row['Geographic Focus (Data)'] : (row['Geographic Focus (Title)'] || '')
        };
        
        return researchArea;
      } else {
        console.log(`❌ Row ${rowIndex + 1}: Failed to get coordinates for "${row['Geographic Focus (Data)']}" (Map: ${row.Map})`);
        coordinateFailures++;
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    researchAreas.push(...batchResults.filter((area): area is ResearchArea => area !== null));
  }
  
  console.log(`📊 Processing Summary:`);
  console.log(`   Total CSV entries: ${csvData.length}`);
  console.log(`   Successfully processed: ${processedCount}`);
  console.log(`   Skipped (missing fields): ${skippedCount}`);
  console.log(`   Coordinate failures: ${coordinateFailures}`);
  console.log(`   Final research areas: ${researchAreas.length}`);
  
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

// Function to load and parse research focus data
export const loadResearchFocusData = async (): Promise<ResearchArea[]> => {
  try {
    console.log('🚀 Starting to load research focus data...');
    
    const csvPath = `${process.env.PUBLIC_URL || ''}/ResearchFocus.csv`;
    console.log(`📂 Loading CSV from: ${csvPath}`);
    
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`📝 CSV file loaded, size: ${csvText.length} characters`);
    
    const csvData = parseCSVText(csvText);
    console.log(`✅ CSV parsed successfully, ${csvData.length} entries found`);
    
    const researchAreas = await parseResearchFocusCSV(csvData);
    console.log(`🎯 Final result: ${researchAreas.length} research areas loaded`);
    
    return researchAreas;
  } catch (error) {
    console.error('❌ Error loading research focus data:', error);
    throw error;
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