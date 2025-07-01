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

// Clustering function to group nearby markers
const clusterMarkers = (areas: ResearchArea[], zoom: number): MarkerCluster[] => {
  if (zoom >= 10) {
    // At high zoom levels, group markers by exact coordinates
    const coordinateGroups: { [key: string]: ResearchArea[] } = {};
    
    areas.forEach(area => {
      const key = `${area.longitude.toFixed(6)},${area.latitude.toFixed(6)}`;
      if (!coordinateGroups[key]) {
        coordinateGroups[key] = [];
      }
      coordinateGroups[key].push(area);
    });
    
    const clusters: MarkerCluster[] = [];
    let clusterIndex = 0;
    
    Object.entries(coordinateGroups).forEach(([key, groupAreas]: [string, ResearchArea[]]) => {
      if (groupAreas.length === 1) {
        // Single marker
        clusters.push({
          id: `marker-${clusterIndex}`,
          longitude: groupAreas[0].longitude,
          latitude: groupAreas[0].latitude,
          areas: groupAreas,
          isCluster: false
        });
      } else {
        // Multiple markers at same coordinates - create a clustered marker
        clusters.push({
          id: `exact-cluster-${clusterIndex}`,
          longitude: groupAreas[0].longitude,
          latitude: groupAreas[0].latitude,
          areas: groupAreas,
          isCluster: true
        });
      }
      clusterIndex++;
    });
    
    return clusters;
  }

  // Improved clustering distance based on zoom level for lower zoom levels
  const clusterDistance = zoom < 2 ? 5 : zoom < 4 ? 2 : zoom < 6 ? 0.5 : zoom < 8 ? 0.25 : 0.1;
  const clusters: MarkerCluster[] = [];
  const processedAreas = new Set<number>();

  areas.forEach((area, index) => {
    if (processedAreas.has(index)) return;

    const nearbyAreas = [area];
    processedAreas.add(index);

    // Find nearby areas to cluster
    areas.forEach((otherArea, otherIndex) => {
      if (otherIndex === index || processedAreas.has(otherIndex)) return;

      const distance = Math.sqrt(
        Math.pow(area.longitude - otherArea.longitude, 2) +
        Math.pow(area.latitude - otherArea.latitude, 2)
      );

      if (distance <= clusterDistance) {
        nearbyAreas.push(otherArea);
        processedAreas.add(otherIndex);
      }
    });

    // Calculate cluster center
    const centerLng = nearbyAreas.reduce((sum, a) => sum + a.longitude, 0) / nearbyAreas.length;
    const centerLat = nearbyAreas.reduce((sum, a) => sum + a.latitude, 0) / nearbyAreas.length;

    clusters.push({
      id: `cluster-${index}`,
      longitude: centerLng,
      latitude: centerLat,
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
    longitude: 20,
    latitude: 0,
    zoom: 1.5
  });

  // Filter areas based on selected filters
  const filteredAreas = researchAreas.filter(area => {
    const departmentMatch = selectedFilters.departments.length === 0 || selectedFilters.departments.includes(area.category);
    const termMatch = selectedFilters.terms.length === 0 || selectedFilters.terms.includes(area.term);
    const typeMatch = selectedFilters.types.length === 0 || selectedFilters.types.includes(area.type);
    
    return departmentMatch && termMatch && typeMatch;
  });

  // Create clustered markers based on current zoom level
  const clusteredMarkers = useMemo(() => {
    return clusterMarkers(filteredAreas, viewState.zoom);
  }, [filteredAreas, viewState.zoom]);

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
      // Check if all areas in the cluster have the same coordinates
      const firstArea = cluster.areas[0];
      const allSameCoordinates = cluster.areas.every(area => 
        Math.abs(area.longitude - firstArea.longitude) < 0.000001 &&
        Math.abs(area.latitude - firstArea.latitude) < 0.000001
      );

      if (allSameCoordinates) {
        // All markers at same location, show cluster in side panel
        setSelectedCluster(cluster);
        setSelectedArea(null);
        setSidePanelOpen(true);
      } else {
        // Markers at different locations, zoom in on cluster
        setViewState({
          longitude: cluster.longitude,
          latitude: cluster.latitude,
          zoom: Math.min(viewState.zoom + 2, 15)
        });
      }
    } else {
      // Single marker, zoom to location and show in side panel
      setViewState({
        longitude: cluster.longitude,
        latitude: cluster.latitude,
        zoom: Math.max(viewState.zoom, 6)
      });
      setSelectedArea(cluster.areas[0]);
      setSelectedCluster(null);
      setSidePanelOpen(true);
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
    // For clusters, use a mixed color or default
    const departments = Array.from(new Set(areas.map(a => a.category)));
    if (departments.length === 1) {
      return getDepartmentColor(departments[0]);
    }
    return '#1a1a1a'; // Olympic Park Obsidian for mixed departments
  };

  // Enhanced marker styling function
  const getMarkerStyles = (cluster: MarkerCluster, isHovered: boolean = false) => {
    const baseColor = getClusterColor(cluster.areas);
    const isCluster = cluster.isCluster;
    const count = cluster.areas.length;
    
    if (isCluster) {
      // Cluster marker styling
      const size = Math.min(28 + count * 3, 64);
      return {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
        border: `3px solid #f9f6ef`,
        boxShadow: isHovered 
          ? `0 8px 20px rgba(26,26,26,0.4), 0 0 0 4px ${baseColor}20` 
          : `0 4px 12px rgba(26,26,26,0.25), 0 2px 4px rgba(26,26,26,0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: count > 99 ? '10px' : count > 9 ? '12px' : '14px',
        fontWeight: '700',
        color: '#f9f6ef',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
        fontFamily: 'Sora, sans-serif',
        letterSpacing: '0.02em',
        position: 'relative' as const,
        zIndex: isHovered ? 1000 : 1,
      };
    } else {
      // Single marker styling
      return {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
        border: `3px solid #f9f6ef`,
        boxShadow: isHovered 
          ? `0 8px 20px rgba(26,26,26,0.4), 0 0 0 4px ${baseColor}20` 
          : `0 4px 12px rgba(26,26,26,0.25), 0 2px 4px rgba(26,26,26,0.1)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
        fontFamily: 'Sora, sans-serif',
        position: 'relative' as const,
        zIndex: isHovered ? 1000 : 1,
      };
    }
  };

  // Pulse animation for single markers
  const getPulseAnimation = (baseColor: string) => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: `${baseColor}30`,
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
          mapStyle={getMapStyle()}
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          renderWorldCopies={true}
          minZoom={1}
          maxZoom={20}
          projection={{ name: 'mercator' }}
        >
          {/* Enhanced clustered research area markers */}
          {clusteredMarkers
            .filter(cluster => 
              isUofUFocused 
                ? cluster.areas.some(area => area.mapFocus === 'Campus')
                : true
            )
            .map((cluster) => {
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          lineHeight: '1'
                        }}>
                          {cluster.areas.length}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
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