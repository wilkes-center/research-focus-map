// Side panel component for displaying research area details and filtered results
import React from 'react';
import { ResearchArea } from '../../types/ResearchArea';
import { getDepartmentColor } from '../../utils/mapUtils';
import { UI_CONFIG } from '../../constants/mapConfig';

interface MarkerCluster {
  id: string;
  longitude: number;
  latitude: number;
  areas: ResearchArea[];
  isCluster: boolean;
}

interface SidePanelProps {
  isOpen: boolean;
  isPlaying: boolean;
  selectedArea: ResearchArea | null;
  selectedCluster: MarkerCluster | null;
  previousCluster: MarkerCluster | null;
  showingFilteredResults: boolean;
  filteredAreas: ResearchArea[];
  selectedFilters: {
    departments: string[];
    terms: string[];
    types: string[];
  };
  currentMarkerIndex: number;
  tourEntries: ResearchArea[];
  timeLeft: number;
  onClose: () => void;
  onBackToCluster: () => void;
  onProjectClick: (area: ResearchArea) => void;
  onStopPlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  isPlaying,
  selectedArea,
  selectedCluster,
  previousCluster,
  showingFilteredResults,
  filteredAreas,
  selectedFilters,
  currentMarkerIndex,
  tourEntries,
  timeLeft,
  onClose,
  onBackToCluster,
  onProjectClick,
  onStopPlay,
  onPrevious,
  onNext
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      width: isPlaying ? UI_CONFIG.SIDE_PANEL.WIDTH_TOUR_MODE + 'px' : UI_CONFIG.SIDE_PANEL.WIDTH_NORMAL + 'px',
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
      {/* Header */}
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
          {selectedArea && previousCluster && (
            <button
              onClick={onBackToCluster}
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
                  <button
                    onClick={onPrevious}
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
                  
                  <button
                    onClick={onNext}
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
              onStopPlay();
            } else {
              onClose();
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

      {/* Content */}
      <div style={{
        height: `calc(100vh - ${UI_CONFIG.SIDE_PANEL.HEADER_HEIGHT}px)`,
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
                  onClick={() => onProjectClick(area)}
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
                  onClick={() => onProjectClick(area)}
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
  );
};

export default SidePanel;