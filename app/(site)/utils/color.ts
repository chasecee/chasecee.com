export const rgbToHsl = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
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

export const hslToRgb = (
  h: number,
  s: number,
  l: number,
): [number, number, number] => {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
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

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export const parseHSLA = (
  hslaString: string,
): { h: number; s: number; l: number; a: number } => {
  const match = hslaString.match(/HSLA\((\d+),(\d+)%,(\d+)%,([0-9.]+)\)/);
  if (!match) return { h: 0, s: 0, l: 0, a: 1 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
    a: parseFloat(match[4]),
  };
};

export const parseHsla = (
  hsla: string,
): { h: number; s: number; l: number } => {
  const matches = hsla.match(/(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length < 3) return { h: 0, s: 0, l: 0 };
  const [h, s, l] = matches.map(Number);
  return { h: h / 360, s: s / 100, l: l / 100 };
};

export const lerpColor = (
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  f: number,
): { r: number; g: number; b: number } => {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * f),
    g: Math.round(c1.g + (c2.g - c1.g) * f),
    b: Math.round(c1.b + (c2.b - c1.b) * f),
  } as const;
};
