import { hslToRgb, rgbToHsl, parseHSLA } from "./color.ts";

const generateColorPalette = (baseColor) => {
  const palette = [];
  let f = parseInt(baseColor.slice(1), 16);
  let R = f >> 16;
  let G = (f >> 8) & 0x00ff;
  let B = f & 0x0000ff;

  // Convert RGB to HSL
  let [h, s, l] = rgbToHsl(R, G, B);

  // Adjust hue by a fixed amount
  h = (h + 0.1) % 1; // Adjust this value to get a different analogous color

  for (let i = 0; i <= 1; i += 0.1) {
    // Adjust lightness by percent
    l = i;

    // Convert back to RGB
    [R, G, B] = hslToRgb(h, s, l);

    const color =
      "#" + (R * 0x10000 + G * 0x100 + B).toString(16).padStart(6, "0");

    palette.push(color);
  }

  return palette;
};

export { parseHSLA };

export const interpolateHSLA = (color1, color2, factor) => {
  const hsla1 = parseHSLA(color1);
  const hsla2 = parseHSLA(color2);

  let h1 = hsla1.h;
  let h2 = hsla2.h;
  let hDiff = h2 - h1;

  if (Math.abs(hDiff) > 180) {
    if (hDiff > 0) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }

  const h = (h1 + (h2 - h1) * factor) % 360;
  const s = hsla1.s + (hsla2.s - hsla1.s) * factor;
  const l = hsla1.l + (hsla2.l - hsla1.l) * factor;
  const a = hsla1.a + (hsla2.a - hsla1.a) * factor;

  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
};

export const generateRainbowFromPalette = (
  index,
  totalBodies,
  colorLevel,
  paletteColors,
) => {
  const colorOrder = [
    "red",
    "amber",
    "green",
    "teal",
    "blue",
    "purple",
    "pink",
  ];

  const levelIndex = Math.min(Math.max(colorLevel, 0), 9);
  const rainbowPosition = (index / totalBodies) % 1;
  const colorPosition = rainbowPosition * colorOrder.length;
  const colorIndex = Math.floor(colorPosition);
  const nextColorIndex = (colorIndex + 1) % colorOrder.length;
  const interpolationFactor = colorPosition - colorIndex;

  const currentColor =
    paletteColors[colorOrder[colorIndex]]?.[levelIndex] ||
    paletteColors[colorOrder[colorIndex]]?.[0] ||
    "HSLA(0,100%,50%,1)";
  const nextColor =
    paletteColors[colorOrder[nextColorIndex]]?.[levelIndex] ||
    paletteColors[colorOrder[nextColorIndex]]?.[0] ||
    "HSLA(0,100%,50%,1)";

  return interpolateHSLA(currentColor, nextColor, interpolationFactor);
};

export default generateColorPalette;
