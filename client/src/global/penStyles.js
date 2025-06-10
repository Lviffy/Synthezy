// Placeholder icons - replace with actual icon components or paths
const PlaceholderIcon = () => "ICON";

export const PEN_TYPES = {
  REGULAR: "regular",
  HIGHLIGHTER: "highlighter",
  FOUNTAIN: "fountain",
  MARKER: "marker",
  LASER: "laser",
};

export const PEN_PROPERTIES = {
  STROKE_COLOR: "strokeColor",
  STROKE_WIDTH: "strokeWidth",
  OPACITY: "opacity",
  LINE_CAP: "lineCap", // 'round', 'square'
  // Laser Pen Specific
  LASER_DURATION: "laserDuration", // in milliseconds
  LASER_NON_PERSISTENT: "laserNonPersistent", // boolean
};

export const DEFAULT_PEN_STYLES = {
  [PEN_TYPES.REGULAR]: {
    icon: PlaceholderIcon, // Replace with actual RegularPenIcon
    label: "Pen",
    [PEN_PROPERTIES.STROKE_COLOR]: "rgb(30, 30, 30)",
    [PEN_PROPERTIES.STROKE_WIDTH]: 2,
    [PEN_PROPERTIES.OPACITY]: 1,
    [PEN_PROPERTIES.LINE_CAP]: "round",
  },
  [PEN_TYPES.HIGHLIGHTER]: {
    icon: PlaceholderIcon, // Replace with actual HighlighterPenIcon
    label: "Highlighter",
    [PEN_PROPERTIES.STROKE_COLOR]: "rgb(255, 236, 153)", // Softer yellow
    [PEN_PROPERTIES.STROKE_WIDTH]: 10,
    [PEN_PROPERTIES.OPACITY]: 0.5, // Semi-transparent
    [PEN_PROPERTIES.LINE_CAP]: "round", // Or 'square' for a flatter feel
  },
  [PEN_TYPES.FOUNTAIN]: {
    icon: PlaceholderIcon, // Replace with actual FountainPenIcon
    label: "Fountain Pen",
    [PEN_PROPERTIES.STROKE_COLOR]: "rgb(25, 113, 194)", // Classic blue ink
    [PEN_PROPERTIES.STROKE_WIDTH]: 1.5, // Base width, will vary
    [PEN_PROPERTIES.OPACITY]: 1,
    [PEN_PROPERTIES.LINE_CAP]: "round",
    // Add pressure sensitivity simulation parameters if needed
  },
  [PEN_TYPES.MARKER]: {
    icon: PlaceholderIcon, // Replace with actual MarkerPenIcon
    label: "Marker",
    [PEN_PROPERTIES.STROKE_COLOR]: "rgb(224, 49, 49)", // Bold red
    [PEN_PROPERTIES.STROKE_WIDTH]: 6,
    [PEN_PROPERTIES.OPACITY]: 1,
    [PEN_PROPERTIES.LINE_CAP]: "square", // Flat tip
  },
  [PEN_TYPES.LASER]: {
    icon: PlaceholderIcon, // Replace with actual LaserPenIcon
    label: "Laser Pointer",
    [PEN_PROPERTIES.STROKE_COLOR]: "rgb(255, 0, 0)", // Default red
    [PEN_PROPERTIES.STROKE_WIDTH]: 3,
    [PEN_PROPERTIES.OPACITY]: 0.8,
    [PEN_PROPERTIES.LINE_CAP]: "round",
    [PEN_PROPERTIES.LASER_DURATION]: 2000, // 2 seconds
    [PEN_PROPERTIES.LASER_NON_PERSISTENT]: true, // Not saved
  },
};

export const LINE_CAP_OPTIONS = [
  { slug: "round", title: "Round Cap" },
  { slug: "square", title: "Square Cap" },
];

// You might want to define ranges or steps for stroke width and opacity
export const STROKE_WIDTH_RANGE = { min: 1, max: 20, step: 1 };
export const OPACITY_RANGE = { min: 0.1, max: 1, step: 0.1 };

// Example of how you might integrate with existing STROKE_COLORS
// This assumes STROKE_COLORS is an array of color strings
// import { STROKE_COLORS } from './var';
// export const PEN_COLOR_PALETTE = STROKE_COLORS;
