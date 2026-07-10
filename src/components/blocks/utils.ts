import { stegaClean } from "@sanity/client/stega";

export function normalizeAspectRatio(value: string | undefined): string {
  if (!value) return "16 / 9";
  const cleaned = stegaClean(value).trim();
  const compact = cleaned.replace(/\s+/g, "");
  const slash = compact.includes("/") ? compact : compact.replace(":", "/");
  if (!/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(slash)) return "16 / 9";
  const [width, height] = slash.split("/");
  return `${width} / ${height}`;
}

export function cleanMaybe(value: string | undefined, draftMode: boolean): string {
  if (!value) return "";
  return (draftMode ? value : stegaClean(value)).trim();
}
