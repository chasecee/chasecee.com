import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHalftoneKey,
  buildHalftonePublicPath,
  computeHalftoneTileSize,
  normalizeHalftoneValue,
  type HalftoneShape,
} from "../src/components/logo/kapowHalftoneAsset";
import {
  KAPOW_HALFTONE_DOT_RADIUS,
  KAPOW_HALFTONE_DOT_SPACING,
  KAPOW_HALFTONE_SHAPE,
} from "../src/components/logo/kapowHalftone";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const formatNumber = (value: number, decimals = 4) =>
  Number.parseFloat(value.toFixed(decimals));

const renderRegularPolygon = (
  id: HalftoneShape,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
) => {
  const rotation =
    id === "square" || id === "octagon" ? -Math.PI / 4 : -Math.PI / 2;
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${formatNumber(x)} ${formatNumber(y)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="black"/>`;
};

const renderShape = (shape: HalftoneShape, cx: number, cy: number, radius: number) => {
  const centerX = formatNumber(cx);
  const centerY = formatNumber(cy);
  switch (shape) {
    case "circle":
      return `<circle cx="${centerX}" cy="${centerY}" r="${formatNumber(radius)}" fill="black"/>`;
    case "square":
      return renderRegularPolygon("square", centerX, centerY, radius, 4);
    case "octagon":
      return renderRegularPolygon("octagon", centerX, centerY, radius, 8);
    case "hexagon":
      return renderRegularPolygon("hexagon", centerX, centerY, radius, 6);
    case "triangle":
      return renderRegularPolygon("triangle", centerX, centerY, radius, 3);
  }
};

const createTile = (dotRadius: number, dotSpacing: number, shape: HalftoneShape) => {
  const size = computeHalftoneTileSize(dotSpacing, shape);
  const radiusValue = formatNumber(dotRadius);
  const dots =
    shape === "square"
      ? [{ cx: size / 2, cy: size / 2 }]
      : [
          { cx: size / 2, cy: 0 },
          { cx: 0, cy: size / 2 },
          { cx: size, cy: size / 2 },
          { cx: size / 2, cy: size },
        ];
  const shapes = dots
    .map(({ cx, cy }) => renderShape(shape, cx, cy, radiusValue))
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">${shapes}</svg>`;
  return { size, svg };
};

const config = {
  dotRadius: normalizeHalftoneValue(KAPOW_HALFTONE_DOT_RADIUS),
  dotSpacing: normalizeHalftoneValue(KAPOW_HALFTONE_DOT_SPACING),
  shape: KAPOW_HALFTONE_SHAPE,
};

const key = buildHalftoneKey(config);
const publicPath = buildHalftonePublicPath(config);
const { size, svg } = createTile(config.dotRadius, config.dotSpacing, config.shape);

const publicDir = path.resolve(SCRIPT_DIR, "../public/halftone");
const dataPath = path.resolve(
  SCRIPT_DIR,
  "../src/components/logo/kapowHalftoneData.ts",
);

await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, `halftone-${key}.svg`), svg, "utf-8");
await writeFile(
  dataPath,
  `export const KAPOW_HALFTONE_KEY = ${JSON.stringify(key)} as const;
export const KAPOW_HALFTONE_TILE_SIZE = ${size} as const;
export const KAPOW_HALFTONE_MASK_URL = ${JSON.stringify(publicPath)} as const;
`,
  "utf-8",
);

console.log(`Wrote ${publicPath} (tile ${size}px)`);
