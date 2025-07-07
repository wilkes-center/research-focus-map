import React, { useState, useMemo } from 'react';
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
const clusterMarkers = (areas: ResearchArea[], zoom: number): MarkerCluster[] => {
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
    
    clusters.push({
      id: `cluster-${clusters.length}`,
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
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isUofUFocused, setIsUofUFocused] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2
  });

  // Filter areas based on selected filters
  const filteredAreas = researchAreas.filter(area => {
    const departmentMatch = selectedFilters.departments.length === 0 || selectedFilters.departments.includes(area.category);
    const termMatch = selectedFilters.terms.length === 0 || selectedFilters.terms.includes(area.term);
    const typeMatch = selectedFilters.types.length === 0 || selectedFilters.types.includes(area.type);
    
    return departmentMatch && termMatch && typeMatch;
  });

  // Create stable clustered markers (not dependent on zoom level)
  const clusteredMarkers = useMemo(() => {
    const markers = clusterMarkers(filteredAreas, viewState.zoom);
    
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
  }, [filteredAreas, viewState.zoom, isUofUFocused]);

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
    setSidePanelOpen(false);
    setSelectedArea(null);
    setSelectedCluster(null);
  };

  const handleClusterClick = (cluster: MarkerCluster) => {
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
    setSelectedArea(area);
    setSelectedCluster(null);
    setSidePanelOpen(true);
  };

  const getClusterColor = (areas: ResearchArea[]) => {
    if (areas.length === 1) {
      return getDepartmentColor(areas[0].category);
    }
    
    // For clusters, use the most common department color
    const deptCounts: { [key: string]: number } = {};
    areas.forEach(area => {
      deptCounts[area.category] = (deptCounts[area.category] || 0) + 1;
    });
    
    const mostCommonDept = Object.entries(deptCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return getDepartmentColor(mostCommonDept);
  };

  const getMarkerStyles = (cluster: MarkerCluster, isHovered: boolean = false) => {
    const baseColor = getClusterColor(cluster.areas);
    const size = cluster.isCluster ? 
      Math.min(60, Math.max(30, 20 + cluster.areas.length * 3)) : 
      28;
    
    const scale = isHovered ? 1.1 : 1;
    const shadow = isHovered ? '0 6px 20px rgba(26,26,26,0.3)' : '0 2px 10px rgba(26,26,26,0.2)';
    
    return {
      position: 'relative' as const,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: baseColor,
      borderRadius: cluster.isCluster ? '50%' : '50%',
      border: `2px solid ${isHovered ? '#f9f6ef' : '#ffffff'}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cluster.isCluster ? 
        `${Math.min(14, Math.max(10, 8 + cluster.areas.length))}px` : 
        '14px',
      fontWeight: '700',
      color: '#ffffff',
      fontFamily: 'Sora, sans-serif',
      boxShadow: shadow,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      zIndex: isHovered ? 1000 : 'auto',
      textShadow: '0 1px 2px rgba(26,26,26,0.3)',
    };
  };

  // Simplified pulse animation
  const getPulseAnimation = (baseColor: string) => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '120%',
    height: '120%',
    borderRadius: '50%',
    background: `${baseColor}20`,
    transform: 'translate(-50%, -50%)',
    animation: 'markerPulse 2s infinite',
    zIndex: -1,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex' }}>
      {/* Map Container */}
      <div style={{ 
        flex: sidePanelOpen ? '1' : '1', 
        transition: 'all 0.3s ease',
        width: sidePanelOpen ? 'calc(100% - 400px)' : '100%'
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
                <div
                  style={getMarkerStyles(cluster, isHovered)}
                  onMouseEnter={() => setHoveredMarkerId(cluster.id)}
                  onMouseLeave={() => setHoveredMarkerId(null)}
                >
                  {/* Pulse animation for single markers */}
                  {!cluster.isCluster && (
                    <div style={getPulseAnimation(getClusterColor(cluster.areas))} />
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

                  {/* Hover tooltip */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: '120%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#1a1a1a',
                      color: '#f9f6ef',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(26,26,26,0.3)',
                      zIndex: 1001,
                      fontFamily: 'Sora, sans-serif',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      animation: 'tooltipFade 0.2s ease-in-out'
                    }}>
                      {cluster.isCluster 
                        ? `${cluster.areas.length} Research Projects`
                        : cluster.areas[0].name.length > 30 
                          ? cluster.areas[0].name.substring(0, 30) + '...'
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
      </div>

      {/* Side Panel */}
      {sidePanelOpen && (
        <div style={{
          width: '400px',
          height: '100vh',
          backgroundColor: '#f9f6ef',
          borderLeft: '1px solid #1a1a1a20',
          boxShadow: '-4px 0 12px rgba(26,26,26,0.1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
          zIndex: 1001
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
            <button
              onClick={closeSidePanel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#1a1a1a',
                padding: '4px',
                borderRadius: '2px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
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
                    Researcher: {selectedArea.researcherName}
                  </div>
                  {selectedArea.collaborator && (
                    <div style={{
                      fontSize: '22px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      lineHeight: '1.3'
                    }}>
                      Collaborator: {selectedArea.collaborator}
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
                    backgroundColor: getDepartmentColor(selectedArea.category),
                    color: '#f9f6ef',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {selectedArea.category}
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

                {/* Geographic Focus */}
                {selectedArea.geographicFocus && (
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
                          return (
                            <div key={index} style={{ marginBottom: '4px' }}>
                              <a
                                href={trimmedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#dd3b00',
                                  textDecoration: 'underline',
                                  fontSize: '14px',
                                  fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#751d0c';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#dd3b00';
                                }}
                              >
                                {trimmedLink}
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div key={index} style={{ marginBottom: '4px' }}>
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
                        borderLeft: `4px solid ${getDepartmentColor(area.category)}`
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
                          backgroundColor: getDepartmentColor(area.category),
                          color: '#f9f6ef',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {area.category}
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