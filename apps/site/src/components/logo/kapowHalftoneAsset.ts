export const HALFTONE_SHAPES = ["circle", "square", "octagon", "hexagon", "triangle"] as const;

export type HalftoneShape = (typeof HALFTONE_SHAPES)[number];

const MAX_DECIMALS = 4;

const normalizeValue = (value: number) => {
  if (!Number.isFinite(value)) {
    throw new Error("Halftone values must be finite numbers");
  }
  if (value <= 0) {
    throw new Error("Halftone values must be positive numbers");
  }
  const rounded = Number.parseFloat(value.toFixed(MAX_DECIMALS));
  return Object.is(rounded, -0) ? 0 : rounded;
};

const encodeToken = (value: number) => value.toString().replace("-", "neg").replace(".", "p");

export const normalizeHalftoneValue = (value: number) => normalizeValue(value);

const normalizeShape = (input: string): HalftoneShape => {
  const normalized = input.trim().toLowerCase();
  if (!HALFTONE_SHAPES.includes(normalized as HalftoneShape)) {
    throw new Error(`Invalid halftone shape "${input}"`);
  }
  return normalized as HalftoneShape;
};

export const buildHalftoneKey = (config: {
  dotRadius: number;
  dotSpacing: number;
  shape: HalftoneShape;
}) => {
  const radius = normalizeValue(config.dotRadius);
  const spacing = normalizeValue(config.dotSpacing);
  const shape = normalizeShape(config.shape);
  return `${shape}-r${encodeToken(radius)}-s${encodeToken(spacing)}`;
};

export const computeHalftoneTileSize = (dotSpacing: number, shape: HalftoneShape) => {
  const spacing = normalizeValue(dotSpacing);
  if (shape === "square") {
    return Math.max(1, Math.round(spacing));
  }
  return Math.max(1, Math.round(spacing * Math.SQRT2));
};

export const buildHalftonePublicPath = (config: {
  dotRadius: number;
  dotSpacing: number;
  shape: HalftoneShape;
}) => `/halftone/halftone-${buildHalftoneKey(config)}.svg`;
