import { MORPH_POINT_COUNT } from "./variants/morphData.js";

export const LOGO_VIEW_WIDTH = 402;
export const LOGO_VIEW_HEIGHT = 85;

const RASTER_SCALE = 4;
const BRIDGE_RADIUS = 10;
const STICKER_PADDING = 5;
const RING_POINTS = 180;
const CONNECTOR_HEIGHT = 25;

export type StickerPoint = { x: number; y: number };

export type StickerOutline = {
  d: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

const contourArea = (points: readonly number[], offset: number) => {
  let area = 0;
  const size = MORPH_POINT_COUNT;
  for (let i = 0; i < size; i++) {
    const j = (i + 1) % size;
    const x1 = points[offset + i * 2];
    const y1 = points[offset + i * 2 + 1];
    const x2 = points[offset + j * 2];
    const y2 = points[offset + j * 2 + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
};

export const outerContours = (glyphs: readonly (readonly number[])[]) => {
  const contours: number[][] = [];
  const contourSize = MORPH_POINT_COUNT * 2;

  for (const glyph of glyphs) {
    for (let offset = 0; offset < glyph.length; offset += contourSize) {
      if (contourArea(glyph, offset) > 0) {
        contours.push(
          Array.from({ length: contourSize }, (_, i) => glyph[offset + i]),
        );
      }
    }
  }

  return contours;
};

const perimeterLength = (points: readonly StickerPoint[]) => {
  let length = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return length;
};

const resampleRing = (points: readonly StickerPoint[], count: number): StickerPoint[] => {
  if (points.length < 3) return [];
  const total = perimeterLength(points);
  if (total === 0) return [];

  const result: StickerPoint[] = [];
  const step = total / count;
  let index = 0;
  let traveled = 0;
  let edgeProgress = 0;

  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (traveled + edgeProgress < target) {
      const a = points[index];
      const b = points[(index + 1) % points.length];
      const edge = Math.hypot(b.x - a.x, b.y - a.y);
      if (traveled + edge >= target) {
        edgeProgress = target - traveled;
        break;
      }
      traveled += edge;
      edgeProgress = 0;
      index = (index + 1) % points.length;
    }
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const edge = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const t = edgeProgress / edge;
    result.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
  }

  return result;
};

const smoothRing = (points: readonly StickerPoint[], iterations = 2) => {
  let ring = points.slice();
  for (let iteration = 0; iteration < iterations; iteration++) {
    if (ring.length < 3) break;
    ring = ring.map((point, index) => {
      const previous = ring[(index - 1 + ring.length) % ring.length];
      const next = ring[(index + 1) % ring.length];
      return {
        x: previous.x * 0.25 + point.x * 0.5 + next.x * 0.25,
        y: previous.y * 0.25 + point.y * 0.5 + next.y * 0.25,
      };
    });
  }
  return ring;
};

const fmt = (value: number) => Number(value.toFixed(2));

export const pointsToStickerPath = (points: readonly StickerPoint[]) => {
  if (points.length === 0) return "";
  let path = `M${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const mx = (previous.x + current.x) / 2;
    const my = (previous.y + current.y) / 2;
    path += `Q${fmt(previous.x)} ${fmt(previous.y)} ${fmt(mx)} ${fmt(my)}`;
  }
  const last = points[points.length - 1];
  const first = points[0];
  const lmx = (last.x + first.x) / 2;
  const lmy = (last.y + first.y) / 2;
  path += `Q${fmt(last.x)} ${fmt(last.y)} ${fmt(lmx)} ${fmt(lmy)}Z`;
  return path;
};

const traceContour = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): StickerPoint[] => {
  const inside = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return data[(y * width + x) * 4 + 3] > 0;
  };

  let startX = -1;
  let startY = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (inside(x, y)) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }
  if (startX < 0) return [];

  const neighbors = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ] as const;

  const ring: StickerPoint[] = [];
  let x = startX;
  let y = startY;
  let dir = 0;
  const maxSteps = width * height;

  for (let step = 0; step < maxSteps; step++) {
    ring.push({ x: x + 0.5, y: y + 0.5 });

    const back = (dir + 6) % 8;
    let found = false;
    for (let i = 0; i < 8; i++) {
      const nextDir = (back + i) % 8;
      const nx = x + neighbors[nextDir][0];
      const ny = y + neighbors[nextDir][1];
      if (!inside(nx, ny)) continue;
      x = nx;
      y = ny;
      dir = nextDir;
      found = true;
      break;
    }
    if (!found) break;
    if (x === startX && y === startY && ring.length > 8) break;
  }

  return ring;
};

let workCanvas: HTMLCanvasElement | null = null;
let blurCanvas: HTMLCanvasElement | null = null;

const getContexts = (width: number, height: number) => {
  if (!workCanvas) workCanvas = document.createElement("canvas");
  if (!blurCanvas) blurCanvas = document.createElement("canvas");
  workCanvas.width = width;
  workCanvas.height = height;
  blurCanvas.width = width;
  blurCanvas.height = height;
  return {
    work: workCanvas.getContext("2d", { willReadFrequently: true })!,
    blur: blurCanvas.getContext("2d", { willReadFrequently: true })!,
  };
};

const thresholdAlpha = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cutoff: number,
) => {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const on = data[i + 3] >= cutoff ? 255 : 0;
    data[i] = on;
    data[i + 1] = on;
    data[i + 2] = on;
    data[i + 3] = on;
  }
  ctx.putImageData(image, 0, 0);
};

const blurAndThreshold = (
  from: CanvasRenderingContext2D,
  to: CanvasRenderingContext2D,
  width: number,
  height: number,
  radiusPx: number,
  cutoff: number,
) => {
  to.clearRect(0, 0, width, height);
  to.filter = `blur(${radiusPx}px)`;
  to.drawImage(from.canvas, 0, 0);
  to.filter = "none";
  thresholdAlpha(to, width, height, cutoff);
};

export const logoStickerPoints = (
  glyphs: readonly (readonly number[])[],
): StickerPoint[] | null => {
  const contours = outerContours(glyphs);
  if (contours.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const contour of contours) {
    for (let i = 0; i < contour.length; i += 2) {
      minX = Math.min(minX, contour[i]);
      minY = Math.min(minY, contour[i + 1]);
      maxX = Math.max(maxX, contour[i]);
      maxY = Math.max(maxY, contour[i + 1]);
    }
  }

  const margin = BRIDGE_RADIUS + STICKER_PADDING + 4;
  const width = Math.ceil((maxX - minX + margin * 2) * RASTER_SCALE);
  const height = Math.ceil((maxY - minY + margin * 2) * RASTER_SCALE);
  const { work, blur } = getContexts(width, height);

  work.clearRect(0, 0, width, height);
  work.fillStyle = "#fff";
  work.beginPath();
  for (const contour of contours) {
    const x0 = (contour[0] - minX + margin) * RASTER_SCALE;
    const y0 = (contour[1] - minY + margin) * RASTER_SCALE;
    work.moveTo(x0, y0);
    for (let i = 2; i < contour.length; i += 2) {
      const x = (contour[i] - minX + margin) * RASTER_SCALE;
      const y = (contour[i + 1] - minY + margin) * RASTER_SCALE;
      work.lineTo(x, y);
    }
    work.closePath();
  }
  work.fill();

  blurAndThreshold(
    work,
    blur,
    width,
    height,
    BRIDGE_RADIUS * RASTER_SCALE,
    16,
  );
  blurAndThreshold(
    blur,
    work,
    width,
    height,
    STICKER_PADDING * RASTER_SCALE,
    84,
  );

  const centerY = ((minY + maxY) / 2 - minY + margin) * RASTER_SCALE;
  const connectorHeightPx = CONNECTOR_HEIGHT * RASTER_SCALE;
  const connectorInsetPx = Math.max(2, STICKER_PADDING * RASTER_SCALE * 0.6);
  work.fillStyle = "#fff";
  work.fillRect(
    connectorInsetPx,
    centerY - connectorHeightPx / 2,
    width - connectorInsetPx * 2,
    connectorHeightPx,
  );

  blurAndThreshold(work, blur, width, height, RASTER_SCALE * 0.75, 108);

  const rawRing = traceContour(
    blur.getImageData(0, 0, width, height).data,
    width,
    height,
  );
  if (rawRing.length < 3) return null;

  const normalized: StickerPoint[] = rawRing.map(({ x, y }) => ({
    x: x / RASTER_SCALE + minX - margin,
    y: y / RASTER_SCALE + minY - margin,
  }));
  const resampled = resampleRing(normalized, RING_POINTS);
  return smoothRing(resampled, 3);
};

export const interpolateStickerPoints = (
  from: readonly StickerPoint[],
  to: readonly StickerPoint[],
  progress: number,
) =>
  from.map((point, index) => ({
    x: point.x + (to[index].x - point.x) * progress,
    y: point.y + (to[index].y - point.y) * progress,
  }));

export const alignStickerPoints = (
  reference: readonly StickerPoint[],
  points: readonly StickerPoint[],
) => {
  if (reference.length !== points.length || points.length === 0) {
    return points.slice();
  }

  let bestOffset = 0;
  let bestDistance = Infinity;

  for (let offset = 0; offset < points.length; offset++) {
    let distance = 0;
    for (let index = 0; index < reference.length; index++) {
      const candidate = points[(index + offset) % points.length];
      const dx = reference[index].x - candidate.x;
      const dy = reference[index].y - candidate.y;
      distance += dx * dx + dy * dy;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      bestOffset = offset;
    }
  }

  return reference.map((_, index) => points[(index + bestOffset) % points.length]);
};

export const stickerOutlineFromPoints = (
  points: readonly StickerPoint[],
): StickerOutline => ({
  d: pointsToStickerPath(points),
  width: LOGO_VIEW_WIDTH,
  height: LOGO_VIEW_HEIGHT,
  offsetX: 0,
  offsetY: 0,
});

export const logoStickerOutline = (
  glyphs: readonly (readonly number[])[],
): StickerOutline | null => {
  const points = logoStickerPoints(glyphs);
  if (!points) return null;
  return stickerOutlineFromPoints(points);
};
