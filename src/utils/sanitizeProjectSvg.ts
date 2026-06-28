export function sanitizeProjectSvg(code: string): string {
  return code.replace(/baseFrequency="inf inf"/g, 'baseFrequency="0.65 0.65"');
}
