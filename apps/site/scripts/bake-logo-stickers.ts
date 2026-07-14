import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MORPH_POINT_COUNT, MORPH_VARIANTS } from "../src/components/logo/variants/morphData.js";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "../src/components/logo/silhouette";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const RASTER_SCALE = 6;
const BRIDGE_RADIUS = 3;
const STICKER_PADDING = 5;
const RING_POINTS = 180;
const CONNECTOR_HEIGHT = 20;

type StickerPoint = { x: number; y: number };

const contourArea = (points: readonly number[], offset: number) => {
  let area = 0;
  for (let i = 0; i < MORPH_POINT_COUNT; i++) {
    const j = (i + 1) % MORPH_POINT_COUNT;
    const x1 = points[offset + i * 2];
    const y1 = points[offset + i * 2 + 1];
    const x2 = points[offset + j * 2];
    const y2 = points[offset + j * 2 + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
};

const outerContours = (glyphs: readonly (readonly number[])[]) => {
  const contours: number[][] = [];
  const contourSize = MORPH_POINT_COUNT * 2;
  for (const glyph of glyphs) {
    for (let offset = 0; offset < glyph.length; offset += contourSize) {
      if (contourArea(glyph, offset) > 0) {
        contours.push(
          Array.from({ length: contourSize }, (_, index) => glyph[offset + index]),
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

const traceContour = (
  data: Uint8Array,
  width: number,
  height: number,
): StickerPoint[] => {
  const inside = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return data[y * width + x] > 0;
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

const blurAndThreshold = async (
  input: Uint8Array,
  width: number,
  height: number,
  radiusPx: number,
  cutoff: number,
) => {
  const { data } = await sharp(input, {
    raw: { width, height, channels: 1 },
  })
    .blur(radiusPx)
    .threshold(cutoff)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new Uint8Array(data);
};

const fillRect = (
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
) => {
  const minX = Math.max(0, Math.floor(x));
  const minY = Math.max(0, Math.floor(y));
  const maxX = Math.min(width, Math.ceil(x + rectWidth));
  const maxY = Math.min(height, Math.ceil(y + rectHeight));
  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      mask[py * width + px] = 255;
    }
  }
};

const fmt = (value: number) => Number(value.toFixed(2));

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const renderBounds = async (paths: readonly string[]) => {
  const body = paths.map((pathValue) => `<path d="${pathValue}" fill="white"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_VIEW_WIDTH}" height="${LOGO_VIEW_HEIGHT}" viewBox="0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}">${body}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + channels - 1];
      if (alpha <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const scaleX = LOGO_VIEW_WIDTH / width;
  const scaleY = LOGO_VIEW_HEIGHT / height;
  return {
    x: minX * scaleX,
    y: minY * scaleY,
    width: (maxX - minX) * scaleX,
    height: (maxY - minY) * scaleY,
  } satisfies Bounds;
};

const ringBounds = (points: readonly StickerPoint[]): Bounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const translateRing = (points: readonly StickerPoint[], dx: number, dy: number) =>
  points.map((point) => ({ x: point.x + dx, y: point.y + dy }));

const pointsToStickerPath = (points: readonly StickerPoint[]) => {
  if (points.length === 0) return "";
  let pathData = `M${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const mx = (previous.x + current.x) / 2;
    const my = (previous.y + current.y) / 2;
    pathData += `Q${fmt(previous.x)} ${fmt(previous.y)} ${fmt(mx)} ${fmt(my)}`;
  }
  const last = points[points.length - 1];
  const first = points[0];
  const lmx = (last.x + first.x) / 2;
  const lmy = (last.y + first.y) / 2;
  return `${pathData}Q${fmt(last.x)} ${fmt(last.y)} ${fmt(lmx)} ${fmt(lmy)}Z`;
};

const alignStickerPoints = (
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

const logoStickerPoints = async (glyphs: readonly (readonly number[])[]) => {
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

  let pathData = "";
  for (const contour of contours) {
    const x0 = (contour[0] - minX + margin) * RASTER_SCALE;
    const y0 = (contour[1] - minY + margin) * RASTER_SCALE;
    pathData += `M${x0} ${y0}`;
    for (let i = 2; i < contour.length; i += 2) {
      const x = (contour[i] - minX + margin) * RASTER_SCALE;
      const y = (contour[i + 1] - minY + margin) * RASTER_SCALE;
      pathData += `L${x} ${y}`;
    }
    pathData += "Z";
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="black"/><path d="${pathData}" fill="white"/></svg>`;
  const { data: baseMask } = await sharp(Buffer.from(svg))
    .greyscale()
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let blur = await blurAndThreshold(
    new Uint8Array(baseMask),
    width,
    height,
    BRIDGE_RADIUS * RASTER_SCALE,
    28,
  );
  let work = await blurAndThreshold(
    blur,
    width,
    height,
    STICKER_PADDING * RASTER_SCALE,
    96,
  );

  const centerY = ((minY + maxY) / 2 - minY + margin) * RASTER_SCALE;
  const connectorHeightPx = CONNECTOR_HEIGHT * RASTER_SCALE;
  const connectorLeftPx = margin * RASTER_SCALE;
  const connectorWidthPx = (maxX - minX) * RASTER_SCALE;
  fillRect(
    work,
    width,
    height,
    connectorLeftPx,
    centerY - connectorHeightPx / 2,
    connectorWidthPx,
    connectorHeightPx,
  );

  blur = await blurAndThreshold(work, width, height, RASTER_SCALE * 0.75, 120);
  const rawRing = traceContour(blur, width, height);
  if (rawRing.length < 3) return null;

  const normalized: StickerPoint[] = rawRing.map(({ x, y }) => ({
    x: x / RASTER_SCALE + minX - margin,
    y: y / RASTER_SCALE + minY - margin,
  }));
  const resampled = resampleRing(normalized, RING_POINTS);
  return smoothRing(resampled, 3);
};

const build = async () => {
  const pointsList = await Promise.all(
    MORPH_VARIANTS.map((variant) => logoStickerPoints(variant.glyphs)),
  );
  if (pointsList.some((points) => !points)) {
    throw new Error("Failed to bake sticker points for one or more variants.");
  }

  const rings = pointsList as StickerPoint[][];
  const reference = rings[0];
  const aligned = rings.map((points) => alignStickerPoints(reference, points));
  const glyphBounds = await Promise.all(
    MORPH_VARIANTS.map((variant) => renderBounds(variant.paths)),
  );
  const adjusted = aligned.map((points, index) => {
    const sticker = ringBounds(points);
    const glyph = glyphBounds[index];
    const dx =
      glyph.x + glyph.width / 2 - (sticker.x + sticker.width / 2);
    const dy =
      glyph.y + glyph.height / 2 - (sticker.y + sticker.height / 2);
    return translateRing(points, dx, dy);
  });
  const paths = adjusted.map((points) => pointsToStickerPath(points));
  const signature = paths[0].replace(/[0-9.\-]+/g, "#");
  const allCompatible = paths.every(
    (value) => value.replace(/[0-9.\-]+/g, "#") === signature,
  );
  if (!allCompatible) {
    throw new Error("Sticker paths do not share compatible command topology.");
  }

  const output = [
    `export const STICKER_RING_POINTS = ${RING_POINTS} as const;`,
    `export const STICKER_VARIANT_IDS = ${JSON.stringify(
      MORPH_VARIANTS.map((variant) => variant.id),
    )} as const;`,
    `export const STICKER_PATHS = ${JSON.stringify(paths)} as const;`,
    "",
  ].join("\n");

  const outputPath = path.resolve(
    SCRIPT_DIR,
    "../src/components/logo/variants/stickerData.ts",
  );
  await writeFile(outputPath, output);
  console.log(`Wrote ${outputPath}`);
};

await build();
