// Navigation buttons component for map view controls and zoom
import React from 'react';
import TourControls from './TourControls';
import { ResearchArea } from '../../types/ResearchArea';
import { UI_CONFIG, COLORS, TYPOGRAPHY, ANIMATIONS } from '../../constants/mapConfig';

interface NavigationButtonsProps {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  isUofUFocused: boolean;
  isPlaying: boolean;
  currentMarkerIndex: number;
  tourEntries: ResearchArea[];
  playProgress: number;
  timeLeft: number;
  selectedTourDuration: number;
  onWorldView: () => void;
  onUtahView: () => void;
  onCampusView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onStartPlay: () => void;
  onStopPlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDurationChange: (duration: number) => void;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  viewState,
  isUofUFocused,
  isPlaying,
  currentMarkerIndex,
  tourEntries,
  playProgress,
  timeLeft,
  selectedTourDuration,
  onWorldView,
  onUtahView,
  onCampusView,
  onZoomIn,
  onZoomOut,
  onStartPlay,
  onStopPlay,
  onPrevious,
  onNext,
  onDurationChange
}) => {
  return (
    <>
      {/* View Buttons */}
      <div style={{
        position: 'absolute',
        top: UI_CONFIG.NAVIGATION.TOP_OFFSET + 'px',
        right: UI_CONFIG.NAVIGATION.RIGHT_OFFSET + 'px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: UI_CONFIG.NAVIGATION.BUTTON_GAP + 'px'
      }}>
        {/* Tour Controls */}
        <TourControls
          isPlaying={isPlaying}
          currentMarkerIndex={currentMarkerIndex}
          tourEntries={tourEntries}
          playProgress={playProgress}
          timeLeft={timeLeft}
          selectedTourDuration={selectedTourDuration}
          onStartPlay={onStartPlay}
          onStopPlay={onStopPlay}
          onPrevious={onPrevious}
          onNext={onNext}
          onDurationChange={onDurationChange}
        />

        {/* World View button */}
        <button
          onClick={onWorldView}
          style={{
            backgroundColor: viewState.zoom <= 3 ? COLORS.ACCENT : COLORS.PRIMARY,
            color: COLORS.SECONDARY,
            border: 'none',
            padding: UI_CONFIG.NAVIGATION.BUTTON_PADDING,
            borderRadius: '2px',
            fontSize: TYPOGRAPHY.SIZES.CAPTION,
            fontWeight: TYPOGRAPHY.WEIGHTS.SEMI_BOLD,
            fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
            transition: `all ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
            textTransform: 'uppercase',
            letterSpacing: TYPOGRAPHY.LETTER_SPACING.WIDE,
            minWidth: UI_CONFIG.NAVIGATION.BUTTON_MIN_WIDTH + 'px',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            if (viewState.zoom > 3) {
              e.currentTarget.style.backgroundColor = COLORS.ACCENT;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = viewState.zoom <= 3 ? COLORS.ACCENT : COLORS.PRIMARY;
          }}
        >
          🌍 World View
        </button>

        {/* Utah View button */}
        <button
          onClick={onUtahView}
          style={{
            backgroundColor: (viewState.zoom > 5 && viewState.zoom < 10 && !isUofUFocused) ? COLORS.ACCENT : COLORS.PRIMARY,
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
          onClick={onCampusView}
          style={{
            backgroundColor: isUofUFocused ? COLORS.ACCENT : COLORS.PRIMARY,
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
        bottom: UI_CONFIG.ZOOM_CONTROLS.BOTTOM_OFFSET + 'px',
        left: UI_CONFIG.ZOOM_CONTROLS.LEFT_OFFSET + 'px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        backgroundColor: COLORS.SECONDARY,
        border: `1px solid ${COLORS.PRIMARY}20`,
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(26,26,26,0.15)'
      }}>
        {/* Zoom In button */}
        <button
          onClick={onZoomIn}
          style={{
            backgroundColor: COLORS.SECONDARY,
            color: COLORS.PRIMARY,
            border: 'none',
            padding: UI_CONFIG.ZOOM_CONTROLS.BUTTON_PADDING + 'px',
            fontSize: TYPOGRAPHY.SIZES.BODY_LARGE,
            fontWeight: TYPOGRAPHY.WEIGHTS.SEMI_BOLD,
            fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
            cursor: 'pointer',
            transition: `all ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
            width: UI_CONFIG.ZOOM_CONTROLS.BUTTON_SIZE + 'px',
            height: UI_CONFIG.ZOOM_CONTROLS.BUTTON_SIZE + 'px',
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
          onClick={onZoomOut}
          style={{
            backgroundColor: COLORS.SECONDARY,
            color: COLORS.PRIMARY,
            border: 'none',
            padding: UI_CONFIG.ZOOM_CONTROLS.BUTTON_PADDING + 'px',
            fontSize: TYPOGRAPHY.SIZES.BODY_LARGE,
            fontWeight: TYPOGRAPHY.WEIGHTS.SEMI_BOLD,
            fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
            cursor: 'pointer',
            transition: `all ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
            width: UI_CONFIG.ZOOM_CONTROLS.BUTTON_SIZE + 'px',
            height: UI_CONFIG.ZOOM_CONTROLS.BUTTON_SIZE + 'px',
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
    </>
  );
};

export default NavigationButtons;