"use client";

import * as React from "react";
import {
  MORPH_POINT_COUNT,
  MORPH_PATHS,
  MORPH_VARIANT_IDS,
} from "./variants/morphMeta.js";
import { loadGlyphs, prefetchGlyphs } from "./variants/loadGlyphs";
import {
  interpolatePointsInto,
  KAPOW_VARIANT_PATHS,
  pointsToQuadraticPath,
} from "./kapowMorph";
import { DEFAULT_MORPH_BEZIER, sampleCubicBezier } from "./morphEase";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./silhouette";

const STORAGE_KEY = "chasecee:logo-font";

export const FONT_CYCLE = [5, 0, 3, 1, 2, 4] as const;

type ChaseCeeLogoProps = {
  initialIndex: number;
  exploding: boolean;
  morphNonce: number;
  morphDurationMs: number;
  onIndexChange: (index: number) => void;
  mirrorPathRefs?: Array<React.RefObject<(SVGPathElement | null)[]>>;
  pathClassName?: string;
  className?: string;
} & Omit<React.SVGProps<SVGSVGElement>, "children">;

const nextIndex = (from: number) => {
  const at = FONT_CYCLE.indexOf(from as (typeof FONT_CYCLE)[number]);
  return FONT_CYCLE[at === -1 ? 0 : (at + 1) % FONT_CYCLE.length];
};

export default function ChaseCeeLogo({
  initialIndex,
  exploding,
  morphNonce,
  morphDurationMs,
  onIndexChange,
  mirrorPathRefs,
  pathClassName,
  className,
  ...props
}: ChaseCeeLogoProps) {
  const kapowPathRef = React.useRef<SVGPathElement | null>(null);
  const underlayPathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const fontFrameRef = React.useRef(0);
  const indexRef = React.useRef(initialIndex);
  const morphTokenRef = React.useRef(0);
  const morphingRef = React.useRef(false);
  const morphMsRef = React.useRef(morphDurationMs);
  const onIndexChangeRef = React.useRef(onIndexChange);
  const mirrorRef = React.useRef(mirrorPathRefs);
  const morphScratch = React.useRef<number[]>([]);

  morphMsRef.current = morphDurationMs;
  onIndexChangeRef.current = onIndexChange;
  mirrorRef.current = mirrorPathRefs;

  const setPathValue = (index: number, pathValue: string) => {
    underlayPathRefs.current[index]?.setAttribute("d", pathValue);
    pathRefs.current[index]?.setAttribute("d", pathValue);
    mirrorRef.current?.forEach((groupRef) => {
      groupRef.current[index]?.setAttribute("d", pathValue);
    });
  };

  const setKapowActive = (on: boolean, phase: number | null) => {
    const node = kapowPathRef.current;
    if (!node) return;
    node.classList.toggle("logo-kapow-path--active", on);
    for (let i = 0; i < 4; i++) {
      node.classList.toggle(`logo-kapow-path--phase-${i}`, on && phase === i);
    }
  };

  const stopFont = () => {
    if (!fontFrameRef.current) return;
    cancelAnimationFrame(fontFrameRef.current);
    fontFrameRef.current = 0;
  };

  const startMorph = React.useCallback(() => {
    stopFont();

    const fromIndex = indexRef.current;
    const toIndex = nextIndex(fromIndex);
    const toPaths = MORPH_PATHS[toIndex];
    const durationMs = morphMsRef.current;
    morphingRef.current = true;
    setKapowActive(true, fromIndex % 4);
    const morphToken = ++morphTokenRef.current;

    const finishAt = (paths: readonly string[]) => {
      paths.forEach((pathValue, index) => setPathValue(index, pathValue));
      localStorage.setItem(STORAGE_KEY, MORPH_VARIANT_IDS[toIndex]);
      indexRef.current = toIndex;
      morphingRef.current = false;
      fontFrameRef.current = 0;
      onIndexChangeRef.current(toIndex);
      prefetchGlyphs(nextIndex(toIndex));
    };

    Promise.all([loadGlyphs(fromIndex), loadGlyphs(toIndex)])
      .then(([fromGlyphs, toGlyphs]) => {
        if (morphTokenRef.current !== morphToken || !morphingRef.current) return;
        const startedAt = performance.now();

        const tick = (now: number) => {
          const raw = Math.min((now - startedAt) / durationMs, 1);
          const progress = Math.min(
            Math.max(sampleCubicBezier(raw, DEFAULT_MORPH_BEZIER), 0),
            1,
          );
          for (let index = 0; index < fromGlyphs.length; index++) {
            const scratch = interpolatePointsInto(
              morphScratch.current,
              fromGlyphs[index],
              toGlyphs[index],
              progress,
            );
            morphScratch.current = scratch;
            setPathValue(index, pointsToQuadraticPath(scratch, MORPH_POINT_COUNT));
          }
          if (raw >= 1) {
            finishAt(toPaths);
            return;
          }
          fontFrameRef.current = requestAnimationFrame(tick);
        };

        fontFrameRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        // Glyph chunk failed to load (offline, etc.) — swap without tweening.
        if (morphTokenRef.current !== morphToken || !morphingRef.current) return;
        finishAt(toPaths);
      });
  }, []);

  React.useEffect(() => {
    const node = kapowPathRef.current;
    if (!node) return;
    if (morphNonce > 0 && exploding) {
      node.classList.remove("logo-kapow-path--explode");
      void node.getBoundingClientRect();
      node.classList.add("logo-kapow-path--explode");
      startMorph();
      return;
    }
    node.classList.toggle("logo-kapow-path--explode", exploding);
    if (!exploding && !morphingRef.current) setKapowActive(false, null);
  }, [exploding, morphNonce, startMorph]);

  React.useEffect(() => () => stopFont(), []);

  React.useEffect(() => {
    // Warm the glyph chunks for the current and next variant while idle so
    // the first click can tween without waiting on a network fetch.
    const warm = () => {
      prefetchGlyphs(indexRef.current);
      prefetchGlyphs(nextIndex(indexRef.current));
    };
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  React.useLayoutEffect(() => {
    if (!morphingRef.current) indexRef.current = initialIndex;
    MORPH_PATHS[initialIndex].forEach((pathValue, index) => {
      setPathValue(index, pathValue);
    });
  }, [initialIndex]);

  const pathCount = MORPH_PATHS[initialIndex].length;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={LOGO_VIEW_WIDTH}
      height={LOGO_VIEW_HEIGHT}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      fill="none"
      overflow="visible"
      data-chasecee-logo
      className={["logo-wordmark-svg", className].filter(Boolean).join(" ")}
      {...props}
    >
      <g className="logo-kapow-unskew">
        <path
          ref={kapowPathRef}
          d={KAPOW_VARIANT_PATHS[0]}
          suppressHydrationWarning
          className="logo-kapow-path"
        />
      </g>
      {Array.from({ length: pathCount }, (_, index) => (
        <path
          key={`underlay-${index}`}
          ref={(node) => {
            underlayPathRefs.current[index] = node;
          }}
          suppressHydrationWarning
          fillRule="evenodd"
          className="logo-wordmark-underlay-path"
        />
      ))}
      {Array.from({ length: pathCount }, (_, index) => (
        <path
          key={index}
          ref={(node) => {
            pathRefs.current[index] = node;
          }}
          suppressHydrationWarning
          fillRule="evenodd"
          style={{ fill: "var(--logo-wordmark-fill, var(--color-white))" }}
          className={["logo-wordmark-path", pathClassName].filter(Boolean).join(" ")}
        />
      ))}
    </svg>
  );
}
