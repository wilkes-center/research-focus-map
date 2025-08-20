// Modular map container component with tour functionality and clustering
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { ResearchArea } from '../../types/ResearchArea';
import NavigationButtons from './NavigationButtons';
import MarkerRenderer from './MarkerRenderer';
import SidePanel from './SidePanel';
import { MAP_CONFIG, TOUR_CONFIG, UI_CONFIG } from '../../constants/mapConfig';

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
  const getClusterDistance = (zoom: number): number => {
    if (zoom <= 3) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_3_AND_BELOW;
    if (zoom <= 5) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_5_AND_BELOW;
    if (zoom <= 6) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_6_AND_BELOW;
    if (zoom <= 8) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_8_AND_BELOW;
    if (zoom <= 10) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_10_AND_BELOW;
    if (zoom <= 12) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_12_AND_BELOW;
    if (zoom <= 14) return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_14_AND_BELOW;
    return MAP_CONFIG.CLUSTER_DISTANCES.ZOOM_15_AND_ABOVE;
  };

  const clusterDistance = getClusterDistance(zoom);
  const clusters: MarkerCluster[] = [];
  const processed = new Set<number>();
  let selectedClusterFound = false;
  
  areas.forEach((area, index) => {
    if (processed.has(index)) return;
    
    const nearbyAreas: ResearchArea[] = [area];
    processed.add(index);
    
    areas.forEach((otherArea, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return;
      
      const latDiff = Math.abs(area.latitude - otherArea.latitude);
      const lngDiff = Math.abs(area.longitude - otherArea.longitude);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance <= clusterDistance) {
        nearbyAreas.push(otherArea);
        processed.add(otherIndex);
      }
    });
    
    const avgLng = nearbyAreas.reduce((sum, a) => sum + a.longitude, 0) / nearbyAreas.length;
    const avgLat = nearbyAreas.reduce((sum, a) => sum + a.latitude, 0) / nearbyAreas.length;
    
    const containsSelectedArea = selectedArea && 
      nearbyAreas.some(a => a.name === selectedArea.name && a.researcherName === selectedArea.researcherName);
    
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

const MapContainer: React.FC<MapComponentProps> = ({ researchAreas, selectedFilters }) => {
  const [selectedArea, setSelectedArea] = useState<ResearchArea | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<MarkerCluster | null>(null);
  const [previousCluster, setPreviousCluster] = useState<MarkerCluster | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isUofUFocused, setIsUofUFocused] = useState(false);
  const [showingFilteredResults, setShowingFilteredResults] = useState(false);
  const [viewState, setViewState] = useState(MAP_CONFIG.INITIAL_VIEW);

  // Play feature state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);
  const [playProgress, setPlayProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOUR_CONFIG.DEFAULT_DURATION);
  const [selectedTourDuration, setSelectedTourDuration] = useState(TOUR_CONFIG.DEFAULT_DURATION);
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
      if (!selectedArea && !selectedCluster) {
        setSidePanelOpen(false);
      }
    }
  }, [selectedFilters, isPlaying, selectedArea, selectedCluster]);

  // Create stable clustered markers
  const clusteredMarkers = useMemo(() => {
    let areasToCluster = isPlaying ? researchAreas : filteredAreas;
    
    if (isPlaying) {
      const termOrder = [
        'Summer 25', 'Spring 25', 'Fall 24', 'Summer 24', 'Spring 24', 'Fall 23', 
        'Summer 23', 'Spring 23', 'Fall 22', 'Summer 22', 'Spring 22', 'Fall 21',
        'Summer 21', 'Spring 21', 'Fall 20', 'Summer 20', 'Spring 20'
      ];
      
      areasToCluster = [...areasToCluster].sort((a, b) => {
        const aIndex = termOrder.indexOf(a.term);
        const bIndex = termOrder.indexOf(b.term);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.term.localeCompare(b.term);
      });
    }
    
    const markers = clusterMarkers(areasToCluster, viewState.zoom, selectedArea);
    
    if (isUofUFocused) {
      const campusMarkers = markers.filter(m => m.areas.some(a => a.mapFocus === 'Campus'));
      
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
    
    const sortedAreas = [...researchAreas].sort((a, b) => {
      const aIndex = termOrder.indexOf(a.term);
      const bIndex = termOrder.indexOf(b.term);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return a.term.localeCompare(b.term);
    });
    
    return sortedAreas;
  }, [researchAreas]);

  // Reset UofU focus when zooming out
  useEffect(() => {
    if (isUofUFocused && viewState.zoom < MAP_CONFIG.ZOOM.CAMPUS_THRESHOLD) {
      setIsUofUFocused(false);
    }
  }, [viewState.zoom, isUofUFocused]);

  const handleUtahView = () => {
    setIsUofUFocused(false);
    closeSidePanel();
    setViewState(MAP_CONFIG.VIEWS.UTAH);
  };

  const handleUCampusView = () => {
    setIsUofUFocused(true);
    closeSidePanel();
    setViewState(MAP_CONFIG.VIEWS.CAMPUS);
  };

  const handleWorldView = () => {
    setIsUofUFocused(false);
    closeSidePanel();
    setViewState(MAP_CONFIG.VIEWS.WORLD);
  };

  const closeSidePanel = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentMarkerIndex(0);
      setPlayProgress(0);
      setTimeLeft(selectedTourDuration);
      
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
    if (isPlaying) {
      console.log('⏹️ Tour stopped due to user interaction');
      stopPlay();
    }
    
    setShowingFilteredResults(false);
    
    if (cluster.isCluster) {
      if (viewState.zoom < MAP_CONFIG.ZOOM.AUTO_CLUSTER_THRESHOLD) {
        setViewState({
          ...viewState,
          longitude: cluster.longitude,
          latitude: cluster.latitude,
          zoom: Math.min(viewState.zoom + MAP_CONFIG.ZOOM.CLUSTER_ZOOM_INCREMENT, MAP_CONFIG.ZOOM.CLUSTER_MAX_ZOOM)
        });
      } else {
        setSelectedCluster(cluster);
        setSelectedArea(null);
        setSidePanelOpen(true);
      }
    } else {
      handleProjectClick(cluster.areas[0]);
    }
  };

  const handleProjectClick = (area: ResearchArea) => {
    if (isPlaying) {
      console.log('⏹️ Tour stopped due to project selection');
      stopPlay();
    }
    
    setShowingFilteredResults(false);
    
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
    }
  };

  // Play functionality
  const startPlay = () => {
    if (tourEntries.length === 0) return;
    
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    setCurrentMarkerIndex(0);
    setPlayProgress(0);
    setTimeLeft(selectedTourDuration);
    setSelectedArea(null);
    setSelectedCluster(null);
    setPreviousCluster(null);
    
    setIsPlaying(true);
    console.log(`🎬 Tour started with ${tourEntries.length} individual research areas`);
  };

  const stopPlay = () => {
    console.log('⏹️ Tour stopped');
    setIsPlaying(false);
    setCurrentMarkerIndex(0);
    setPlayProgress(0);
    setTimeLeft(selectedTourDuration);
    
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    setSidePanelOpen(false);
    setSelectedArea(null);
    setSelectedCluster(null);
    setPreviousCluster(null);
  };

  const navigateToMarker = (index: number) => {
    if (index >= tourEntries.length) {
      stopPlay();
      return;
    }

    const researchArea = tourEntries[index];
    
    const getZoomLevel = (area: ResearchArea) => {
      if (area.mapFocus === 'Campus') {
        return MAP_CONFIG.TOUR_ZOOM_LEVELS.CAMPUS;
      }
      
      const isInSaltLakeValley = area.latitude >= MAP_CONFIG.BOUNDARIES.SALT_LAKE_VALLEY.MIN_LAT && 
                                 area.latitude <= MAP_CONFIG.BOUNDARIES.SALT_LAKE_VALLEY.MAX_LAT && 
                                 area.longitude >= MAP_CONFIG.BOUNDARIES.SALT_LAKE_VALLEY.MIN_LNG && 
                                 area.longitude <= MAP_CONFIG.BOUNDARIES.SALT_LAKE_VALLEY.MAX_LNG;
      
      if (isInSaltLakeValley) {
        return MAP_CONFIG.TOUR_ZOOM_LEVELS.SALT_LAKE_VALLEY;
      }
      
      const isInUtah = area.latitude >= MAP_CONFIG.BOUNDARIES.UTAH.MIN_LAT && 
                       area.latitude <= MAP_CONFIG.BOUNDARIES.UTAH.MAX_LAT && 
                       area.longitude >= MAP_CONFIG.BOUNDARIES.UTAH.MIN_LNG && 
                       area.longitude <= MAP_CONFIG.BOUNDARIES.UTAH.MAX_LNG;
      
      if (isInUtah) {
        return MAP_CONFIG.TOUR_ZOOM_LEVELS.UTAH;
      } else {
        return MAP_CONFIG.TOUR_ZOOM_LEVELS.INTERNATIONAL;
      }
    };
    
    setViewState({
      longitude: researchArea.longitude,
      latitude: researchArea.latitude,
      zoom: getZoomLevel(researchArea)
    });

    setSelectedArea(researchArea);
    setSelectedCluster(null);
    setSidePanelOpen(true);

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    const durationMs = selectedTourDuration * 1000;
    const progressStep = TOUR_CONFIG.getProgressStep(durationMs);
    const timeDecrement = TOUR_CONFIG.getTimeDecrement(durationMs);
    
    let progress = 0;
    let timeRemaining = selectedTourDuration;
    progressTimerRef.current = setInterval(() => {
      progress += progressStep;
      timeRemaining -= timeDecrement;
      setPlayProgress(Math.min(progress, 100));
      setTimeLeft(Math.max(0, Math.ceil(timeRemaining)));
    }, TOUR_CONFIG.PROGRESS_UPDATE_INTERVAL);

    playTimerRef.current = setTimeout(() => {
      setCurrentMarkerIndex(index + 1);
      setPlayProgress(0);
      setTimeLeft(selectedTourDuration);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      navigateToMarker(index + 1);
    }, durationMs);
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

  const goToPreviousMarker = () => {
    if (currentMarkerIndex > 0) {
      setCurrentMarkerIndex(prev => prev - 1);
      setPlayProgress(0);
      setTimeLeft(selectedTourDuration);
      
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      
      navigateToMarker(currentMarkerIndex - 1);
    }
  };

  const goToNextMarker = () => {
    if (currentMarkerIndex < tourEntries.length - 1) {
      setCurrentMarkerIndex(prev => prev + 1);
      setPlayProgress(0);
      setTimeLeft(selectedTourDuration);
      
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      
      navigateToMarker(currentMarkerIndex + 1);
    }
  };

  const handleZoomIn = () => {
    setViewState({
      ...viewState,
      zoom: Math.min(viewState.zoom + MAP_CONFIG.ZOOM.STEP, MAP_CONFIG.ZOOM.MAX)
    });
  };

  const handleZoomOut = () => {
    setViewState({
      ...viewState,
      zoom: Math.max(viewState.zoom - MAP_CONFIG.ZOOM.STEP, MAP_CONFIG.ZOOM.MIN)
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex' }}>
      <div style={{ 
        flex: sidePanelOpen ? '1' : '1', 
        transition: 'all 0.3s ease',
        width: sidePanelOpen ? (isPlaying ? `calc(100% - ${UI_CONFIG.SIDE_PANEL.WIDTH_TOUR_MODE}px)` : `calc(100% - ${UI_CONFIG.SIDE_PANEL.WIDTH_NORMAL}px)`) : '100%'
      }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100vh' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          renderWorldCopies={true}
          minZoom={MAP_CONFIG.ZOOM.MIN}
          maxZoom={MAP_CONFIG.ZOOM.MAX}
          onError={(error) => {
            console.error('Mapbox error:', error);
          }}
          onLoad={() => {
            console.log('Map loaded successfully');
            console.log('Mapbox token starts with:', process.env.REACT_APP_MAPBOX_TOKEN?.substring(0, 20));
          }}
        >
          <MarkerRenderer
            clusters={clusteredMarkers}
            isPlaying={isPlaying}
            currentTourArea={tourEntries[currentMarkerIndex]}
            onClusterClick={handleClusterClick}
          />
        </Map>

        <NavigationButtons
          viewState={viewState}
          isUofUFocused={isUofUFocused}
          isPlaying={isPlaying}
          currentMarkerIndex={currentMarkerIndex}
          tourEntries={tourEntries}
          playProgress={playProgress}
          timeLeft={timeLeft}
          selectedTourDuration={selectedTourDuration}
          onWorldView={handleWorldView}
          onUtahView={handleUtahView}
          onCampusView={handleUCampusView}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onStartPlay={startPlay}
          onStopPlay={stopPlay}
          onPrevious={goToPreviousMarker}
          onNext={goToNextMarker}
          onDurationChange={setSelectedTourDuration}
        />
      </div>

      <SidePanel
        isOpen={sidePanelOpen}
        isPlaying={isPlaying}
        selectedArea={selectedArea}
        selectedCluster={selectedCluster}
        previousCluster={previousCluster}
        showingFilteredResults={showingFilteredResults}
        filteredAreas={filteredAreas}
        selectedFilters={selectedFilters}
        currentMarkerIndex={currentMarkerIndex}
        tourEntries={tourEntries}
        timeLeft={timeLeft}
        onClose={closeSidePanel}
        onBackToCluster={handleBackToCluster}
        onProjectClick={handleProjectClick}
        onStopPlay={stopPlay}
        onPrevious={goToPreviousMarker}
        onNext={goToNextMarker}
      />
    </div>
  );
};

export default MapContainer;