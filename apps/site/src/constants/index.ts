export const LAYOUT = {
  BLOB_CONTAINER_SIZE: 722,
  CONTAINER_ASPECT_RATIO: 1,
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

export const ANIMATION = {
  DELAYS: {
    FAST: 50,
    MEDIUM: 100,
    SLOW: 150,
    SLOWER: 200,
    SLOWEST: 250,
  },
  DURATIONS: {
    FAST: 100,
    MEDIUM: 300,
    SLOW: 500,
    TRANSITION: 750,
  },
  THROTTLE: {
    MOUSE_MOVE: 10,
    SCROLL: 16,
  },
} as const;

export const PHYSICS = {
  PIXELS_PER_METER: 50,
  MAX_BODIES: 4096,
  BYTES_PER_VERTEX: 20,
  BYTES_PER_COLOR: 3,
  SHOCK_DISTANCE: 20,
  MIN_SHOCK_INTERVAL: 100,
  RESIZE_DEBOUNCE: 100,
  TIME_STEP: 16.666,
  DEFAULT_SETTINGS: {
    GRAVITY: 0.1,
    DAMPING: 2,
    MAX_SPEED: 10,
    BODY_COUNT: 2048,
    BODY_RADIUS: 4,
    FRICTION: 0.01,
    RESTITUTION: 0.5,
  },
} as const;

export const COLORS = {
  LEVELS: 10,
  STEPS_PER_LEVEL: 1024,
  HUE_MULTIPLIER: 270,
} as const;

export const SANITY = {
  PROJECT_ID: "lgevplo8",
  DATASET: "production",
  API_VERSION: "2023-07-12",
} as const;

export const UI = {
  GRID_COLUMNS: {
    MIN: 1,
    MAX: 6,
    DEFAULT: 4,
  },
  NOISE_SIZE: 250,
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 24,
    XLARGE: 32,
  },
} as const;

export const FILE_TYPES = {
  IMAGES: ["jpg", "jpeg", "png", "webp", "svg"],
  VIDEOS: ["mp4", "webm"],
} as const;

export const CACHE_KEYS = {
  SKILLS_DATA: "/json/skills.json",
  BLOB_STORAGE: "cee-app-blobs",
} as const;

export const LINKS = {
  RESUME: "/ChaseChristensen-Resume-2025.pdf",
} as const;
