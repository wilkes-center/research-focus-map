// Configuration constants for map settings, UI layout, and application behavior
export const MAP_CONFIG = {
  // Initial view state
  INITIAL_VIEW: {
    longitude: 0,
    latitude: 20,
    zoom: 2
  },

  // Predefined map views
  VIEWS: {
    WORLD: {
      longitude: 20,
      latitude: 0,
      zoom: 1.5
    },
    UTAH: {
      longitude: -111.6,
      latitude: 39.3,
      zoom: 6.5
    },
    CAMPUS: {
      longitude: -111.8360,
      latitude: 40.7640,
      zoom: 14.9
    }
  },

  // Zoom configuration
  ZOOM: {
    MIN: 1,
    MAX: 20,
    STEP: 1,
    AUTO_CLUSTER_THRESHOLD: 12,
    CAMPUS_THRESHOLD: 12,
    CLUSTER_ZOOM_INCREMENT: 3,
    CLUSTER_MAX_ZOOM: 15
  },

  // Clustering distances based on zoom level
  CLUSTER_DISTANCES: {
    ZOOM_3_AND_BELOW: 2.0,
    ZOOM_5_AND_BELOW: 1.0,
    ZOOM_6_AND_BELOW: 0.1,
    ZOOM_8_AND_BELOW: 0.05,
    ZOOM_10_AND_BELOW: 0.02,
    ZOOM_12_AND_BELOW: 0.01,
    ZOOM_14_AND_BELOW: 0.005,
    ZOOM_15_AND_ABOVE: 0.001
  },

  // Geographic boundaries
  BOUNDARIES: {
    SALT_LAKE_VALLEY: {
      MIN_LAT: 40.4,
      MAX_LAT: 40.9,
      MIN_LNG: -112.2,
      MAX_LNG: -111.6
    },
    UTAH: {
      MIN_LAT: 37.0,
      MAX_LAT: 42.0,
      MIN_LNG: -114.0,
      MAX_LNG: -109.0
    }
  },

  // Tour mode zoom levels based on location
  TOUR_ZOOM_LEVELS: {
    CAMPUS: 16,
    SALT_LAKE_VALLEY: 10,
    UTAH: 6.5,
    INTERNATIONAL: 3
  }
};

// Tour Configuration Constants
export const TOUR_CONFIG = {
  // Duration options
  DURATION_OPTIONS: [
    { label: '15s', value: 15, milliseconds: 15000 },
    { label: '30s', value: 30, milliseconds: 30000 },
    { label: '60s', value: 60, milliseconds: 60000 }
  ],
  DEFAULT_DURATION: 60, // seconds
  
  // Timing
  PROGRESS_UPDATE_INTERVAL: 100, // 100ms for smooth progress bar

  // Progress calculation helper function
  getProgressStep: (durationMs: number) => 100 / durationMs, // Progress increment per 100ms
  getTimeDecrement: (durationMs: number) => (durationMs / 1000) / (durationMs / 100) // Time decrease per 100ms
};

// UI Layout Constants
export const UI_CONFIG = {
  // Header
  HEADER_HEIGHT: 60,
  HEADER_PADDING: 12,

  // Side panel
  SIDE_PANEL: {
    WIDTH_NORMAL: 400,
    WIDTH_TOUR_MODE: 600,
    HEADER_HEIGHT: 81
  },

  // Navigation controls
  NAVIGATION: {
    TOP_OFFSET: 20,
    RIGHT_OFFSET: 20,
    BUTTON_GAP: 8,
    BUTTON_MIN_WIDTH: 140,
    BUTTON_PADDING: '10px 16px',
    TOUR_BUTTON_PADDING: '12px 18px'
  },

  // Zoom controls
  ZOOM_CONTROLS: {
    BOTTOM_OFFSET: 80,
    LEFT_OFFSET: 20,
    BUTTON_SIZE: 32,
    BUTTON_PADDING: 8
  },

  // Category filter
  CATEGORY_FILTER: {
    TOP_OFFSET: 80,
    LEFT_OFFSET: 20,
    MIN_WIDTH_EXPANDED: 360,
    MAX_WIDTH_EXPANDED: 420,
    MAX_HEIGHT_EXPANDED: '85vh',
    SECTION_MARGIN_BOTTOM: 28,
    GRID_MIN_COLUMN_WIDTH: 120,
    GRID_GAP: 8,
    MAX_HEIGHT: 180
  }
};

// Marker Configuration Constants
export const MARKER_CONFIG = {
  // Base sizes
  SIZES: {
    SINGLE_MARKER: 28,
    CLUSTER_MIN: 30,
    CLUSTER_MAX: 60,
    CLUSTER_SIZE_MULTIPLIER: 3,
    TOUR_MARKER_MULTIPLIER: 3
  },

  // Scaling factors
  SCALE: {
    HOVER: 1.1,
    SELECTED: 1.15,
    TOUR: 1.3
  },

  // Z-index values
  Z_INDEX: {
    NORMAL: 'auto',
    HOVERED: 1000,
    SELECTED: 1002,
    TOUR: 1003,
    TOOLTIP: 999999
  },

  // Border widths
  BORDER: {
    NORMAL: 2,
    TOUR: 3
  },

  // Pin icon configuration
  PIN: {
    WIDTH_OFFSET: 8,
    HEIGHT_OFFSET: 12,
    VIEWBOX: '0 0 24 32',
    TRANSLATE_Y: -4,
    STROKE_WIDTH: 1.5,
    INNER_CIRCLE_RADIUS: 6,
    OUTER_CIRCLE_RADIUS: 3,
    OPACITY: 0.9
  },

  // Pulse animation
  PULSE: {
    SIZE_PERCENTAGE: 120,
    OPACITY: 0.2,
    DURATION: '2s'
  }
};

