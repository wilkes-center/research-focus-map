import React, { useState, useMemo, useEffect, useRef } from 'react';
import Map, { Marker } from 'react-map-gl';
import { ResearchArea } from '../types/ResearchArea';
import { getDepartmentColor } from '../utils/mapUtils';

interface FilterState {
  departments: string[];
  terms: string[];
  types: string[];
}

interface MapComponentProps {
  researchAreas: ResearchArea[];
  selectedFilters: FilterState;
}

interface MarkerCluster {
  id: string;
  longitude: number;
  latitude: number;
  areas: ResearchArea[];
  isCluster: boolean;
}

// Enhanced clustering function that considers zoom level and visual proximity
const clusterMarkers = (areas: ResearchArea[], zoom: number, selectedArea?: ResearchArea | null): MarkerCluster[] => {
  // Calculate clustering distance based on zoom level
  // Much more precise distances at high zoom levels for campus
  const getClusterDistance = (zoom: number): number => {
    if (zoom <= 3) return 2.0;     // Very wide clustering for world view
    if (zoom <= 5) return 1.0;     // Wide clustering for country/state view
    if (zoom <= 6) return 0.1;     // Much tighter clustering starting at level 6
    if (zoom <= 8) return 0.05;    // Very tight clustering for regional view
    if (zoom <= 10) return 0.02;   // Extremely tight clustering for city view
    if (zoom <= 12) return 0.01;   // Ultra precise for campus area
    if (zoom <= 14) return 0.005;  // Super precise for campus view - only very close markers
    return 0.001;                  // Extremely precise for detailed campus view - only overlapping markers
  };

  const clusterDistance = getClusterDistance(zoom);
  const clusters: MarkerCluster[] = [];
  const processed = new Set<number>();
  let selectedClusterFound = false;
  
  areas.forEach((area, index) => {
    if (processed.has(index)) return;
    
    // Find all areas within clustering distance
    const nearbyAreas: ResearchArea[] = [area];
    processed.add(index);
    
    areas.forEach((otherArea, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return;
      
      // Calculate distance between points
      const latDiff = Math.abs(area.latitude - otherArea.latitude);
      const lngDiff = Math.abs(area.longitude - otherArea.longitude);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance <= clusterDistance) {
        nearbyAreas.push(otherArea);
        processed.add(otherIndex);
      }
    });
    
    // Calculate cluster center (average position)
    const avgLng = nearbyAreas.reduce((sum, a) => sum + a.longitude, 0) / nearbyAreas.length;
    const avgLat = nearbyAreas.reduce((sum, a) => sum + a.latitude, 0) / nearbyAreas.length;
    
    // Check if this cluster contains the selected area and we haven't found it yet
    const containsSelectedArea = selectedArea && 
      nearbyAreas.some(a => a.name === selectedArea.name && a.researcherName === selectedArea.researcherName);
    
    // Generate cluster ID - use special ID for the cluster containing the selected area
    let clusterId = `cluster-${clusters.length}`;
    if (containsSelectedArea && !selectedClusterFound) {
      clusterId = 'selected-cluster';
      selectedClusterFound = true;
    }
    
    clusters.push({
      id: clusterId,
      longitude: avgLng,
      latitude: avgLat,
      areas: nearbyAreas,
      isCluster: nearbyAreas.length > 1
    });
  });
  
  return clusters;
};

