#!/usr/bin/env bun
/**
 * Bake logo font variants into morphData.js + per-font SVGs.
 *
 * bun run logo:morph -- list
 * bun run logo:morph -- add bowlbyOne
 * bun run logo:morph -- add patuaOne --text "Chase Cee" --force
 * bun run logo:morph -- add literata --google ofl/literata/Literata[opsz,wght].ttf --weight 400
 */

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { parseArgs } from "node:util";
import * as fontkit from "fontkit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VARIANTS_DIR = path.join(ROOT, "src/components/logo/variants");
const MORPH_PATH = path.join(VARIANTS_DIR, "morphData.js");
const CACHE_DIR = path.join(ROOT, "scripts/.cache/logo-fonts");
const GOOGLE_RAW = "https://raw.githubusercontent.com/google/fonts/main";

const POINTS = 64;
const VIEW_W = 402;
const VIEW_H = 85;
const TARGET_W = 360;
const TARGET_H = 68;
const DEFAULT_TEXT = "CHASE CEE";

type Point = [number, number];
type Contour = Point[];
type Matrix = [number, number, number, number, number, number];

type FontSpec = {
  id: string;
  google?: string;
  url?: string;
  weight?: number;
  text?: string;
};

type MorphVariant = {
  id: string;
  paths: string[];
  glyphs: number[][];
};

const CATALOG: Record<string, FontSpec> = Object.fromEntries(
  (
    [
      { id: "anton", google: "ofl/anton/Anton-Regular.ttf" },
      {
        id: "pixelifySans",
        google: "ofl/pixelifysans/PixelifySans%5Bwght%5D.ttf",
        weight: 600,
      },
      { id: "bebasNeue", google: "ofl/bebasneue/BebasNeue-Regular.ttf" },
      { id: "alfaSlabOne", google: "ofl/alfaslabone/AlfaSlabOne-Regular.ttf" },
      { id: "righteous", google: "ofl/righteous/Righteous-Regular.ttf" },
      { id: "patuaOne", google: "ofl/patuaone/PatuaOne-Regular.ttf" },
      { id: "arvoBold", google: "ofl/arvo/Arvo-Bold.ttf" },
      { id: "bowlbyOne", google: "ofl/bowlbyone/BowlbyOne-Regular.ttf" },
      {
        id: "literata",
        google: "ofl/literata/Literata%5Bopsz,wght%5D.ttf",
        weight: 400,
      },
    ] satisfies FontSpec[]
  ).map((spec) => [spec.id, spec]),
);

const sourceUrl = (spec: FontSpec) => {
  if (spec.url) return spec.url;
  if (spec.google) return `${GOOGLE_RAW}/${spec.google}`;
  throw new Error(`${spec.id}: need --google or --url`);
};

const transform = (matrix: Matrix, p: Point): Point => {
  const [a, b, c, d, e, f] = matrix;
  return [a * p[0] + c * p[1] + e, b * p[0] + d * p[1] + f];
};

const flatten = (
  commands: Array<{ command: string; args: number[] }>,
  matrix: Matrix,
): Contour[] => {
  const contours: Contour[] = [];
  let current: Contour = [];
  let position: Point = [0, 0];
  let start: Point = [0, 0];

  const push = (p: Point) => current.push(transform(matrix, p));

  for (const { command, args } of commands) {
    if (command === "moveTo") {
      if (current.length) contours.push(current);
      position = [args[0], args[1]];
      start = position;
      current = [transform(matrix, position)];
    } else if (command === "lineTo") {
      position = [args[0], args[1]];
      push(position);
    } else if (command === "bezierCurveTo") {
      const p0 = position;
      const p1: Point = [args[0], args[1]];
      const p2: Point = [args[2], args[3]];
      const p3: Point = [args[4], args[5]];
      for (let i = 1; i <= 32; i++) {
        const t = i / 32;
        const u = 1 - t;
        push([
          u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
          u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
        ]);
      }
      position = p3;
    } else if (command === "quadraticCurveTo") {
      const p0 = position;
      const control: Point = [args[0], args[1]];
      const end: Point = [args[2], args[3]];
      for (let i = 1; i <= 24; i++) {
        const t = i / 24;
        const u = 1 - t;
        push([
          u * u * p0[0] + 2 * u * t * control[0] + t * t * end[0],
          u * u * p0[1] + 2 * u * t * control[1] + t * t * end[1],
        ]);
      }
      position = end;
    } else if (command === "closePath") {
      if (current.length) {
        contours.push(current);
        current = [];
      }
      position = start;
    }
  }
  if (current.length) contours.push(current);
  return contours.filter((c) => c.length > 2);
};

