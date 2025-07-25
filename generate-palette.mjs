import fs from "fs";
import path from "path";

/**
 * Parses an HSLA string like "HSLA(216,50%,12%,1)" into an object.
 * @param {string} hslaStr
 * @returns {{h: number, s: number, l: number, a: number}}
 */
function parseHsla(hslaStr) {
  const [h, s, l, a] = hslaStr.match(/(\d+(\.\d+)?)/g).map(Number);
  // Convert to 0-1 range for HSL logic
  return { h: h / 360, s: s / 100, l: l / 100, a };
}

/**
 * Converts an HSL color value to RGB.
 * Assumes h, s, and l are contained in the set [0, 1].
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @returns {{r: number, g: number, b: number}} The RGB representation
 */
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Linearly interpolates between two colors.
 * @param {{r,g,b}} color1
 * @param {{r,g,b}} color2
 * @param {number} factor Interpolation factor (0-1).
 * @returns {{r: number, g: number, b: number}}
 */
function lerpColor(color1, color2, factor) {
  const r = Math.round(color1.r + (color2.r - color1.r) * factor);
  const g = Math.round(color1.g + (color2.g - color1.g) * factor);
  const b = Math.round(color1.b + (color2.b - color1.b) * factor);
  return { r, g, b };
}

async function main() {
  try {
    const configPath = path.resolve(
      "./app/(site)/components/hero/HomeHero9/physics.config.json",
    );
    const outputPath = path.resolve(
      "./app/(site)/components/hero/HomeHero9/palette-rgb.ts",
    );

    console.log(`Reading config from: ${configPath}`);
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const palettes = config.rendering.palette;
    const proceduralMode = !palettes;
    const colorOrder = [
      "red",
      "amber",
      "green",
      "teal",
      "blue",
      "purple",
      "pink",
    ];

    const output = {};

    const totalSteps = 1024; // resolution per level

    console.log("Processing color levels 0-9...");
    for (let level = 0; level < 10; level++) {
      let keyColorsRgb;
      if (proceduralMode) {
        // fallback: evenly spaced hues around the wheel
        keyColorsRgb = colorOrder.map((_, idx) => {
          const hue = idx / colorOrder.length;
          const sat = 0.85;
          const light = 0.45 + (level - 4) * 0.03; // vary slight per level
          return hslToRgb(hue, sat, Math.max(0, Math.min(1, light)));
        });
      } else {
        keyColorsRgb = colorOrder.map((colorName) => {
          const hslaStr = palettes[colorName][level];
          if (!hslaStr) {
            throw new Error(`Missing color for ${colorName} at level ${level}`);
          }
          const { h, s, l } = parseHsla(hslaStr);
          return hslToRgb(h, s, l);
        });
      }

      const interpolatedColors = [];

      for (let i = 0; i < totalSteps; i++) {
        const position = i / totalSteps;
        const scaledPos = position * colorOrder.length;

        const fromIndex = Math.floor(scaledPos) % colorOrder.length;
        const toIndex = (fromIndex + 1) % colorOrder.length;

        const factor = scaledPos - Math.floor(scaledPos);

        const fromColor = keyColorsRgb[fromIndex];
        const toColor = keyColorsRgb[toIndex];

        interpolatedColors.push(lerpColor(fromColor, toColor, factor));
      }
      output[level] = interpolatedColors;
    }

    // --- write legacy TypeScript (kept for reference / git history) ---
    const tsContent =
      `// This file is auto-generated. Do not edit.\n` +
      `// Run 'node generate-palette.mjs' to regenerate.\n\n` +
      `export const interpolatedColorWheels = ${JSON.stringify(output, null, 2)};\n`;

    fs.writeFileSync(outputPath.replace(/\.ts$/, ".legacy.ts"), tsContent);

    // --- write compact binary ---
    const LEVELS = 10;
    const COLORS_PER_LEVEL = totalSteps;
    const BYTES_PER_COLOR = 3;
    const binBuffer = new Uint8Array(
      LEVELS * COLORS_PER_LEVEL * BYTES_PER_COLOR,
    );

    for (let level = 0; level < LEVELS; level++) {
      const levelColors = output[level];
      for (let i = 0; i < COLORS_PER_LEVEL; i++) {
        const { r, g, b } = levelColors[i];
        const base = (level * COLORS_PER_LEVEL + i) * BYTES_PER_COLOR;
        binBuffer[base] = r;
        binBuffer[base + 1] = g;
        binBuffer[base + 2] = b;
      }
    }

    const binPath = path.resolve(
      "./app/(site)/components/hero/HomeHero9/palette-rgb.bin",
    );
    fs.writeFileSync(binPath, binBuffer);
    console.log(
      `✅ Compact palette written to ${binPath} (${binBuffer.length} bytes)`,
    );
  } catch (error) {
    console.error("❌ Failed to generate palette:", error);
    process.exit(1);
  }
}

main();
