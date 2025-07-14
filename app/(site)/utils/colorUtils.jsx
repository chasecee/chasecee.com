const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
};

const hslToRgb = (h, s, l) => {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    let hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

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

export const parseHSLA = (hslaString) => {
  const match = hslaString.match(/HSLA\((\d+),(\d+)%,(\d+)%,([0-9.]+)\)/);
  if (!match) return { h: 0, s: 0, l: 0, a: 1 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
    a: parseFloat(match[4]),
  };
};

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
