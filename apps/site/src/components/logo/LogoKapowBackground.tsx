import type { CSSProperties } from "react";
import {
  KAPOW_HALFTONE_MASK_URL,
  KAPOW_HALFTONE_TILE_SIZE,
} from "./kapowHalftoneData";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./silhouette";

interface LogoKapowBackgroundProps {
  activePhase: number | null;
  isExploding: boolean;
}

const KAPOW_FRAME = "translate(12 8) scale(1.12 0.5)";

const kapowClass = (index: number, activePhase: number | null, isExploding: boolean) => {
  const classes = ["logo-kapow"];
  if (activePhase === index) {
    classes.push("logo-kapow--active");
    classes.push(`logo-kapow--phase-${index}`);
  }
  if (isExploding) {
    classes.push("logo-kapow--active");
    classes.push("logo-kapow--phase-0");
    classes.push("logo-kapow--explode");
  }
  return classes.join(" ");
};

export default function LogoKapowBackground({
  activePhase,
  isExploding,
}: LogoKapowBackgroundProps) {
  return (
    <span
      className="logo-kapow-layer pointer-events-none absolute -inset-20 [transform:skew(-3.5deg,-4deg)] z-0 overflow-visible"
      aria-hidden="true"
      style={
        {
          "--kapow-halftone-mask": `url("${KAPOW_HALFTONE_MASK_URL}")`,
          "--kapow-halftone-tile-size": `${KAPOW_HALFTONE_TILE_SIZE}px`,
        } as CSSProperties
      }
    >
      <svg
        viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
        className={`${kapowClass(0, activePhase, isExploding)} [--kapow-rotate:-8deg]`}
        overflow="visible"
      >
        <g transform={KAPOW_FRAME}>
          <g transform="translate(20 14) scale(1 0.7)">
            <path d="M159.4 5.8 L184.0 51.6 l57.8 -26.3 l-17.2 57.1 l62.6 9.9 l-45.6 40.7 l34.9 48.4 l-61.4 -6.5 l-4.5 40.8 l-47.0 -40.8 l-49.2 39.5 l1.6 -53.3 l-61.5 -0.6 l35.6 -40.6 L20.0 93.2 l66.7 -11.8 L69.3 24.0 l62.2 28.4 l27.9 -46.6 Z" />
          </g>
        </g>
      </svg>
      <svg
        viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
        className={`${kapowClass(1, activePhase, isExploding)} [--kapow-rotate:9deg] [--kapow-scale-x:-1]`}
        overflow="visible"
      >
        <g transform={KAPOW_FRAME}>
          <g transform="translate(20 16) scale(1 0.7)">
            <path d="M160 8 L176 24 L192 42 L212 30 L232 18 L228 40 L224 62 L255 64 L286 66 L266 83 L246 100 L262 121 L278 142 L249 139 L220 136 L213 155 L206 174 L187 160 L168 146 L146 159 L124 172 L126 149 L128 126 L97 129 L66 132 L83 112 L100 92 L77 76 L54 60 L86 57 L118 54 L113 32 L108 10 L129 26 L150 42 Z" />
          </g>
        </g>
      </svg>
      <svg
        viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
        className={`${kapowClass(2, activePhase, isExploding)} [--kapow-rotate:2deg]`}
        overflow="visible"
      >
        <g transform={KAPOW_FRAME}>
          <g transform="translate(20 15) scale(1 0.7)">
            <path d="M160 10 L172 26 L190 36 L208 26 L228 20 L224 42 L236 58 L256 62 L276 72 L260 90 L264 110 L250 126 L226 130 L214 146 L196 158 L176 150 L156 160 L142 144 L122 136 L98 138 L98 114 L80 98 L88 78 L78 58 L102 52 L112 32 L132 28 L148 14 Z" />
          </g>
        </g>
      </svg>
      <svg
        viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
        className={`${kapowClass(3, activePhase, isExploding)} [--kapow-rotate:-5deg]`}
        overflow="visible"
      >
        <g transform={KAPOW_FRAME}>
          <g transform="translate(20 18) scale(1 0.7)">
            <path d="M52 88 Q34 68 56 52 Q72 32 98 44 Q118 26 144 40 Q168 30 192 42 Q216 34 238 50 Q262 44 274 64 Q296 70 290 90 Q306 104 286 114 Q300 134 274 128 Q280 148 254 142 Q232 158 206 144 Q182 154 156 142 Q132 150 112 134 Q88 140 72 124 Q52 128 50 108 Q32 102 52 88 Z" />
          </g>
        </g>
      </svg>
    </span>
  );
}
