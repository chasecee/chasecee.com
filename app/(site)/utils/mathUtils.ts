export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

export const radiansToDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

export const distanceSquared = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export const magnitude = (x: number, y: number): number => {
  return Math.sqrt(x * x + y * y);
};

export const normalize = (x: number, y: number): { x: number; y: number } => {
  const mag = magnitude(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const angleBetweenPoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

export const pointOnCircle = (
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
): { x: number; y: number } => {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
};

export const circularPosition = (
  index: number,
  total: number,
  radius: number,
  centerX: number = 0,
  centerY: number = 0,
): { x: number; y: number } => {
  const angle = (index * 2 * Math.PI) / total;
  return pointOnCircle(centerX, centerY, radius, angle);
};

export const circularVelocity = (
  index: number,
  total: number,
  speed: number,
): { x: number; y: number } => {
  const angle = (index * 2 * Math.PI) / total;
  return {
    x: -speed * Math.sin(angle),
    y: speed * Math.cos(angle),
  };
};

export const decayFunction = (
  normalizedDistance: number,
  decayFactor: number,
): number => {
  return Math.pow(1 - normalizedDistance, decayFactor);
};

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
