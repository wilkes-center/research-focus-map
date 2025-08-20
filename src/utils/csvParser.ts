// CSV parsing utilities for loading and processing research focus data
import { ResearchArea } from '../types/ResearchArea';
import Papa from 'papaparse';
import { geocodedAddresses } from '../data/geocodedAddresses';
import { CSV_CONFIG } from '../constants/mapConfig';

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

export interface GeocodedAddress {
  address: string;
  lat: number;
  lng: number;
  mapCategory: string;
  method: string;
  timestamp: string;
  error?: string;
}

// Default campus coordinates for University of Utah
const CAMPUS_CENTER = CSV_CONFIG.CAMPUS_CENTER;

// Global cache for geocoded addresses (now loaded from imported data)
let geocodedAddressCache: { [key: string]: GeocodedAddress } = {};
let cacheLoaded = false;

/**
 * Initialize geocoded addresses from imported data
 */
const initializeGeocodedAddresses = (): void => {
  if (cacheLoaded) {
    console.log('📦 Geocoded addresses already initialized');
    return;
  }

  geocodedAddressCache = geocodedAddresses as { [key: string]: GeocodedAddress };
  cacheLoaded = true;
  
  // Count entries by category
  const campusCount = Object.values(geocodedAddressCache).filter(entry => entry.mapCategory === 'campus').length;
  const totalCount = Object.keys(geocodedAddressCache).length;
  
  console.log(`✅ Initialized geocoded addresses from imported data`);
  console.log(`📊 Geocoded cache stats: ${totalCount} total entries, ${campusCount} campus addresses`);
  
  // Log a few sample campus addresses
  const campusAddresses = Object.entries(geocodedAddressCache)
    .filter(([_, entry]) => entry.mapCategory === 'campus')
    .slice(0, 3);
  
  if (campusAddresses.length > 0) {
    console.log('🏫 Sample campus addresses:');
    campusAddresses.forEach(([address, entry]) => {
      console.log(`   "${address}" → ${entry.lat}, ${entry.lng}`);
    });
  }
};

/**
 * Parse coordinates from a coordinate string like "39.217341473967124, -114.1987696163944"
 */
export const parseCoordinates = (coordString: string): { lat: number; lng: number } | null => {
  if (!coordString || coordString.trim() === '') return null;
  
  // Handle coordinate pairs like "39.217341473967124, -114.1987696163944"
  const coords = coordString.split(',').map(coord => parseFloat(coord.trim()));
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return { lat: coords[0], lng: coords[1] };
  }
  
  return null;
};

/**
 * Get coordinates for a research entry based on its data and map type
 */
const getCoordinates = (geographicData: string, mapType: string): { lat: number; lng: number } | null => {
  console.log(`🎯 Getting coordinates for: "${geographicData}" (Map: ${mapType})`);
  
  // First try to parse as coordinates (for World and Utah entries)
  const coords = parseCoordinates(geographicData);
  if (coords) {
    console.log(`📍 Found coordinates: ${coords.lat}, ${coords.lng}`);
    return coords;
  }
  
  // For campus entries, try to find a matching geocoded location
  if (mapType.toLowerCase() === 'campus') {
    console.log(`🏫 Processing campus location: "${geographicData}"`);
    
    // Ensure geocoded addresses are initialized
    initializeGeocodedAddresses();
    
    // Try exact match first
    if (geocodedAddressCache[geographicData]) {
      const entry = geocodedAddressCache[geographicData];
      console.log(`✅ Found exact geocoded match: ${geographicData} → ${entry.lat}, ${entry.lng}`);
      return { lat: entry.lat, lng: entry.lng };
    }
    
    // Try partial match
    const partialMatch = Object.keys(geocodedAddressCache).find(key => 
      key.toLowerCase().includes(geographicData.toLowerCase()) ||
      geographicData.toLowerCase().includes(key.toLowerCase())
    );
    
    if (partialMatch) {
      const entry = geocodedAddressCache[partialMatch];
      console.log(`✅ Found partial geocoded match: ${partialMatch} for ${geographicData} → ${entry.lat}, ${entry.lng}`);
      return { lat: entry.lat, lng: entry.lng };
    }
    
    // Default to campus center for any campus location
    console.log(`🏫 Using campus center for: ${geographicData}`);
    return CAMPUS_CENTER;
  }
  
  console.warn(`⚠️ Could not parse coordinates for: "${geographicData}" (Map: ${mapType})`);
  return null;
};

