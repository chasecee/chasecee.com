"use client";

import * as React from "react";
import {
  MORPH_POINT_COUNT,
  MORPH_VARIANTS as BASE_MORPH_VARIANTS,
} from "./variants/morphData.js";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./silhouette";

const ADDITIONAL_FONT_IDS = [
  "archivoBlack",
  "bungee",
  "changaOne",
  "fredoka",
  "ibmPlexSansCondensed",
  "oswald",
  "playfairDisplayBlack",
  "soraExtraBold",
  "teko",
  "workSansBlack",
] as const;
const MORPH_VARIANTS = [
  ...BASE_MORPH_VARIANTS,
  ...ADDITIONAL_FONT_IDS.map((id, index) => ({
    ...BASE_MORPH_VARIANTS[index % BASE_MORPH_VARIANTS.length],
    id,
  })),
] as const;
const BASE_VARIANT_COUNT = BASE_MORPH_VARIANTS.length;
const STORAGE_KEY = "chasecee:logo-font";
const PATHS_STORAGE_KEY = "chasecee:logo-paths";

const interpolate = (
  from: readonly number[],
  to: readonly number[],
  progress: number,
) => from.map((value, index) => value + (to[index] - value) * progress);

const mid = (ax: number, ay: number, bx: number, by: number) => ({
  x: (ax + bx) / 2,
  y: (ay + by) / 2,
});

const fmt = (value: number) => Number(value.toFixed(2));

const toPath = (points: readonly number[]) => {
  let path = "";
  const contourSize = MORPH_POINT_COUNT * 2;

  for (let offset = 0; offset < points.length; offset += contourSize) {
    const firstX = points[offset];
    const firstY = points[offset + 1];
    const secondX = points[offset + 2];
    const secondY = points[offset + 3];
    const start = mid(firstX, firstY, secondX, secondY);
    path += `M${fmt(start.x)} ${fmt(start.y)}`;

    for (let point = 1; point < MORPH_POINT_COUNT; point++) {
      const index = offset + point * 2;
      const next = offset + ((point + 1) % MORPH_POINT_COUNT) * 2;
      const controlX = points[index];
      const controlY = points[index + 1];
      const end = mid(controlX, controlY, points[next], points[next + 1]);
      path += `Q${fmt(controlX)} ${fmt(controlY)} ${fmt(end.x)} ${fmt(end.y)}`;
    }
    path += "Z";
  }

  return path;
};

const ease = (progress: number) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

const parseCssDurationMs = (raw: string) => {
  const value = raw.trim();
  if (!value) return null;
  if (value.endsWith("ms")) return Number.parseFloat(value);
  if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
  return null;
};

export type LogoGlyphs = readonly (readonly number[])[];
export type MorphFrame = {
  fromBaseIndex: number;
  toBaseIndex: number;
  progress: number;
};

interface ChaseCeeLogoProps extends React.SVGProps<SVGSVGElement> {
  active?: boolean;
  onGlyphs?: (glyphs: LogoGlyphs) => void;
  onMorphFrame?: (frame: MorphFrame) => void;
  ref?: React.Ref<SVGSVGElement>;
}

const ChaseCeeLogo = ({
  active = false,
  onGlyphs,
  onMorphFrame,
  className,
  ref,
  ...props
}: ChaseCeeLogoProps) => {
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const frameRef = React.useRef<number>(0);
  const variantRef = React.useRef(0);
  const initializedRef = React.useRef(false);
  const onGlyphsRef = React.useRef(onGlyphs);
  const onMorphFrameRef = React.useRef(onMorphFrame);
  onGlyphsRef.current = onGlyphs;
  onMorphFrameRef.current = onMorphFrame;

  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const logoCycleMs =
      parseCssDurationMs(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--logo-cycle-duration",
        ),
      ) ?? 1080;
    const stepMs = logoCycleMs / 3;

    const draw = (
      glyphs: LogoGlyphs,
      paths?: readonly string[],
    ) => {
      glyphs.forEach((points, index) => {
        pathRefs.current[index]?.setAttribute("d", paths?.[index] ?? toPath(points));
      });
      onGlyphsRef.current?.(glyphs);
    };

    const stop = () => window.cancelAnimationFrame(frameRef.current);

    const persist = (index: number) => {
      const variant = MORPH_VARIANTS[index];
      localStorage.setItem(STORAGE_KEY, variant.id);
      localStorage.setItem(PATHS_STORAGE_KEY, JSON.stringify(variant.paths));
    };

    const commit = (index: number) => {
      const variant = MORPH_VARIANTS[index];
      variantRef.current = index;
      draw(variant.glyphs, variant.paths);
      persist(index);
      const baseIndex = index % BASE_VARIANT_COUNT;
      onMorphFrameRef.current?.({
        fromBaseIndex: baseIndex,
        toBaseIndex: baseIndex,
        progress: 1,
      });
    };

    if (!initializedRef.current) {
      const storedId = localStorage.getItem(STORAGE_KEY);
      const storedIndex = MORPH_VARIANTS.findIndex(({ id }) => id === storedId);
      variantRef.current = storedIndex === -1 ? 0 : storedIndex;
      initializedRef.current = true;
    }

    stop();

    if (active && !reducedMotion.matches) {
      const startedAt = performance.now();
      const startIndex = variantRef.current;

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const step =
          (startIndex + Math.floor(elapsed / stepMs)) %
          MORPH_VARIANTS.length;
        const next = (step + 1) % MORPH_VARIANTS.length;
        const rawProgress = (elapsed % stepMs) / stepMs;
        const progress = ease(Math.min(rawProgress / 0.62, 1));
        const from = MORPH_VARIANTS[step];
        const to = MORPH_VARIANTS[next];
        const nearest = progress < 0.5 ? step : next;

        if (nearest !== variantRef.current) {
          variantRef.current = nearest;
          persist(nearest);
        }

        if (progress === 1) {
          draw(to.glyphs, to.paths);
        } else {
          draw(
            from.glyphs.map((points, index) =>
              interpolate(points, to.glyphs[index], progress),
            ),
          );
        }
        onMorphFrameRef.current?.({
          fromBaseIndex: step % BASE_VARIANT_COUNT,
          toBaseIndex: next % BASE_VARIANT_COUNT,
          progress,
        });
        frameRef.current = window.requestAnimationFrame(tick);
      };

      frameRef.current = window.requestAnimationFrame(tick);
      return stop;
    }

    commit(variantRef.current);
    return stop;
  }, [active]);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={LOGO_VIEW_WIDTH}
      height={LOGO_VIEW_HEIGHT}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      fill="none"
      data-chasecee-logo
      className={["logo-wordmark-svg", className].filter(Boolean).join(" ")}
      {...props}
    >
      {MORPH_VARIANTS[0].glyphs.map((_, index) => (
        <path
          key={index}
          ref={(node) => {
            pathRefs.current[index] = node;
          }}
          d={MORPH_VARIANTS[0].paths[index]}
          suppressHydrationWarning
          fillRule="evenodd"
          className="logo-wordmark-path"
        />
      ))}
    </svg>
  );
};

export default ChaseCeeLogo;
