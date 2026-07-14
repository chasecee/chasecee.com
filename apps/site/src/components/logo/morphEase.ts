export type EaseBezier = [number, number, number, number];

export const DEFAULT_MORPH_BEZIER: EaseBezier = [0.22, 1.4, 0.67, 0.68];

const sampleCurve = (
  t: number,
  a: number,
  b: number,
) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 3 * a * (t - 2 * t2 + t3) + 3 * b * (t2 - t3) + t3;
};

const sampleDerivative = (
  t: number,
  a: number,
  b: number,
) => {
  const t2 = t * t;
  return 3 * a * (1 - 4 * t + 3 * t2) + 3 * b * (2 * t - 3 * t2) + 3 * t2;
};

export const sampleCubicBezier = (
  x: number,
  [x1, y1, x2, y2]: EaseBezier,
) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = sampleCurve(t, x1, x2);
    const dx = sampleDerivative(t, x1, x2);
    if (Math.abs(dx) < 1e-6) break;
    t -= (currentX - x) / dx;
    t = Math.min(1, Math.max(0, t));
  }

  return sampleCurve(t, y1, y2);
};
