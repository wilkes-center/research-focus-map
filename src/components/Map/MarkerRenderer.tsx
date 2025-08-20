// Marker rendering component for map clusters and individual research areas
import React, { useState } from 'react';
import { Marker } from 'react-map-gl';
import { ResearchArea } from '../../types/ResearchArea';
import { getDepartmentColor } from '../../utils/mapUtils';
import { MARKER_CONFIG, COLORS, TYPOGRAPHY, ANIMATIONS } from '../../constants/mapConfig';

interface MarkerCluster {
  id: string;
  longitude: number;
  latitude: number;
  areas: ResearchArea[];
  isCluster: boolean;
}

interface MarkerRendererProps {
  clusters: MarkerCluster[];
  isPlaying: boolean;
  currentTourArea: ResearchArea | null;
  onClusterClick: (cluster: MarkerCluster) => void;
}

const MapPinIcon = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size + MARKER_CONFIG.PIN.WIDTH_OFFSET}
    height={size + MARKER_CONFIG.PIN.HEIGHT_OFFSET}
    viewBox={MARKER_CONFIG.PIN.VIEWBOX}
    style={{
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
      transform: `translateY(${MARKER_CONFIG.PIN.TRANSLATE_Y}px)`
    }}
  >
    <path
      d="M12 0C5.373 0 0 5.373 0 12c0 12 12 20 12 20s12-8 12-20C24 5.373 18.627 0 12 0z"
      fill={color}
      stroke={COLORS.BACKGROUND.WHITE}
      strokeWidth={MARKER_CONFIG.PIN.STROKE_WIDTH}
    />
    <circle
      cx="12"
      cy="12"
      r={MARKER_CONFIG.PIN.INNER_CIRCLE_RADIUS}
      fill={COLORS.BACKGROUND.WHITE}
      opacity={MARKER_CONFIG.PIN.OPACITY}
    />
    <circle
      cx="12"
      cy="12"
      r={MARKER_CONFIG.PIN.OUTER_CIRCLE_RADIUS}
      fill={color}
    />
  </svg>
);