const MapComponent: React.FC<MapComponentProps> = ({ researchAreas, selectedFilters }) => {
  const [selectedArea, setSelectedArea] = useState<ResearchArea | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MarkerCluster | null>(null);
  const [previousCluster, setPreviousCluster] = useState<MarkerCluster | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isUofUFocused, setIsUofUFocused] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [showingFilteredResults, setShowingFilteredResults] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2
  });

  // Play feature state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);
  const [playProgress, setPlayProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // Add countdown state
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter areas based on selected filters
  const filteredAreas = researchAreas.filter(area => {
    const departmentMatch = selectedFilters.departments.length === 0 || selectedFilters.departments.includes(area.department);
    const termMatch = selectedFilters.terms.length === 0 || selectedFilters.terms.includes(area.term);
    const typeMatch = selectedFilters.types.length === 0 || selectedFilters.types.includes(area.type);
    
    return departmentMatch && termMatch && typeMatch;
  });

  // Auto-show filtered results when filters are applied
  useEffect(() => {
    const hasActiveFilters = selectedFilters.departments.length > 0 || 
                           selectedFilters.terms.length > 0 || 
                           selectedFilters.types.length > 0;
    
    if (hasActiveFilters && !isPlaying) {
      setShowingFilteredResults(true);
      setSidePanelOpen(true);
    } else if (!hasActiveFilters) {
      setShowingFilteredResults(false);
      // Only close sidebar if no area or cluster is selected
      if (!selectedArea && !selectedCluster) {
        setSidePanelOpen(false);
      }
    }
  }, [selectedFilters, isPlaying, selectedArea, selectedCluster]);

  // Create stable clustered markers (not dependent on zoom level)
  const clusteredMarkers = useMemo(() => {
    // Use all research areas for tour mode, filtered areas for normal browsing
    let areasToCluster = isPlaying ? researchAreas : filteredAreas;
    
    // Sort research areas by term for tour mode with custom order
    if (isPlaying) {
      const termOrder = [
        'Summer 25', 'Spring 25', 'Fall 24', 'Summer 24', 'Spring 24', 'Fall 23', 
        'Summer 23', 'Spring 23', 'Fall 22', 'Summer 22', 'Spring 22', 'Fall 21',
        'Summer 21', 'Spring 21', 'Fall 20', 'Summer 20', 'Spring 20'
      ];
      
      areasToCluster = [...areasToCluster].sort((a, b) => {
        const aIndex = termOrder.indexOf(a.term);
        const bIndex = termOrder.indexOf(b.term);
        
        // If both terms are in the order array, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only one term is in the order array, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // If neither term is in the order array, sort alphabetically
        return a.term.localeCompare(b.term);
      });
    }
    
    const markers = clusterMarkers(areasToCluster, viewState.zoom, selectedArea);
    
    // Filter for campus view and log info
    if (isUofUFocused) {
      // First, filter out any clusters that don't have any campus markers
      const campusMarkers = markers.filter(m => m.areas.some(a => a.mapFocus === 'Campus'));
      
      // Then, for each cluster, only keep the campus markers within it
      const pureCampusMarkers = campusMarkers.map(marker => ({
        ...marker,
        areas: marker.areas.filter(area => area.mapFocus === 'Campus'),
        isCluster: marker.areas.filter(area => area.mapFocus === 'Campus').length > 1
      }));
      
      const clusteredCampus = pureCampusMarkers.filter(m => m.isCluster);
      console.log(`🏛️ Campus View - ${pureCampusMarkers.length} total campus markers, ${clusteredCampus.length} are clusters (zoom: ${viewState.zoom.toFixed(1)})`);
      return pureCampusMarkers;
    }
    
    return markers;
  }, [filteredAreas, researchAreas, isPlaying, viewState.zoom, isUofUFocused, selectedArea]);

  // Create individual tour entries for tour mode
  const tourEntries = useMemo(() => {
    const termOrder = [
      'Summer 25', 'Spring 25', 'Fall 24', 'Summer 24', 'Spring 24', 'Fall 23', 
      'Summer 23', 'Spring 23', 'Fall 22', 'Summer 22', 'Spring 22', 'Fall 21',
      'Summer 21', 'Spring 21', 'Fall 20', 'Summer 20', 'Spring 20'
    ];
    
    // Sort all research areas by term for tour mode
    const sortedAreas = [...researchAreas].sort((a, b) => {
      const aIndex = termOrder.indexOf(a.term);
      const bIndex = termOrder.indexOf(b.term);
      
      // If both terms are in the order array, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one term is in the order array, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither term is in the order array, sort alphabetically
      return a.term.localeCompare(b.term);
    });
    
    return sortedAreas;
  }, [researchAreas]);

  // Reset UofU focus when zooming out
  React.useEffect(() => {
    if (isUofUFocused && viewState.zoom < 12) {
      setIsUofUFocused(false);
    }
  }, [viewState.zoom, isUofUFocused]);

  // Determine map style - using street view style for detailed street information
  const getMapStyle = () => {
    // Use streets style for better street-level detail
    return 'mapbox://styles/mapbox/streets-v12';
  };

  const handleUtahView = () => {
    setIsUofUFocused(false);
    closeSidePanel();
    setViewState({
      longitude: -111.6,
      latitude: 39.3,
      zoom: 6.5
    });
  };

  const handleUCampusView = () => {
    setIsUofUFocused(true);
    closeSidePanel();
    setViewState({
      longitude: -111.8360,
      latitude: 40.7640,
      zoom: 14.9
    });
  };

  const handleWorldView = () => {
    setIsUofUFocused(false);
    closeSidePanel();
    setViewState({
      longitude: 20,
      latitude: 0,
      zoom: 1.5
    });
  };

  const closeSidePanel = () => {
    // Stop play mode when sidebar is manually closed
    if (isPlaying) {
      // Only clear the playing state and timers, but don't close sidebar again
      setIsPlaying(false);
      setCurrentMarkerIndex(0);
      setPlayProgress(0);
      setTimeLeft(60); // Reset time left
      
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
    
    setSidePanelOpen(false);
    setSelectedArea(null);
    setSelectedCluster(null);
    setPreviousCluster(null);
    setShowingFilteredResults(false);
  };

  const handleClusterClick = (cluster: MarkerCluster) => {
    // Stop play mode when user manually clicks a marker
    if (isPlaying) {
      console.log('⏹️ Tour stopped due to user interaction');
      stopPlay();
    }
    
    // Clear filtered results view when clicking on markers
    setShowingFilteredResults(false);
    
    if (cluster.isCluster) {
      // For proximity clusters, decide whether to zoom in or show cluster panel
      if (viewState.zoom < 12) {
        // At lower zoom levels, zoom in to separate the markers
        setViewState({
          ...viewState,
          longitude: cluster.longitude,
          latitude: cluster.latitude,
          zoom: Math.min(viewState.zoom + 3, 15)
        });
      } else {
        // At higher zoom levels, show cluster panel
        setSelectedCluster(cluster);
        setSelectedArea(null);
        setSidePanelOpen(true);
      }
    } else {
      // Single marker - show area details
      handleProjectClick(cluster.areas[0]);
    }
  };

  const handleProjectClick = (area: ResearchArea) => {
    // Stop play mode when user manually clicks a project
    if (isPlaying) {
      console.log('⏹️ Tour stopped due to project selection');
      stopPlay();
    }
    
    // Clear filtered results view when clicking on projects
    setShowingFilteredResults(false);
    
    // Store the current cluster as previous cluster if we're viewing a cluster
    if (selectedCluster) {
      setPreviousCluster(selectedCluster);
    }
    setSelectedArea(area);
    setSelectedCluster(null);
    setSidePanelOpen(true);
  };

  const handleBackToCluster = () => {
    if (previousCluster) {
      setSelectedCluster(previousCluster);
      setSelectedArea(null);
      // Don't clear previousCluster yet, in case user wants to go back to individual project
    }
  };

  // Play functionality
  const startPlay = () => {
    if (tourEntries.length === 0) return;
    
    // Clear any existing state first
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    // Reset all tour state
    setCurrentMarkerIndex(0);
    setPlayProgress(0);
    setTimeLeft(60); // Reset time left
    setSelectedArea(null);
    setSelectedCluster(null);
    setPreviousCluster(null);
    
    // Start the tour
    setIsPlaying(true);
    console.log(`🎬 Tour started with ${tourEntries.length} individual research areas`);
    console.log(`📊 Total research areas in tour: ${tourEntries.length}`);
  };

  const stopPlay = () => {
    console.log('⏹️ Tour stopped');
    setIsPlaying(false);
    setCurrentMarkerIndex(0);
    setPlayProgress(0);
    setTimeLeft(60); // Reset time left
    
    // Clear all timers
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    // Clear tour-related UI state
    setSidePanelOpen(false);
    setSelectedArea(null);
    setSelectedCluster(null);
    setPreviousCluster(null);
  };

  const navigateToMarker = (index: number) => {
    if (index >= tourEntries.length) {
      // End of tour entries, stop playing
      stopPlay();
      return;
    }

    const researchArea = tourEntries[index];
    
    // Determine appropriate zoom level based on location
    const getZoomLevel = (area: ResearchArea) => {
      // Check if research area is campus-focused
      if (area.mapFocus === 'Campus') {
        // For campus areas, use campus view zoom level
        return 16;
      }
      
      // Check if area is in Salt Lake Valley (approximate bounds)
      const isInSaltLakeValley = area.latitude >= 40.4 && area.latitude <= 40.9 && 
                                 area.longitude >= -112.2 && area.longitude <= -111.6;
      
      if (isInSaltLakeValley) {
        // For Salt Lake Valley areas, use 10x zoom level
        return 10;
      }
      
      // Check if area is in Utah (approximate bounds)
      const isInUtah = area.latitude >= 37.0 && area.latitude <= 42.0 && 
                       area.longitude >= -114.0 && area.longitude <= -109.0;
      
      if (isInUtah) {
        // For Utah areas, use Utah view zoom level
        return 6.5;
      } else {
        // For international/out-of-state areas, use 3x zoom
        return 3;
      }
    };
    
    // Navigate to research area location with appropriate zoom
    setViewState({
      longitude: researchArea.longitude,
      latitude: researchArea.latitude,
      zoom: getZoomLevel(researchArea)
    });

    // Show the individual research area
    setSelectedArea(researchArea);
    setSelectedCluster(null);
    setSidePanelOpen(true);

    // Clear any existing timers before setting new ones
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    // Start progress timer (updates every 100ms for smooth progress bar)
    let progress = 0;
    let timeRemaining = 60; // Track remaining time
    progressTimerRef.current = setInterval(() => {
      progress += 100 / 60000; // 60 seconds = 60000ms
      timeRemaining -= 0.1; // Decrease by 0.1 seconds every 100ms
      setPlayProgress(Math.min(progress, 100));
      setTimeLeft(Math.max(0, Math.ceil(timeRemaining))); // Update countdown, ensure it doesn't go below 0
    }, 100);

    // Set timer for next area (1 minute = 60000ms)
    playTimerRef.current = setTimeout(() => {
      setCurrentMarkerIndex(index + 1);
      setPlayProgress(0);
      setTimeLeft(60); // Reset countdown for next marker
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      navigateToMarker(index + 1);
    }, 60000);
  };

  // Effect to handle play state changes
  useEffect(() => {
    if (isPlaying && currentMarkerIndex < tourEntries.length) {
      navigateToMarker(currentMarkerIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentMarkerIndex]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const getClusterColor = (areas: ResearchArea[]) => {
    if (areas.length === 1) {
      return getDepartmentColor(areas[0].department);
    }
    
    // For clusters, use the most common department color
    const deptCounts: { [key: string]: number } = {};
    areas.forEach(area => {
      deptCounts[area.department] = (deptCounts[area.department] || 0) + 1;
    });
    
    const mostCommonDept = Object.entries(deptCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return getDepartmentColor(mostCommonDept);
  };

  const getMarkerStyles = (cluster: MarkerCluster, isHovered: boolean = false) => {
    const isSelected = cluster.id === 'selected-cluster';
    const isCurrentlyToured = isPlaying && tourEntries[currentMarkerIndex] && 
      cluster.areas.some(area => area.name === tourEntries[currentMarkerIndex].name && 
                                area.researcherName === tourEntries[currentMarkerIndex].researcherName);
    const isSpecial = isSelected || isCurrentlyToured;
    
    // Make toured markers significantly bigger
    const baseSize = cluster.isCluster ? 
      Math.min(60, Math.max(30, 20 + cluster.areas.length * 3)) : 
      28;
    const size = isCurrentlyToured ? baseSize * 3 : baseSize; // 3x bigger for toured markers
    
    const scale = isHovered ? 1.1 : (isCurrentlyToured ? 1.3 : (isSelected ? 1.15 : 1)); // Even bigger scale for toured markers
    
    // Enhanced shadow and glow for toured markers
    const shadow = isCurrentlyToured ? 
      '0 12px 35px rgba(138, 43, 226, 0.6), 0 0 0 4px rgba(138, 43, 226, 0.3), 0 0 20px rgba(138, 43, 226, 0.4)' : 
      (isSelected ? '0 8px 25px rgba(255, 107, 53, 0.4), 0 0 0 3px rgba(255, 107, 53, 0.2)' : 
      (isHovered ? '0 6px 20px rgba(26,26,26,0.3)' : '0 2px 10px rgba(26,26,26,0.2)'));
    
    // Color logic: Purple for toured markers, orange for selected markers, department color for others
    const finalColor = isCurrentlyToured ? '#8A2BE2' : (isSelected ? '#ff6b35' : getClusterColor(cluster.areas));
    
    // Regular circular styling for all markers (we'll handle the pin shape in the JSX)
    return {
      position: 'relative' as const,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: finalColor,
      borderRadius: '50%',
      border: `${isCurrentlyToured ? '3px' : '2px'} solid ${isCurrentlyToured ? '#ffffff' : (isSpecial ? '#ffffff' : (isHovered ? '#f9f6ef' : '#ffffff'))}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cluster.isCluster ? 
        `${Math.min(18, Math.max(12, (8 + cluster.areas.length) * (isCurrentlyToured ? 1.2 : 1)))}px` : 
        `${isCurrentlyToured ? 18 : 14}px`, // Bigger font for toured markers
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: 'Sora, sans-serif',
      boxShadow: shadow,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
      zIndex: isCurrentlyToured ? 1003 : (isSpecial ? 1002 : (isHovered ? 1000 : 'auto')), // Highest z-index for toured markers
      textShadow: '0 1px 2px rgba(26,26,26,0.3)',
    };
  };

  // Component for map pin shape
  const MapPinIcon = ({ color, size }: { color: string; size: number }) => (
    <svg
      width={size + 8}
      height={size + 12}
      viewBox="0 0 24 32"
      style={{
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        transform: 'translateY(-4px)' // Offset to align pin point with marker position
      }}
    >
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 12 12 20 12 20s12-8 12-20C24 5.373 18.627 0 12 0z"
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="#ffffff"
        opacity="0.9"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill={color}
      />
    </svg>
  );

  // Simplified pulse animation
  const getPulseAnimation = (baseColor: string, isSelected: boolean = false, isCurrentlyToured: boolean = false) => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '120%',
    height: '120%',
    borderRadius: '50%',
    background: isSelected || isCurrentlyToured ? '#ff6b3520' : `${baseColor}20`,
    transform: 'translate(-50%, -50%)',
    animation: 'markerPulse 2s infinite',
    zIndex: -1,
  });

  const goToPreviousMarker = () => {
    if (currentMarkerIndex > 0) {
      setCurrentMarkerIndex(prev => prev - 1);
      setPlayProgress(0);
      setTimeLeft(60); // Reset countdown when manually navigating
      
      // Clear existing timers
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      
      // Navigate to the previous marker and restart timer
      navigateToMarker(currentMarkerIndex - 1);
    }
  };

  const goToNextMarker = () => {
    if (currentMarkerIndex < tourEntries.length - 1) {
      setCurrentMarkerIndex(prev => prev + 1);
      setPlayProgress(0);
      setTimeLeft(60); // Reset countdown when manually navigating
      
      // Clear existing timers
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      
      // Navigate to the next marker and restart timer
      navigateToMarker(currentMarkerIndex + 1);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex' }}>
      {/* Map Container */}
      <div style={{ 
        flex: sidePanelOpen ? '1' : '1', 
        transition: 'all 0.3s ease',
        width: sidePanelOpen ? (isPlaying ? 'calc(100% - 600px)' : 'calc(100% - 400px)') : '100%'
      }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100vh' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          renderWorldCopies={true}
          minZoom={1}
          maxZoom={20}
          onError={(error) => {
            console.error('Mapbox error:', error);
          }}
          onLoad={() => {
            console.log('Map loaded successfully');
            console.log('Mapbox token starts with:', process.env.REACT_APP_MAPBOX_TOKEN?.substring(0, 20));
          }}
        >
          {/* Enhanced clustered research area markers */}
          {clusteredMarkers.map((cluster) => {
            const isHovered = hoveredMarkerId === cluster.id;
            const isCurrentlyToured = isPlaying && tourEntries[currentMarkerIndex] && 
              cluster.areas.some(area => area.name === tourEntries[currentMarkerIndex].name && 
                                area.researcherName === tourEntries[currentMarkerIndex].researcherName);
            const isSpecial = cluster.id === 'selected-cluster' || isCurrentlyToured;
            
            // In tour mode, treat clusters as individual markers for visual purposes
            const shouldShowAsPin = isSpecial && (!cluster.isCluster || isCurrentlyToured);
            
            return (
              <Marker
                key={cluster.id}
                longitude={cluster.longitude}
                latitude={cluster.latitude}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(cluster);
                }}
              >
                {/* Render map pin for selected/toured markers (including clusters during tour), circle for others */}
                {shouldShowAsPin ? (
                  <div
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      transform: `scale(${isHovered ? 1.1 : 1.15})`,
                      transformOrigin: 'center bottom',
                      transition: 'transform 0.2s ease',
                      zIndex: 1002
                    }}
                    onMouseEnter={() => setHoveredMarkerId(cluster.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                  >
                    <MapPinIcon 
                      color={isCurrentlyToured ? '#8A2BE2' : '#ff6b35'}
                      size={28} 
                    />
                    
                    {/* Hover tooltip for map pin */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        bottom: '120%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1a1a1a',
                        color: '#f9f6ef',
                        padding: '10px 16px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(26,26,26,0.3)',
                        zIndex: 999999,
                        fontFamily: 'Sora, sans-serif',
                        letterSpacing: '0.01em',
                        animation: 'tooltipFade 0.2s ease-in-out',
                        maxWidth: '500px',
                        minWidth: '200px',
                        whiteSpace: 'normal',
                        textAlign: 'center',
                        lineHeight: '1.4',
                        pointerEvents: 'none'
                      }}>
                        {/* Show first area name for clusters during tour, or the single area name */}
                        {cluster.areas[0].name}
                        {/* Tooltip arrow */}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #1a1a1a'
                        }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={getMarkerStyles(cluster, isHovered)}
                    onMouseEnter={() => setHoveredMarkerId(cluster.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                  >
                    {/* Pulse animation for single markers */}
                    {!cluster.isCluster && (
                      <div style={getPulseAnimation(getClusterColor(cluster.areas), cluster.id === 'selected-cluster', isCurrentlyToured)} />
                    )}
                    
                    {/* Marker content */}
                    {cluster.isCluster ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}>
                        {cluster.areas.length}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}>
                        •
                      </div>
                    )}
                    
                    {/* Hover tooltip for circular markers */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        bottom: '120%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1a1a1a',
                        color: '#f9f6ef',
                        padding: '10px 16px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(26,26,26,0.3)',
                        zIndex: 999999,
                        fontFamily: 'Sora, sans-serif',
                        letterSpacing: '0.01em',
                        animation: 'tooltipFade 0.2s ease-in-out',
                        maxWidth: '500px',
                        minWidth: '200px',
                        whiteSpace: 'normal',
                        textAlign: 'center',
                        lineHeight: '1.4',
                        pointerEvents: 'none'
                      }}>
                        {cluster.isCluster 
                          ? `${cluster.areas.length} Research Projects`
                          : cluster.areas[0].name
                        }
                        {/* Tooltip arrow */}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #1a1a1a'
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </Marker>
            );
          })}
        </Map>

        {/* Navigation buttons */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Play/Stop buttons */}
          {!isPlaying ? (
            <button
              onClick={startPlay}
              disabled={tourEntries.length === 0}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#f9f6ef',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: '600',
                fontFamily: 'Sora, sans-serif',
                cursor: tourEntries.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: '140px',
                textAlign: 'center',
                opacity: tourEntries.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (tourEntries.length > 0) {
                  e.currentTarget.style.backgroundColor = '#2d7d32';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>▶️</span>
              <span>Start Tour</span>
            </button>
          ) : (
            <button
              onClick={stopPlay}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#f9f6ef',
                border: 'none',
                padding: '12px 18px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: '600',
                fontFamily: 'Sora, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: '140px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
            >
              {/* Progress bar for play mode */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                backgroundColor: '#f9f6ef',
                width: `${playProgress}%`,
                transition: 'width 0.1s ease'
              }} />
              <span>Stop Tour</span>
            </button>
          )}

          {/* Tour navigation controls - main map */}
          {isPlaying && (
            <div style={{
              backgroundColor: '#f9f6ef',
              border: '1px solid #1a1a1a20',
              borderRadius: '2px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(26,26,26,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '120px'
            }}>
              <div style={{
                display: 'flex',
                gap: '4px'
              }}>
                {/* Previous button */}
                <button
                  onClick={goToPreviousMarker}
                  disabled={currentMarkerIndex <= 0}
                  style={{
                    backgroundColor: currentMarkerIndex <= 0 ? 'rgba(26,26,26,0.2)' : '#1a1a1a',
                    color: currentMarkerIndex <= 0 ? 'rgba(26,26,26,0.4)' : '#f9f6ef',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: '600',
                    fontFamily: 'Sora, sans-serif',
                    cursor: currentMarkerIndex <= 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: currentMarkerIndex <= 0 ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (currentMarkerIndex > 0) {
                      e.currentTarget.style.backgroundColor = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = currentMarkerIndex <= 0 ? 'rgba(26,26,26,0.2)' : '#1a1a1a';
                  }}
                  title="Previous"
                >
                  ◀
                </button>

                {/* Next button */}
                <button
                  onClick={goToNextMarker}
                  disabled={currentMarkerIndex >= tourEntries.length - 1}
                  style={{
                    backgroundColor: currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(26,26,26,0.2)' : '#1a1a1a',
                    color: currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(26,26,26,0.4)' : '#f9f6ef',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: '600',
                    fontFamily: 'Sora, sans-serif',
                    cursor: currentMarkerIndex >= tourEntries.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: currentMarkerIndex >= tourEntries.length - 1 ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (currentMarkerIndex < tourEntries.length - 1) {
                      e.currentTarget.style.backgroundColor = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(26,26,26,0.2)' : '#1a1a1a';
                  }}
                  title="Next"
                >
                  ▶
                </button>
              </div>
            </div>
          )}

          {/* World View button */}
          <button
            onClick={handleWorldView}
            style={{
              backgroundColor: viewState.zoom <= 3 ? '#dd3b00' : '#1a1a1a',
              color: '#f9f6ef',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '2px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '140px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (viewState.zoom > 3) {
                e.currentTarget.style.backgroundColor = '#dd3b00';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = viewState.zoom <= 3 ? '#dd3b00' : '#1a1a1a';
            }}
          >
            🌍 World View
          </button>

          {/* Utah View button */}
          <button
            onClick={handleUtahView}
            style={{
              backgroundColor: (viewState.zoom > 5 && viewState.zoom < 10 && !isUofUFocused) ? '#dd3b00' : '#1a1a1a',
              color: '#f9f6ef',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '2px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '140px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (!(viewState.zoom > 5 && viewState.zoom < 10 && !isUofUFocused)) {
                e.currentTarget.style.backgroundColor = '#dd3b00';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = (viewState.zoom > 5 && viewState.zoom < 10 && !isUofUFocused) ? '#dd3b00' : '#1a1a1a';
            }}
          >
            🏔️ Utah View
          </button>

          {/* U Campus View button */}
          <button
            onClick={handleUCampusView}
            style={{
              backgroundColor: isUofUFocused ? '#dd3b00' : '#1a1a1a',
              color: '#f9f6ef',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '2px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minWidth: '140px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isUofUFocused) {
                e.currentTarget.style.backgroundColor = '#dd3b00';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isUofUFocused ? '#dd3b00' : '#1a1a1a';
            }}
          >
            🏛️ U Campus View
          </button>
        </div>

        {/* Zoom controls */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          backgroundColor: '#f9f6ef',
          border: '1px solid #1a1a1a20',
          borderRadius: '3px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(26,26,26,0.15)'
        }}>
          {/* Zoom In button */}
          <button
            onClick={() => setViewState({
              ...viewState,
              zoom: Math.min(viewState.zoom + 1, 20)
            })}
            style={{
              backgroundColor: '#f9f6ef',
              color: '#1a1a1a',
              border: 'none',
              padding: '8px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #1a1a1a10'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
              e.currentTarget.style.color = '#f9f6ef';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9f6ef';
              e.currentTarget.style.color = '#1a1a1a';
            }}
            title="Zoom In"
          >
            +
          </button>

          {/* Zoom Out button */}
          <button
            onClick={() => setViewState({
              ...viewState,
              zoom: Math.max(viewState.zoom - 1, 1)
            })}
            style={{
              backgroundColor: '#f9f6ef',
              color: '#1a1a1a',
              border: 'none',
              padding: '8px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
              e.currentTarget.style.color = '#f9f6ef';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9f6ef';
              e.currentTarget.style.color = '#1a1a1a';
            }}
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {/* Side Panel */}
      {sidePanelOpen && (
        <div style={{
          width: isPlaying ? '600px' : '400px',
          height: '100vh',
          backgroundColor: '#f9f6ef',
          borderLeft: '1px solid #1a1a1a20',
          boxShadow: '-4px 0 12px rgba(26,26,26,0.1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
          zIndex: 1001,
          transition: 'width 0.3s ease'
        }}>
          {/* Side Panel Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #1a1a1a20',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9f6ef',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Back button - only show when viewing a single project that came from a cluster */}
              {selectedArea && previousCluster && (
                <button
                  onClick={handleBackToCluster}
                  style={{
                    background: 'none',
                    border: '1px solid #1a1a1a20',
                    cursor: 'pointer',
                    color: '#1a1a1a',
                    padding: '8px 12px',
                    borderRadius: '2px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.color = '#f9f6ef';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1a1a1a';
                  }}
                >
                  ← Back
                </button>
              )}
              
              <h2 style={{
                margin: '0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a1a1a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {selectedArea ? 'Research Project' : selectedCluster ? `${selectedCluster.areas.length} Research Projects` : 'Project Details'}
              </h2>
              
              {/* Tour indicator when in play mode */}
              {isPlaying && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#ff6b35',
                    color: '#f9f6ef',
                    borderRadius: '2px',
                    fontSize: '9px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span>Tour Mode</span>
                  </div>
                  
                  {/* Side panel tour navigation controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '2px'
                    }}>
                      {/* Previous button */}
                      <button
                        onClick={goToPreviousMarker}
                        disabled={currentMarkerIndex <= 0}
                        style={{
                          backgroundColor: currentMarkerIndex <= 0 ? 'rgba(26,26,26,0.2)' : '#1a1a1a',
                          color: currentMarkerIndex <= 0 ? 'rgba(249,246,239,0.5)' : '#f9f6ef',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '2px',
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'Sora, sans-serif',
                          cursor: currentMarkerIndex <= 0 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (currentMarkerIndex > 0) {
                            e.currentTarget.style.backgroundColor = '#333333';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = currentMarkerIndex <= 0 ? 'rgba(26,26,26,0.2)' : '#1a1a1a';
                        }}
                        title="Previous"
                      >
                        ◀
                      </button>
                      
                      {/* Next button */}
                      <button
                        onClick={goToNextMarker}
                        disabled={currentMarkerIndex >= tourEntries.length - 1}
                        style={{
                          backgroundColor: currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(26,26,26,0.2)' : '#1a1a1a',
                          color: currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(249,246,239,0.5)' : '#f9f6ef',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '2px',
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'Sora, sans-serif',
                          cursor: currentMarkerIndex >= tourEntries.length - 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (currentMarkerIndex < tourEntries.length - 1) {
                            e.currentTarget.style.backgroundColor = '#333333';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(26,26,26,0.2)' : '#1a1a1a';
                        }}
                        title="Next"
                      >
                        ▶
                      </button>
                    </div>
                    
                    {/* Timer countdown display */}
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a1a1a',
                      color: '#f9f6ef',
                      borderRadius: '2px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'Sora, sans-serif',
                      letterSpacing: '0.05em',
                      minWidth: '45px',
                      textAlign: 'center'
                    }}>
                      {timeLeft}s
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                if (isPlaying) {
                  stopPlay();
                } else {
                  closeSidePanel();
                }
              }}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#f9f6ef',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: '600',
                fontFamily: 'Sora, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
            >
              {isPlaying ? (
                <span>Stop Tour</span>
              ) : (
                <>
                  <span>×</span>
                  <span>Close</span>
                </>
              )}
            </button>
          </div>

          {/* Side Panel Content */}
          <div style={{
            height: 'calc(100vh - 81px)',
            overflowY: 'auto',
            padding: '0'
          }}>
            {selectedArea && (
              <div style={{ padding: '24px', paddingBottom: '60px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  lineHeight: '1.3'
                }}>
                  {selectedArea.name}
                </h3>

                {/* Researcher Name and Collaborator - directly below title */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    lineHeight: '1.3',
                    marginBottom: '8px'
                  }}>
                    Researcher: {selectedArea.researcherName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  {selectedArea.collaborator && (
                    <div style={{
                      fontSize: '22px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      lineHeight: '1.3'
                    }}>
                      Collaborator: {selectedArea.collaborator.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '20px'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: getDepartmentColor(selectedArea.department),
                    color: '#f9f6ef',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {selectedArea.department}
                  </span>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#1a1a1a',
                    color: '#f9f6ef',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {selectedArea.term}
                  </span>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#1a1a1a80',
                    color: '#f9f6ef',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {selectedArea.type}
                  </span>
                </div>

                {/* Geographic Focus */}
                {selectedArea.geographicFocus && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '0',
                    border: '1px solid #1a1a1a20'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Geographic Focus
                    </h4>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#1a1a1a',
                      lineHeight: '1.6',
                      fontWeight: '400'
                    }}>
                      {selectedArea.geographicFocus}
                    </p>
                  </div>
                )}

                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '20px',
                  borderRadius: '0',
                  border: '1px solid #1a1a1a20'
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Project Description
                  </h4>
                  <p style={{
                    margin: '0',
                    fontSize: '14px',
                    color: '#1a1a1a',
                    lineHeight: '1.6',
                    fontWeight: '400'
                  }}>
                    {selectedArea.description}
                  </p>
                </div>

                {/* Links section - if available */}
                {selectedArea.links && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '0',
                    border: '1px solid #1a1a1a20'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Links
                    </h4>
                    <div style={{
                      fontSize: '14px',
                      color: '#1a1a1a',
                      fontWeight: '500'
                    }}>
                      {selectedArea.links.split(',').map((link, index) => {
                        const trimmedLink = link.trim();
                        if (trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')) {
                          // Extract domain name for cleaner display
                          const urlObj = new URL(trimmedLink);
                          const displayText = urlObj.hostname.replace('www.', '');
                          
                          return (
                            <div key={index} style={{ 
                              marginBottom: '8px',
                              wordBreak: 'break-all',
                              overflowWrap: 'break-word'
                            }}>
                              <a
                                href={trimmedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#dd3b00',
                                  textDecoration: 'none',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 12px',
                                  backgroundColor: '#f9f6ef',
                                  border: '1px solid #dd3b00',
                                  borderRadius: '4px',
                                  transition: 'all 0.2s ease',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.4'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#dd3b00';
                                  e.currentTarget.style.color = '#f9f6ef';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f9f6ef';
                                  e.currentTarget.style.color = '#dd3b00';
                                }}
                              >
                                <span>🔗</span>
                                <span style={{ 
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}>
                                  {displayText}
                                </span>
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div key={index} style={{ 
                              marginBottom: '8px',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: '1.4'
                            }}>
                              {trimmedLink}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedCluster && selectedCluster.isCluster && (
              <div style={{ padding: '24px 0', paddingBottom: '60px' }}>
                <div style={{ padding: '0 24px 16px 24px' }}>
                  <p style={{
                    margin: '0',
                    fontSize: '14px',
                    color: '#718096',
                    lineHeight: '1.5'
                  }}>
                    This cluster contains {selectedCluster.areas.length} research projects. Click on any project below to view its details.
                  </p>
                </div>
                
                <div style={{ overflowY: 'visible' }}>
                  {selectedCluster.areas.map((area, index) => (
                    <div
                      key={index}
                      onClick={() => handleProjectClick(area)}
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #1a1a1a20',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: `4px solid ${getDepartmentColor(area.department)}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a05';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        lineHeight: '1.3'
                      }}>
                        {area.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        {area.researcherName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#1a1a1a',
                        lineHeight: '1.4',
                        opacity: 0.8
                      }}>
                        {area.description.length > 100 
                          ? area.description.substring(0, 100) + '...' 
                          : area.description}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: getDepartmentColor(area.department),
                          color: '#f9f6ef',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {area.department}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Results Display */}
            {showingFilteredResults && !selectedArea && !selectedCluster && (
              <div style={{ padding: '24px 0', paddingBottom: '60px' }}>
                <div style={{ padding: '0 24px 16px 24px' }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Filtered Results
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '14px',
                    color: '#718096',
                    lineHeight: '1.5'
                  }}>
                    Showing {filteredAreas.length} research project{filteredAreas.length !== 1 ? 's' : ''} matching your selected filters. Click on any project below to view its details.
                  </p>
                  
                  {/* Active filters summary */}
                  <div style={{ 
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {selectedFilters.departments.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#1a1a1a' }}>
                        <strong>Departments:</strong> {selectedFilters.departments.join(', ')}
                      </div>
                    )}
                    {selectedFilters.terms.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#1a1a1a' }}>
                        <strong>Terms:</strong> {selectedFilters.terms.join(', ')}
                      </div>
                    )}
                    {selectedFilters.types.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#1a1a1a' }}>
                        <strong>Types:</strong> {selectedFilters.types.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ overflowY: 'visible' }}>
                  {filteredAreas.map((area, index) => (
                    <div
                      key={`${area.name}-${area.researcherName}-${index}`}
                      onClick={() => handleProjectClick(area)}
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #1a1a1a20',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: `4px solid ${getDepartmentColor(area.department)}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a05';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        lineHeight: '1.3'
                      }}>
                        {area.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#1a1a1a',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        Researcher: {area.researcherName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      {area.geographicFocus && (
                        <div style={{
                          fontSize: '12px',
                          color: '#1a1a1a',
                          marginBottom: '8px',
                          fontStyle: 'italic',
                          opacity: 0.9
                        }}>
                          📍 {area.geographicFocus}
                        </div>
                      )}
                      <div style={{
                        fontSize: '12px',
                        color: '#1a1a1a',
                        lineHeight: '1.4',
                        opacity: 0.8,
                        marginBottom: '8px'
                      }}>
                        {area.description.length > 120 
                          ? area.description.substring(0, 120) + '...' 
                          : area.description}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: getDepartmentColor(area.department),
                          color: '#f9f6ef',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {area.department}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: '#1a1a1a',
                          color: '#f9f6ef',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {area.term}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: '#1a1a1a80',
                          color: '#f9f6ef',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {area.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent; 