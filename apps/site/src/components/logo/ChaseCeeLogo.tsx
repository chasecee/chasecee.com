"use client";

import * as React from "react";
import { MORPH_POINT_COUNT, MORPH_VARIANTS } from "./variants/morphData.js";
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
    const from = MORPH_VARIANTS[fromIndex];
    const to = MORPH_VARIANTS[toIndex];
    const durationMs = morphMsRef.current;
    const startedAt = performance.now();
    morphingRef.current = true;
    setKapowActive(true, fromIndex % 4);

    const tick = (now: number) => {
      const raw = Math.min((now - startedAt) / durationMs, 1);
      const progress = Math.min(
        Math.max(sampleCubicBezier(raw, DEFAULT_MORPH_BEZIER), 0),
        1,
      );
      for (let index = 0; index < from.glyphs.length; index++) {
        const scratch = interpolatePointsInto(
          morphScratch.current,
          from.glyphs[index],
          to.glyphs[index],
          progress,
        );
        morphScratch.current = scratch;
        setPathValue(index, pointsToQuadraticPath(scratch, MORPH_POINT_COUNT));
      }
      if (raw >= 1) {
        to.paths.forEach((pathValue, index) => setPathValue(index, pathValue));
        localStorage.setItem(STORAGE_KEY, to.id);
        indexRef.current = toIndex;
        morphingRef.current = false;
        fontFrameRef.current = 0;
        onIndexChangeRef.current(toIndex);
        return;
      }
      fontFrameRef.current = requestAnimationFrame(tick);
    };

    fontFrameRef.current = requestAnimationFrame(tick);
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

  React.useLayoutEffect(() => {
    MORPH_VARIANTS[initialIndex].paths.forEach((pathValue, index) => {
      setPathValue(index, pathValue);
    });
  }, [initialIndex]);

  const pathCount = MORPH_VARIANTS[initialIndex].paths.length;

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