const MarkerRenderer: React.FC<MarkerRendererProps> = ({
  clusters,
  isPlaying,
  currentTourArea,
  onClusterClick
}) => {
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  const getClusterColor = (areas: ResearchArea[]) => {
    if (areas.length === 1) {
      return getDepartmentColor(areas[0].department);
    }
    
    const deptCounts: { [key: string]: number } = {};
    areas.forEach(area => {
      deptCounts[area.department] = (deptCounts[area.department] || 0) + 1;
    });
    
    const mostCommonDept = Object.entries(deptCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return getDepartmentColor(mostCommonDept);
  };

  const getMarkerStyles = (cluster: MarkerCluster, isHovered: boolean = false) => {
    const isSelected = cluster.id === 'selected-cluster';
    const isCurrentlyToured = isPlaying && currentTourArea && 
      cluster.areas.some(area => area.name === currentTourArea.name && 
                                area.researcherName === currentTourArea.researcherName);
    const isSpecial = isSelected || isCurrentlyToured;
    
    const baseSize = cluster.isCluster ? 
      Math.min(MARKER_CONFIG.SIZES.CLUSTER_MAX, Math.max(MARKER_CONFIG.SIZES.CLUSTER_MIN, 20 + cluster.areas.length * MARKER_CONFIG.SIZES.CLUSTER_SIZE_MULTIPLIER)) : 
      MARKER_CONFIG.SIZES.SINGLE_MARKER;
    const size = isCurrentlyToured ? baseSize * MARKER_CONFIG.SIZES.TOUR_MARKER_MULTIPLIER : baseSize;
    
    const scale = isHovered ? MARKER_CONFIG.SCALE.HOVER : (isCurrentlyToured ? MARKER_CONFIG.SCALE.TOUR : (isSelected ? MARKER_CONFIG.SCALE.SELECTED : 1));
    
    const shadow = isCurrentlyToured ? 
      '0 12px 35px rgba(138, 43, 226, 0.6), 0 0 0 4px rgba(138, 43, 226, 0.3), 0 0 20px rgba(138, 43, 226, 0.4)' : 
      (isSelected ? '0 8px 25px rgba(255, 107, 53, 0.4), 0 0 0 3px rgba(255, 107, 53, 0.2)' : 
      (isHovered ? '0 6px 20px rgba(26,26,26,0.3)' : '0 2px 10px rgba(26,26,26,0.2)'));
    
    const finalColor = isCurrentlyToured ? COLORS.TOUR_PRIMARY : (isSelected ? COLORS.TOUR_SELECTED : getClusterColor(cluster.areas));
    
    return {
      position: 'relative' as const,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: finalColor,
      borderRadius: '50%',
      border: `${isCurrentlyToured ? MARKER_CONFIG.BORDER.TOUR : MARKER_CONFIG.BORDER.NORMAL}px solid ${isCurrentlyToured ? COLORS.BACKGROUND.WHITE : (isSpecial ? COLORS.BACKGROUND.WHITE : (isHovered ? COLORS.SECONDARY : COLORS.BACKGROUND.WHITE))}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cluster.isCluster ? 
        `${Math.min(18, Math.max(12, (8 + cluster.areas.length) * (isCurrentlyToured ? 1.2 : 1)))}px` : 
        `${isCurrentlyToured ? 18 : 14}px`,
      fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
      color: COLORS.BACKGROUND.WHITE,
      fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
      boxShadow: shadow,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      transition: `transform ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}, box-shadow ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}, background-color ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
      zIndex: isCurrentlyToured ? MARKER_CONFIG.Z_INDEX.TOUR : (isSpecial ? MARKER_CONFIG.Z_INDEX.SELECTED : (isHovered ? MARKER_CONFIG.Z_INDEX.HOVERED : MARKER_CONFIG.Z_INDEX.NORMAL)),
      textShadow: '0 1px 2px rgba(26,26,26,0.3)',
    };
  };

  const getPulseAnimation = (baseColor: string, isSelected: boolean = false, isCurrentlyToured: boolean | null = false) => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: `${MARKER_CONFIG.PULSE.SIZE_PERCENTAGE}%`,
    height: `${MARKER_CONFIG.PULSE.SIZE_PERCENTAGE}%`,
    borderRadius: '50%',
    background: isSelected || isCurrentlyToured ? `${COLORS.TOUR_SELECTED}${Math.round(MARKER_CONFIG.PULSE.OPACITY * 255).toString(16)}` : `${baseColor}${Math.round(MARKER_CONFIG.PULSE.OPACITY * 255).toString(16)}`,
    transform: 'translate(-50%, -50%)',
    animation: ANIMATIONS.KEYFRAMES.MARKER_PULSE,
    zIndex: -1,
  });

  return (
    <>
      {clusters.map((cluster) => {
        const isHovered = hoveredMarkerId === cluster.id;
        const isCurrentlyToured = isPlaying && currentTourArea && 
          cluster.areas.some(area => area.name === currentTourArea.name && 
                            area.researcherName === currentTourArea.researcherName);
        const isSpecial = cluster.id === 'selected-cluster' || isCurrentlyToured;
        
        const shouldShowAsPin = isSpecial && (!cluster.isCluster || isCurrentlyToured);
        
        return (
          <Marker
            key={cluster.id}
            longitude={cluster.longitude}
            latitude={cluster.latitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              onClusterClick(cluster);
            }}
          >
            {shouldShowAsPin ? (
              <div
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  transform: `scale(${isHovered ? MARKER_CONFIG.SCALE.HOVER : MARKER_CONFIG.SCALE.SELECTED})`,
                  transformOrigin: 'center bottom',
                  transition: `transform ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
                  zIndex: MARKER_CONFIG.Z_INDEX.SELECTED
                }}
                onMouseEnter={() => setHoveredMarkerId(cluster.id)}
                onMouseLeave={() => setHoveredMarkerId(null)}
              >
                <MapPinIcon 
                  color={isCurrentlyToured ? COLORS.TOUR_PRIMARY : COLORS.TOUR_SELECTED}
                  size={MARKER_CONFIG.SIZES.SINGLE_MARKER} 
                />
                
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
                    {cluster.areas[0].name}
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
                {!cluster.isCluster && (
                  <div style={getPulseAnimation(getClusterColor(cluster.areas), cluster.id === 'selected-cluster', isCurrentlyToured)} />
                )}
                
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
    </>
  );
};

export default MarkerRenderer;