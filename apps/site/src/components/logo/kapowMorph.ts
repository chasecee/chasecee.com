import { MORPH_VARIANTS } from "./variants/morphData.js";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./silhouette";

export const KAPOW_POINT_COUNT = 200;

type KapowVariantParams = {
  radialBase: number;
  radialAmp: number;
  rippleAmp: number;
  primarySpikes: number;
  secondarySpikes: number;
  phase: number;
  seed: number;
  xScale: number;
  yScale: number;
  jitter: number;
};

const TAU = Math.PI * 2;

const KAPOW_VARIANT_PARAMS: readonly KapowVariantParams[] = [
  {
    radialBase: 141,
    radialAmp: 34,
    rippleAmp: 15,
    primarySpikes: 9,
    secondarySpikes: 17,
    phase: 0.2,
    seed: 11,
    xScale: 1.06,
    yScale: 0.28,
    jitter: 5,
  },
  {
    radialBase: 138,
    radialAmp: 30,
    rippleAmp: 18,
    primarySpikes: 11,
    secondarySpikes: 15,
    phase: 1.1,
    seed: 23,
    xScale: 1.02,
    yScale: 0.29,
    jitter: 6,
  },
  {
    radialBase: 136,
    radialAmp: 33,
    rippleAmp: 16,
    primarySpikes: 8,
    secondarySpikes: 19,
    phase: 1.9,
    seed: 37,
    xScale: 1.03,
    yScale: 0.27,
    jitter: 5,
  },
  {
    radialBase: 140,
    radialAmp: 29,
    rippleAmp: 19,
    primarySpikes: 10,
    secondarySpikes: 14,
    phase: 2.8,
    seed: 41,
    xScale: 1.05,
    yScale: 0.3,
    jitter: 6,
  },
  {
    radialBase: 137,
    radialAmp: 35,
    rippleAmp: 14,
    primarySpikes: 12,
    secondarySpikes: 20,
    phase: 3.3,
    seed: 53,
    xScale: 1,
    yScale: 0.27,
    jitter: 6,
  },
  {
    radialBase: 142,
    radialAmp: 31,
    rippleAmp: 17,
    primarySpikes: 9,
    secondarySpikes: 18,
    phase: 4.2,
    seed: 67,
    xScale: 1.08,
    yScale: 0.29,
    jitter: 5,
  },
];

const clampVariantIndex = (index: number) => {
  if (index < 0) return 0;
  if (index >= KAPOW_VARIANT_PARAMS.length) return KAPOW_VARIANT_PARAMS.length - 1;
  return index;
};

const noise = (index: number, seed: number) => {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const round = (value: number) => Number(value.toFixed(2));

const midpoint = (ax: number, ay: number, bx: number, by: number) => ({
  x: (ax + bx) / 2,
  y: (ay + by) / 2,
});

const buildKapowPoints = (params: KapowVariantParams) => {
  const points: number[] = [];
  const centerX = LOGO_VIEW_WIDTH / 2;
  const centerY = LOGO_VIEW_HEIGHT / 2;

  for (let point = 0; point < KAPOW_POINT_COUNT; point++) {
    const t = (point / KAPOW_POINT_COUNT) * TAU;
    const primary = Math.sin(t * params.primarySpikes + params.phase);
    const secondary = Math.sin(t * params.secondarySpikes - params.phase * 0.7);
    const jitter = (noise(point + 1, params.seed) * 2 - 1) * params.jitter;
    const radius =
      params.radialBase + primary * params.radialAmp + secondary * params.rippleAmp + jitter;
    points.push(round(centerX + Math.cos(t) * radius * params.xScale));
    points.push(round(centerY + Math.sin(t) * radius * params.yScale));
  }

  return points;
};

export const interpolatePoints = (
  from: readonly number[],
  to: readonly number[],
  progress: number,
) => from.map((value, index) => value + (to[index] - value) * progress);

export const pointsToQuadraticPath = (points: readonly number[], pointCount: number) => {
  let path = "";
  const contourSize = pointCount * 2;

  for (let offset = 0; offset < points.length; offset += contourSize) {
    const firstX = points[offset];
    const firstY = points[offset + 1];
    const secondX = points[offset + 2];
    const secondY = points[offset + 3];
    const start = midpoint(firstX, firstY, secondX, secondY);
    path += `M${round(start.x)} ${round(start.y)}`;

    for (let point = 1; point < pointCount; point++) {
      const index = offset + point * 2;
      const next = offset + ((point + 1) % pointCount) * 2;
      const controlX = points[index];
      const controlY = points[index + 1];
      const end = midpoint(controlX, controlY, points[next], points[next + 1]);
      path += `Q${round(controlX)} ${round(controlY)} ${round(end.x)} ${round(end.y)}`;
    }
    path += "Z";
  }

  return path;
};

export const KAPOW_VARIANT_POINTS = MORPH_VARIANTS.map((_, index) =>
  buildKapowPoints(KAPOW_VARIANT_PARAMS[clampVariantIndex(index)]),
) as readonly (readonly number[])[];

export const KAPOW_VARIANT_PATHS = KAPOW_VARIANT_POINTS.map((points) =>
  pointsToQuadraticPath(points, KAPOW_POINT_COUNT),
);