const area = (contour: Contour) =>
  Math.abs(
    contour.reduce((sum, p, i) => {
      const q = contour[(i + 1) % contour.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );

const center = (contour: Contour): Point => [
  contour.reduce((s, p) => s + p[0], 0) / contour.length,
  contour.reduce((s, p) => s + p[1], 0) / contour.length,
];

const sample = (contour: Contour): Contour => {
  const closed = [...contour, contour[0]];
  const lengths = closed.slice(0, -1).map((a, i) => Math.hypot(closed[i + 1][0] - a[0], closed[i + 1][1] - a[1]));
  const total = lengths.reduce((s, n) => s + n, 0);
  if (total === 0) return Array.from({ length: POINTS }, () => closed[0]);
  const out: Contour = [];
  let seg = 0;
  let consumed = 0;
  for (let i = 0; i < POINTS; i++) {
    const target = (total * i) / POINTS;
    while (seg < lengths.length - 1 && consumed + lengths[seg] < target) {
      consumed += lengths[seg];
      seg += 1;
    }
    const a = closed[seg];
    const b = closed[seg + 1];
    const t = lengths[seg] ? (target - consumed) / lengths[seg] : 0;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
};

const align = (contour: Contour, target: Contour): Contour => {
  let best: { score: number; points: Contour } | null = null;
  for (const points of [contour, [contour[0], ...contour.slice(1).reverse()]]) {
    for (let shift = 0; shift < POINTS; shift++) {
      const rotated = [...points.slice(shift), ...points.slice(0, shift)];
      const score = rotated.reduce(
        (s, p, i) => s + (p[0] - target[i][0]) ** 2 + (p[1] - target[i][1]) ** 2,
        0,
      );
      if (!best || score < best.score) best = { score, points: rotated };
    }
  }
  return best!.points;
};

const loadMorph = async (opts?: { allowPointMismatch?: boolean }) => {
  const source = await readFile(MORPH_PATH, "utf8");
  const pointCount = Number(source.split("MORPH_POINT_COUNT = ")[1].split(";")[0]);
  const cycleMs = Number(source.split("MORPH_CYCLE_MS = ")[1].split(";")[0]);
  const variants = JSON.parse(
    source.split("export const MORPH_VARIANTS = ")[1].replace(/;\s*$/, ""),
  ) as MorphVariant[];
  if (!opts?.allowPointMismatch && pointCount !== POINTS) {
    throw new Error(
      `morphData has ${pointCount} points, script expects ${POINTS}. Run: bun run logo:morph -- rebuild`,
    );
  }
  return { variants, cycleMs, pointCount };
};

const writeMorph = async (variants: MorphVariant[], cycleMs: number) => {
  const body =
    `export const MORPH_POINT_COUNT = ${POINTS};\n` +
    `export const MORPH_CYCLE_MS = ${cycleMs};\n\n` +
    `export const MORPH_VARIANTS = ${JSON.stringify(variants)};\n`;
  await writeFile(MORPH_PATH, body);
  return Buffer.byteLength(body);
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const writeSvg = async (id: string, paths: string[]) => {
  const body = paths
    .map((d) => `<path d="${d}" fill="currentColor" fill-rule="evenodd"/>`)
    .join("");
  await writeFile(
    path.join(VARIANTS_DIR, `${id}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}">${body}</svg>\n`,
  );
};

const canonicalSlots = (variants: MorphVariant[]) => {
  const stride = POINTS * 2;
  return variants[0].glyphs.map((glyph) => {
    const slots: Contour[] = [];
    for (let offset = 0; offset < glyph.length; offset += stride) {
      const points: Contour = [];
      for (let i = 0; i < stride; i += 2) points.push([glyph[offset + i], glyph[offset + i + 1]]);
      slots.push(points);
    }
    return slots;
  });
};

const exists = async (file: string) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

const loadFont = async (spec: FontSpec) => {
  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${spec.id}.ttf`);
  if (!(await exists(file))) {
    console.log(`download ${spec.id}`);
    const res = await fetch(sourceUrl(spec));
    if (!res.ok) throw new Error(`download failed ${res.status} ${sourceUrl(spec)}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  let font = fontkit.openSync(file);
  if (spec.weight != null && typeof font.getVariation === "function") {
    font = font.getVariation({ wght: spec.weight });
  }
  return font;
};

const pathToSvg = (
  commands: Array<{ command: string; args: number[] }>,
  matrix: Matrix,
) => {
  let d = "";
  for (const { command, args } of commands) {
    if (command === "moveTo") {
      const [x, y] = transform(matrix, [args[0], args[1]]);
      d += `M${x} ${y}`;
    } else if (command === "lineTo") {
      const [x, y] = transform(matrix, [args[0], args[1]]);
      d += `L${x} ${y}`;
    } else if (command === "quadraticCurveTo") {
      const [cx, cy] = transform(matrix, [args[0], args[1]]);
      const [x, y] = transform(matrix, [args[2], args[3]]);
      d += `Q${cx} ${cy} ${x} ${y}`;
    } else if (command === "bezierCurveTo") {
      const [c1x, c1y] = transform(matrix, [args[0], args[1]]);
      const [c2x, c2y] = transform(matrix, [args[2], args[3]]);
      const [x, y] = transform(matrix, [args[4], args[5]]);
      d += `C${c1x} ${c1y} ${c2x} ${c2y} ${x} ${y}`;
    } else if (command === "closePath") {
      d += "Z";
    }
  }
  return d;
};

const render = async (spec: FontSpec) => {
  const font = await loadFont(spec);
  const text = spec.text ?? DEFAULT_TEXT;
  const letters = [...text].filter((ch) => ch !== " ");
  if (letters.length !== 8) {
    throw new Error(`${spec.id}: need 8 letters, got ${letters.length} from ${JSON.stringify(text)}`);
  }

  let cursor = 0;
  const raw: Array<{ commands: Array<{ command: string; args: number[] }>; offset: number }> = [];
  const allPoints: Point[] = [];
  const upm = font.unitsPerEm;

  for (const ch of text) {
    if (ch === " ") {
      cursor += upm * 0.35;
      continue;
    }
    const glyph = font.glyphForCodePoint(ch.codePointAt(0)!);
    if (!glyph) throw new Error(`${spec.id}: missing glyph for ${JSON.stringify(ch)}`);
    const commands = glyph.path.commands as Array<{ command: string; args: number[] }>;
    raw.push({ commands, offset: cursor });
    for (const contour of flatten(commands, [1, 0, 0, -1, cursor, 0])) {
      allPoints.push(...contour);
    }
    cursor += glyph.advanceWidth;
  }

  const minX = Math.min(...allPoints.map((p) => p[0]));
  const maxX = Math.max(...allPoints.map((p) => p[0]));
  const minY = Math.min(...allPoints.map((p) => p[1]));
  const maxY = Math.max(...allPoints.map((p) => p[1]));
  const scale = Math.min(TARGET_W / (maxX - minX), TARGET_H / (maxY - minY));
  const fittedW = (maxX - minX) * scale;
  const fittedH = (maxY - minY) * scale;
  const tx = (VIEW_W - fittedW) / 2 - minX * scale;
  const ty = (VIEW_H - fittedH) / 2 - minY * scale;

  const contours: Contour[][] = [];
  const paths: string[] = [];
  for (const { commands, offset } of raw) {
    const matrix: Matrix = [scale, 0, 0, -scale, tx + offset * scale, ty];
    contours.push([...flatten(commands, matrix)].sort((a, b) => area(b) - area(a)));
    paths.push(pathToSvg(commands, matrix));
  }
  return { contours, paths, text };
};

const bakeFromPrepared = async (
  id: string,
  contours: Contour[][],
  paths: string[],
  text: string,
  slots: Contour[][],
) => {
  const glyphs = slots.map((glyphSlots, glyphIndex) => {
    const shaped = contours[glyphIndex];
    const flat: number[] = [];
    for (const [slot, target] of glyphSlots.entries()) {
      const points =
        slot < shaped.length
          ? align(sample(shaped[slot]), target)
          : Array.from({ length: POINTS }, () => center(target));
      for (const [x, y] of points) {
        flat.push(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
      }
    }
    return flat;
  });
  await writeSvg(id, paths);
  console.log(
    `${id} text=${JSON.stringify(text)} contours=${JSON.stringify(contours.map((c) => c.length))} slots=${JSON.stringify(slots.map((s) => s.length))}`,
  );
  return { id, paths, glyphs } satisfies MorphVariant;
};

const bake = async (spec: FontSpec, slots: Contour[][]) => {
  const { contours, paths, text } = await render(spec);
  return bakeFromPrepared(spec.id, contours, paths, text, slots);
};

const buildSlots = (prepared: Array<{ contours: Contour[][] }>) => {
  const slotCounts = Array.from({ length: 8 }, (_, glyph) =>
    Math.max(...prepared.map((item) => item.contours[glyph].length)),
  );
  return slotCounts.map((count, glyph) =>
    Array.from({ length: count }, (_, slot) => {
      const source = prepared.find((item) => item.contours[glyph].length > slot);
      if (!source) throw new Error(`missing contour for glyph ${glyph} slot ${slot}`);
      return sample(source.contours[glyph][slot]);
    }),
  );
};

const resolveSpec = (id: string, flags: {
  google?: string;
  url?: string;
  weight?: number;
  text?: string;
}): FontSpec => {
  const base = CATALOG[id];
  const google = flags.google ?? base?.google;
  const url = flags.url ?? base?.url;
  const weight = flags.weight ?? base?.weight;
  const text = flags.text ?? base?.text ?? DEFAULT_TEXT;
  if (!google && !url) {
    throw new Error(`unknown font ${JSON.stringify(id)}; pass --google ofl/.../Font.ttf`);
  }
  return { id, google, url, weight, text };
};

const cmdList = async () => {
  const { variants, pointCount } = await loadMorph({ allowPointMismatch: true });
  const baked = new Map(variants.map((v, i) => [v.id, i]));
  console.log(`points ${pointCount} (script ${POINTS})`);
  console.log(`${"id".padEnd(16)} ${"idx".padEnd(4)} ${"catalog".padEnd(8)} source`);
  const ids = [...new Set([...Object.keys(CATALOG), ...variants.map((v) => v.id)])];
  for (const id of ids) {
    const spec = CATALOG[id];
    const src = spec?.google ?? spec?.url ?? "-";
    const mark = baked.has(id) ? String(baked.get(id)) : "-";
    console.log(`${id.padEnd(16)} ${mark.padEnd(4)} ${(spec ? "yes" : "no").padEnd(8)} ${src}`);
  }
};

const cmdAdd = async (id: string, flags: {
  google?: string;
  url?: string;
  weight?: number;
  text?: string;
  force?: boolean;
}) => {
  const { variants, cycleMs } = await loadMorph();
  const spec = resolveSpec(id, flags);
  const existing = variants.findIndex((v) => v.id === spec.id);
  if (existing !== -1 && !flags.force) {
    throw new Error(`${spec.id} already exists; pass --force to replace`);
  }
  const variant = await bake(spec, canonicalSlots(variants));
  if (existing !== -1) variants[existing] = variant;
  else variants.push(variant);
  const bytes = await writeMorph(variants, cycleMs);
  console.log(`wrote ${MORPH_PATH} (${variants.length} variants, ${formatBytes(bytes)})`);
};

const cmdRebuild = async () => {
  const { variants: existing, cycleMs } = await loadMorph({ allowPointMismatch: true });
  const prepared: Array<{ id: string; contours: Contour[][]; paths: string[]; text: string }> = [];
  for (const variant of existing) {
    const spec = CATALOG[variant.id];
    if (!spec) throw new Error(`add ${variant.id} to CATALOG before rebuild`);
    const rendered = await render(resolveSpec(variant.id, {}));
    prepared.push({ id: variant.id, ...rendered });
  }
  const slots = buildSlots(prepared);
  const variants: MorphVariant[] = [];
  for (const item of prepared) {
    variants.push(
      await bakeFromPrepared(item.id, item.contours, item.paths, item.text, slots),
    );
  }
  const bytes = await writeMorph(variants, cycleMs);
  console.log(
    `rebuilt ${variants.length} variants at ${POINTS} points (${formatBytes(bytes)}) -> ${MORPH_PATH}`,
  );
};

const help = `Bake logo font variants into morphData.js + SVGs.

Commands:
  list
  add <id> [--google ofl/.../Font.ttf] [--url URL] [--weight N] [--text TEXT] [--force]
  rebuild

Examples:
  bun run logo:morph -- list
  bun run logo:morph -- rebuild
  bun run logo:morph -- add bowlbyOne
  bun run logo:morph -- add literata --force
`;

const main = async () => {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      google: { type: "string" },
      url: { type: "string" },
      weight: { type: "string" },
      text: { type: "string" },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(help);
    return;
  }

  const [cmd, id] = positionals;
  if (cmd === "list") {
    await cmdList();
    return;
  }
  if (cmd === "rebuild") {
    await cmdRebuild();
    return;
  }
  if (cmd === "add") {
    if (!id) throw new Error("add requires <id>");
    await cmdAdd(id, {
      google: values.google,
      url: values.url,
      weight: values.weight != null ? Number(values.weight) : undefined,
      text: values.text,
      force: values.force,
    });
    return;
  }
  throw new Error(`unknown command ${JSON.stringify(cmd)}\n${help}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
