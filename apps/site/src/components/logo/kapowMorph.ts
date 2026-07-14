export const KAPOW_POINT_COUNT = 24;

const midpoint = (ax: number, ay: number, bx: number, by: number) => ({
  x: (ax + bx) / 2,
  y: (ay + by) / 2,
});

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const round = (value: number) => Number(value.toFixed(2));

export const interpolateNumber = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

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

export const pointsToKapowPath = (
  points: readonly number[],
  pointCount: number,
  cornerRoundness: number,
) => {
  const roundness = clamp01(cornerRoundness);
  let path = "";
  const contourSize = pointCount * 2;

  for (let offset = 0; offset < points.length; offset += contourSize) {
    if (roundness === 0) {
      path += `M${round(points[offset])} ${round(points[offset + 1])}`;
      for (let point = 1; point < pointCount; point++) {
        const index = offset + point * 2;
        path += `L${round(points[index])} ${round(points[index + 1])}`;
      }
      path += "Z";
      continue;
    }

    const firstX = points[offset];
    const firstY = points[offset + 1];
    const secondX = points[offset + 2];
    const secondY = points[offset + 3];
    const firstMid = midpoint(firstX, firstY, secondX, secondY);
    const startX = interpolateNumber(firstX, firstMid.x, roundness);
    const startY = interpolateNumber(firstY, firstMid.y, roundness);
    path += `M${round(startX)} ${round(startY)}`;

    for (let point = 0; point < pointCount; point++) {
      const current = offset + ((point + 1) % pointCount) * 2;
      const next = offset + ((point + 2) % pointCount) * 2;
      const controlX = points[current];
      const controlY = points[current + 1];
      const nextX = points[next];
      const nextY = points[next + 1];
      const nextMid = midpoint(controlX, controlY, nextX, nextY);
      const endX = interpolateNumber(controlX, nextMid.x, roundness);
      const endY = interpolateNumber(controlY, nextMid.y, roundness);
      path += `Q${round(controlX)} ${round(controlY)} ${round(endX)} ${round(endY)}`;
    }
    path += "Z";
  }

  return path;
};

export const KAPOW_VARIANT_IDS = [
  "accent-spikes",
  "petal-burst",
  "lightning",
  "rounder-burst",
  "double-hit",
  "shard-ring",
  "staccato",
] as const;

export const KAPOW_VARIANT_POINTS = [
  [
    300.41, 101.47, 226.27, 78.46, 191.22, 98.35, 163.42, 77.36, 99.46, 89.66, 110.41, 67.1,
    5.18, 72.59, 83.61, 50.02, 16.42, 39.56, 86.01, 31.2, 47.74, 12.42, 119.55, 15.17, 101.15,
    -16.73, 175.98, 6.89, 210.77, -13.32, 238.4, 7.8, 300.4, -3.66, 290.66, 18.15, 397.3, 12.34,
    318.68, 34.97, 385.61, 45.45, 315.56, 53.75, 354.83, 72.69, 282.33, 69.79,
  ],
  [
    324.46, 44.62, 360.7, 60.15, 354.02, 76.39, 313.92, 85.3, 256.87, 79.88, 235.58, 97.64,
    191.65, 106.59, 150.66, 96.05, 133.66, 78.24, 75.88, 81.31, 38.01, 71.14, 37.84, 54.53,
    79.83, 40.42, 42.52, 24.99, 46.68, 8.32, 90.44, 0.6, 143.52, 4.05, 166.14, -13.08, 210.22,
    -20.65, 252.68, -12.47, 268.72, 6.56, 326, 3.73, 364.7, 13.73, 367.04, 30.26,
  ],
  [
    280.77, 71.62, 281.58, 96.36, 232.45, 103.96, 185.66, 81.11, 124.55, 98.54, 72.41, 92.73,
    63.09, 74.21, 17.05, 65.6, 69.26, 48.16, 77.67, 38.39, 42.57, 24.36, 63.39, 12.93, 71.8,
    -4.67, 145.06, 5.11, 170.52, -17.07, 220.99, -7.81, 249.71, 6.79, 320.74, -4.27, 364.49,
    4.91, 357.16, 22.89, 375.09, 35.02, 361.15, 47.84, 388.36, 63.95, 303.43, 64.51,
  ],
  [
    328.01, 89.05, 261.53, 80.65, 271.98, 120.69, 221.77, 94.28, 197.12, 130.37, 175.81, 93.29,
    124.85, 116.75, 137.49, 78.51, 71.98, 84.36, 115.89, 54.7, 55.14, 40.2, 115.74, 27.39,
    74.23, -3.97, 140.22, 4.19, 130.6, -35.06, 180.37, -8.92, 204.88, -45.43, 226.29, -8.51,
    278.68, -33.25, 264.72, 6.36, 330.6, 0.46, 286.17, 30.29, 347.29, 44.81, 285.78, 57.53,
  ],
  [
    393.78, 48.58, 314.98, 56.06, 361.04, 78.68, 279.74, 72.77, 265.38, 87.38, 221.07, 81.15,
    185.27, 91.76, 157.71, 78.45, 83.89, 93.67, 106.14, 66.88, 19.38, 68.24, 78.21, 48.8,
    40.39, 37.44, 85.13, 28.72, 69.15, 12.69, 123.37, 12.66, 120.35, -13.72, 180.71, 3.44,
    220.85, -19.69, 244.69, 6.22, 296.45, 0.8, 298.27, 17.5, 343.82, 22.26, 322.8, 36.25,
  ],
  [
    406.41, 58.33, 301.84, 59.6, 325.37, 79.17, 261.32, 73.2, 253.13, 98.57, 202.41, 78.49,
    159.56, 91.49, 141.83, 74.3, 57.32, 86.91, 98.8, 60.8, 37.71, 56.33, 79.4, 42.93, 18.19,
    28.41, 97.45, 24.94, 75.12, 5.38, 141.04, 11.99, 147.15, -15.42, 199.6, 6.59, 241.91,
    -5.87, 259.56, 11.03, 329.87, 2.67, 304.59, 23.95, 374.5, 27.8, 320.08, 42.08,
  ],
  [
    172.56, 105.64, 162.53, 69.42, 79.75, 88.24, 123.54, 59.71, 17.34, 64.55, 99.63, 46.4,
    6.67, 35.22, 106.38, 31.25, 31.77, 5.17, 139.23, 19.36, 124.45, -10.55, 187.69, 13.71,
    225.83, -12.62, 238.88, 16, 318.73, -1.91, 277.75, 25.45, 404.99, 18.01, 299.62, 38.71,
    398.45, 49.9, 290.58, 53.15, 357.18, 76.95, 262.34, 65.48, 277.68, 95.65, 213.98, 70.57,
  ],
] as const;

export const KAPOW_VARIANT_ROUNDNESS = KAPOW_VARIANT_POINTS.map(() => 0);

export const KAPOW_VARIANT_PATHS = KAPOW_VARIANT_POINTS.map((points, index) =>
  pointsToKapowPath(points, KAPOW_POINT_COUNT, KAPOW_VARIANT_ROUNDNESS[index]),
);