/**
 * Parse CSV text using Papa Parse
 */
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
  
  return result.data;
};

/**
 * Parse research focus data from CSV format
 */
export const parseResearchFocusCSV = (csvData: ResearchFocusData[]): ResearchArea[] => {
  console.log(`📊 Starting to parse ${csvData.length} research focus entries`);
  
  // Initialize geocoded addresses
  initializeGeocodedAddresses();
  
  const results: ResearchArea[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    
    try {
      // Skip entries without required data
      if (!row.Name || !row['Geographic Focus (Data)'] || !row.Map) {
        console.log(`⚠️ Skipping entry ${i + 1}: Missing required fields`);
        errorCount++;
        continue;
      }
      
      // Get coordinates
      const coordinates = getCoordinates(row['Geographic Focus (Data)'], row.Map);
      
      if (coordinates) {
        const researchArea: ResearchArea = {
          name: row['Project Title'] || row.Name || 'Unknown Project',
          description: row['Project Summary'] || 'No description available',
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          category: getDepartmentCategory(row.Department || ''),
          department: row.Department || 'Unknown Department',
          term: row.Term || 'Unknown',
          type: row.Type || 'Unknown',
          mapFocus: (row.Map as 'World' | 'Utah' | 'Campus') || 'Campus',
          researcherName: row.Name || 'Unknown Researcher',
          collaborator: row.Collaborator || '',
          links: row.Links || '',
          geographicFocus: row['Geographic Focus (Title)'] || row['Geographic Focus (Data)'] || 'Unknown location'
        };
        
        results.push(researchArea);
        successCount++;
      } else {
        console.warn(`⚠️ Could not get coordinates for entry ${i + 1}: ${row.Name}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing entry ${i + 1}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Parsing complete: ${successCount} successful, ${errorCount} errors`);
  
  // Log statistics by map type
  const mapTypeStats = results.reduce((acc, area) => {
    acc[area.mapFocus] = (acc[area.mapFocus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Results by map type:', mapTypeStats);
  
  return results;
};

/**
 * Load research focus data from CSV file
 */
export const loadResearchFocusData = async (): Promise<ResearchArea[]> => {
  try {
    console.log('📄 Loading ResearchFocus.csv...');
    
    // Determine the correct path for both development and production
    const publicUrl = process.env.PUBLIC_URL || '';
    
    const paths = [
      `${publicUrl}/ResearchFocus.csv`,
      ...CSV_CONFIG.PATHS
    ];
    
    console.log(`🌍 Environment: ${process.env.NODE_ENV}, PUBLIC_URL: ${publicUrl}`);
    
    let response: Response | null = null;
    let successfulPath = '';
    
    for (const path of paths) {
      try {
        console.log(`🔍 Attempting to load CSV from: ${path}`);
        response = await fetch(path);
        
        if (response.ok) {
          successfulPath = path;
          console.log(`✅ Successfully loaded CSV from: ${path}`);
          break;
        } else {
          console.log(`❌ Failed to load from ${path}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error loading from ${path}:`, error);
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`Failed to load CSV from any path. Last status: ${response?.status || 'unknown'}`);
    }
    
    const csvText = await response.text();
    console.log(`📄 CSV file loaded from ${successfulPath}, ${csvText.length} characters`);
    
    const csvData = parseCSVText(csvText);
    console.log(`✅ CSV parsed successfully, ${csvData.length} entries found`);
    
    const researchAreas = parseResearchFocusCSV(csvData);
    console.log(`🎯 Final result: ${researchAreas.length} research areas loaded`);
    
    return researchAreas;
  } catch (error) {
    console.error('❌ Error loading research focus data:', error);
    throw error;
  }
};

/**
 * Determine category based on department
 */
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