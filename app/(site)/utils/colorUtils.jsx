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

export default generateColorPalette;
