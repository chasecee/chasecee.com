"use client";

import * as React from "react";
import {
  MORPH_CYCLE_MS,
  MORPH_POINT_COUNT,
  MORPH_VARIANTS as BASE_MORPH_VARIANTS,
} from "./variants/morphData.js";

const WIDTH = 402;
const HEIGHT = 85;
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
const STEP_MS = MORPH_CYCLE_MS / MORPH_VARIANTS.length;
const STORAGE_KEY = "chasecee:logo-font";
const PATHS_STORAGE_KEY = "chasecee:logo-paths";

const interpolate = (
  from: readonly number[],
  to: readonly number[],
  progress: number,
) => from.map((value, index) => value + (to[index] - value) * progress);

const toPath = (points: readonly number[]) => {
  let path = "";
  const contourSize = MORPH_POINT_COUNT * 2;

  for (let offset = 0; offset < points.length; offset += contourSize) {
    path += `M${points[offset]} ${points[offset + 1]}`;
    for (let point = 1; point < MORPH_POINT_COUNT; point++) {
      const index = offset + point * 2;
      path += `L${points[index]} ${points[index + 1]}`;
    }
    path += "Z";
  }

  return path;
};

const ease = (progress: number) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

interface ChaseCeeLogoProps extends React.SVGProps<SVGSVGElement> {
  active?: boolean;
}

const ChaseCeeLogo = ({
  active = false,
  className,
  ...props
}: ChaseCeeLogoProps) => {
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const frameRef = React.useRef<number>(0);
  const variantRef = React.useRef(0);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const draw = (
      glyphs: readonly (readonly number[])[],
      paths?: readonly string[],
    ) => {
      glyphs.forEach((points, index) => {
        pathRefs.current[index]?.setAttribute("d", paths?.[index] ?? toPath(points));
      });
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
          (startIndex + Math.floor(elapsed / STEP_MS)) %
          MORPH_VARIANTS.length;
        const next = (step + 1) % MORPH_VARIANTS.length;
        const rawProgress = (elapsed % STEP_MS) / STEP_MS;
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
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
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
