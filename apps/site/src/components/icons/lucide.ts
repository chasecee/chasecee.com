import {
  Asterisk,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Heart,
  Maximize2,
} from "lucide-static";

export const LUCIDE_ICONS = {
  asterisk: Asterisk,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  externalLink: ExternalLink,
  fileText: FileText,
  heart: Heart,
  maximize2: Maximize2,
} as const;

interface LucideSvgOptions {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function getLucideSvg(
  icon: string,
  { size = 24, className, strokeWidth }: LucideSvgOptions = {},
): string {
  let svg = icon.trim();
  svg = svg.replace(/width="[^"]*"/, `width="${size}"`);
  svg = svg.replace(/height="[^"]*"/, `height="${size}"`);

  if (typeof className === "string") {
    svg = svg.replace(/class="[^"]*"/, `class="${className}"`);
  }

  if (typeof strokeWidth === "number") {
    svg = svg.replace(/stroke-width="[^"]*"/, `stroke-width="${strokeWidth}"`);
  }

  return svg;
}
