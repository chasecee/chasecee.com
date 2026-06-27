export function previewPath(path: string, preview = false): string {
  if (!preview) return path;
  if (path.startsWith("/preview")) return path;
  return `/preview${path === "/" ? "" : path}`;
}