// Color Configuration
export const COLORS = {
  // Brand colors
  PRIMARY: '#1a1a1a',
  SECONDARY: '#f9f6ef',
  ACCENT: '#dd3b00',
  
  // Tour mode colors
  TOUR_PRIMARY: '#8A2BE2', // Purple
  TOUR_SELECTED: '#ff6b35', // Orange

  // Backgrounds
  BACKGROUND: {
    LIGHT: '#f9f6ef',
    DARK: '#1a1a1a',
    WHITE: '#ffffff',
    TRANSPARENT_OVERLAY: 'rgba(249, 246, 239, 0.3)',
    BLUR_BACKDROP: 'blur(10px)'
  },

  // States
  HOVER: '#1a1a1a10',
  DISABLED: 'rgba(26,26,26,0.2)',
  SHADOW: 'rgba(26,26,26,0.3)',
  
  // Department colors (from mapUtils)
  DEPARTMENTS: {
    'ENVST': '#4ade80',
    'Environmental Studies': '#4ade80',
    'Atmospheric Sciences': '#4ade80',
    'Biology': '#22c55e',
    'School of Biological Sciences': '#22c55e',
    'Ecology': '#22c55e',
    'Chemistry': '#3b82f6',
    'Materials Science Engineering': '#3b82f6',
    'Geology & Geophysics': '#a855f7',
    'Department of Geology and Geophysics': '#a855f7',
    'Anthropology': '#f59e0b',
    'Communication': '#f59e0b',
    'Civil & Environmental Engineering': '#ef4444',
    'Medicine': '#ef4444',
    'Biomedical Engineering': '#ef4444',
    'Biomedical Informatics': '#ef4444',
    'Mathematics': '#6366f1',
    'Gender Studies': '#ec4899',
    'Sociology': '#ec4899',
    'Psychology': '#ec4899',
    'Political Science': '#ec4899'
  }
};

// Animation Configuration
export const ANIMATIONS = {
  // Transition durations
  TRANSITIONS: {
    FAST: '0.1s',
    NORMAL: '0.2s',
    SLOW: '0.3s'
  },

  // Easing functions
  EASING: {
    EASE: 'ease',
    EASE_IN_OUT: 'ease-in-out'
  },

  // Keyframe animations
  KEYFRAMES: {
    MARKER_PULSE: 'markerPulse 2s infinite',
    TOOLTIP_FADE: 'tooltipFade 0.2s ease-in-out'
  }
};

// Typography Configuration
export const TYPOGRAPHY = {
  // Font families
  FONTS: {
    PRIMARY: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
    SECONDARY: 'Sora, sans-serif'
  },

  // Font sizes
  SIZES: {
    SMALL: '9px',
    EXTRA_SMALL: '10px',
    CAPTION: '11px',
    SMALL_TEXT: '12px',
    BODY: '13px',
    BODY_LARGE: '14px',
    SUBHEADING: '15px',
    HEADING_SMALL: '16px',
    HEADING_MEDIUM: '18px',
    HEADING_LARGE: '20px',
    HEADING_XL: '22px',
    BUTTON_LARGE: '24px'
  },

  // Font weights
  WEIGHTS: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMI_BOLD: '600',
    BOLD: '700'
  },

  // Letter spacing
  LETTER_SPACING: {
    TIGHT: '-0.01em',
    NORMAL: '0.01em',
    WIDE: '0.05em',
    EXTRA_WIDE: '0.08em'
  },

  // Line heights
  LINE_HEIGHTS: {
    TIGHT: '1.3',
    NORMAL: '1.4',
    RELAXED: '1.5',
    LOOSE: '1.6'
  }
};

// App Loading Configuration
export const APP_CONFIG = {
  // Loading states
  LOADING: {
    MINIMUM_DURATION: 2000, // 2 seconds
    MESSAGE_DELAY: 1000, // 1 second
    MESSAGES: {
      INITIAL: 'Loading Research Areas...',
      DATA: 'Loading research data...',
      LOCATION: 'Loading location data...'
    }
  }
};

// CSV Parser Configuration
export const CSV_CONFIG = {
  // Default campus coordinates (University of Utah)
  CAMPUS_CENTER: {
    lat: 40.76407,
    lng: -111.84360
  },

  // File paths for different environments
  PATHS: [
    '/ResearchFocus.csv',
    '/research-focus-map/ResearchFocus.csv',
    './ResearchFocus.csv'
  ]
};