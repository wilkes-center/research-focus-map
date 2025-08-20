// Tour controls component for managing automated research area tours
import React, { useState, useEffect, useRef } from 'react';
import { ResearchArea } from '../../types/ResearchArea';
import { UI_CONFIG, COLORS, TYPOGRAPHY, ANIMATIONS, TOUR_CONFIG } from '../../constants/mapConfig';

interface TourControlsProps {
  isPlaying: boolean;
  currentMarkerIndex: number;
  tourEntries: ResearchArea[];
  playProgress: number;
  timeLeft: number;
  selectedTourDuration: number;
  onStartPlay: () => void;
  onStopPlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDurationChange: (duration: number) => void;
}

const TourControls: React.FC<TourControlsProps> = ({
  isPlaying,
  currentMarkerIndex,
  tourEntries,
  playProgress,
  timeLeft,
  selectedTourDuration,
  onStartPlay,
  onStopPlay,
  onPrevious,
  onNext,
  onDurationChange
}) => {
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDurationDropdown(false);
      }
    };

    if (showDurationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDurationDropdown]);

  return (
    <>
      {!isPlaying ? (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDurationDropdown(!showDurationDropdown)}
            disabled={tourEntries.length === 0}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.SECONDARY,
              border: 'none',
              padding: UI_CONFIG.NAVIGATION.TOUR_BUTTON_PADDING,
              borderRadius: '2px',
              fontSize: TYPOGRAPHY.SIZES.CAPTION,
              fontWeight: TYPOGRAPHY.WEIGHTS.SEMI_BOLD,
              fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
              cursor: tourEntries.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(26,26,26,0.25)',
              transition: `all ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
              textTransform: 'uppercase',
              letterSpacing: TYPOGRAPHY.LETTER_SPACING.WIDE,
              minWidth: UI_CONFIG.NAVIGATION.BUTTON_MIN_WIDTH + 'px',
              textAlign: 'center',
              opacity: tourEntries.length === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: UI_CONFIG.NAVIGATION.BUTTON_GAP + 'px',
              position: 'relative',
              overflow: 'visible'
            }}
            onMouseEnter={(e) => {
              if (tourEntries.length > 0) {
                e.currentTarget.style.backgroundColor = '#2d7d32';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>▶️</span>
            <span>Start Tour</span>
            <span style={{ marginLeft: '4px' }}>▼</span>
          </button>

          {/* Duration Dropdown */}
          {showDurationDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: COLORS.SECONDARY,
              border: `1px solid ${COLORS.PRIMARY}30`,
              borderRadius: '2px',
              boxShadow: '0 4px 12px rgba(26,26,26,0.3)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {TOUR_CONFIG.DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onDurationChange(option.value);
                    setShowDurationDropdown(false);
                    onStartPlay();
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: COLORS.PRIMARY,
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: TYPOGRAPHY.SIZES.CAPTION,
                    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
                    fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
                    cursor: 'pointer',
                    transition: `all ${ANIMATIONS.TRANSITIONS.FAST} ${ANIMATIONS.EASING.EASE}`,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>Start Tour ({option.label})</span>
                  {selectedTourDuration === option.value && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={onStopPlay}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.SECONDARY,
              border: 'none',
              padding: UI_CONFIG.NAVIGATION.TOUR_BUTTON_PADDING,
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
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: UI_CONFIG.NAVIGATION.BUTTON_GAP + 'px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              backgroundColor: COLORS.SECONDARY,
              width: `${playProgress}%`,
              transition: `width ${ANIMATIONS.TRANSITIONS.FAST} ${ANIMATIONS.EASING.EASE}`
            }} />
            <span>Stop Tour</span>
          </button>

          <div style={{
            backgroundColor: COLORS.SECONDARY,
            border: `1px solid ${COLORS.PRIMARY}20`,
            borderRadius: '2px',
            padding: UI_CONFIG.NAVIGATION.BUTTON_PADDING,
            boxShadow: '0 2px 8px rgba(26,26,26,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '120px',
            marginTop: UI_CONFIG.NAVIGATION.BUTTON_GAP + 'px'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px'
            }}>
              <button
                onClick={onPrevious}
                disabled={currentMarkerIndex <= 0}
                style={{
                  backgroundColor: currentMarkerIndex <= 0 ? COLORS.DISABLED : COLORS.PRIMARY,
                  color: currentMarkerIndex <= 0 ? 'rgba(26,26,26,0.4)' : COLORS.SECONDARY,
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  fontSize: TYPOGRAPHY.SIZES.SMALL_TEXT,
                  fontWeight: TYPOGRAPHY.WEIGHTS.SEMI_BOLD,
                  fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
                  cursor: currentMarkerIndex <= 0 ? 'not-allowed' : 'pointer',
                  transition: `all ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
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
                  e.currentTarget.style.backgroundColor = currentMarkerIndex <= 0 ? COLORS.DISABLED : COLORS.PRIMARY;
                }}
                title="Previous"
              >
                ◀
              </button>

              <button
                onClick={onNext}
                disabled={currentMarkerIndex >= tourEntries.length - 1}
                style={{
                  backgroundColor: currentMarkerIndex >= tourEntries.length - 1 ? COLORS.DISABLED : COLORS.PRIMARY,
                  color: currentMarkerIndex >= tourEntries.length - 1 ? 'rgba(26,26,26,0.4)' : COLORS.SECONDARY,
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  fontSize: TYPOGRAPHY.SIZES.SMALL_TEXT,
                  fontWeight: TYPOGRAPHY.WEIGHTS.SEMI_BOLD,
                  fontFamily: TYPOGRAPHY.FONTS.SECONDARY,
                  cursor: currentMarkerIndex >= tourEntries.length - 1 ? 'not-allowed' : 'pointer',
                  transition: `all ${ANIMATIONS.TRANSITIONS.NORMAL} ${ANIMATIONS.EASING.EASE}`,
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
                  e.currentTarget.style.backgroundColor = currentMarkerIndex >= tourEntries.length - 1 ? COLORS.DISABLED : COLORS.PRIMARY;
                }}
                title="Next"
              >
                ▶
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TourControls;