"use client";

import * as React from "react";
import { MORPH_POINT_COUNT, MORPH_VARIANTS } from "./variants/morphData.js";
import {
  interpolatePointsInto,
  KAPOW_POINT_COUNT,
  KAPOW_VARIANT_PATHS,
  KAPOW_VARIANT_POINTS,
  pointsToKapowPath,
  pointsToQuadraticPath,
} from "./kapowMorph";
import {
  DEFAULT_MORPH_BEZIER,
  sampleCubicBezier,
  type EaseBezier,
} from "./morphEase";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./silhouette";

const STORAGE_KEY = "chasecee:logo-font";

export const FONT_CYCLE = [8, 0, 6, 3, 4, 7] as const;

type ChaseCeeLogoProps = {
  initialIndex: number;
  active: boolean;
  exploding: boolean;
  restDurationMs: number;
  morphDurationMs: number;
  easeBezier?: EaseBezier;
  kapowStartOffsetMs?: number;
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
  active,
  exploding,
  restDurationMs,
  morphDurationMs,
  easeBezier = DEFAULT_MORPH_BEZIER,
  kapowStartOffsetMs = 0,
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
  const kapowFrameRef = React.useRef(0);
  const restTimerRef = React.useRef(0);
  const indexRef = React.useRef(initialIndex);
  const kapowIndexRef = React.useRef(0);
  const kapowFromRef = React.useRef(0);
  const kapowToRef = React.useRef(0);
  const kapowProgressRef = React.useRef(1);
  const morphingRef = React.useRef(false);
  const activeRef = React.useRef(active);
  const explodingRef = React.useRef(exploding);
  const easeBezierRef = React.useRef(easeBezier);
  const kapowOffsetRef = React.useRef(kapowStartOffsetMs);
  const restMsRef = React.useRef(restDurationMs);
  const morphMsRef = React.useRef(morphDurationMs);
  const onIndexChangeRef = React.useRef(onIndexChange);
  const mirrorRef = React.useRef(mirrorPathRefs);
  const morphScratch = React.useRef<number[]>([]);
  const kapowScratch = React.useRef<number[]>([]);
  const startRestRef = React.useRef(() => {});

  activeRef.current = active;
  explodingRef.current = exploding;
  easeBezierRef.current = easeBezier;
  kapowOffsetRef.current = kapowStartOffsetMs;
  restMsRef.current = restDurationMs;
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

  const setKapowPath = (index: number) => {
    kapowPathRef.current?.setAttribute(
      "d",
      pointsToKapowPath(KAPOW_VARIANT_POINTS[index], KAPOW_POINT_COUNT, 0),
    );
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

  const stopKapow = () => {
    if (!kapowFrameRef.current) return;
    cancelAnimationFrame(kapowFrameRef.current);
    kapowFrameRef.current = 0;
  };

  const stopRest = () => {
    if (!restTimerRef.current) return;
    clearTimeout(restTimerRef.current);
    restTimerRef.current = 0;
  };

  const settleKapow = (index: number) => {
    kapowIndexRef.current = index;
    kapowProgressRef.current = 1;
    setKapowPath(index);
  };

  const commitKapow = () => {
    if (kapowProgressRef.current >= 1) return;
    settleKapow(kapowProgressRef.current < 0.5 ? kapowFromRef.current : kapowToRef.current);
  };

  const startMorph = React.useCallback(() => {
    if (morphingRef.current) return;
    stopFont();
    stopRest();
    stopKapow();
    commitKapow();

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
        Math.max(sampleCubicBezier(raw, easeBezierRef.current), 0),
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
        if (activeRef.current && !explodingRef.current) startRestRef.current();
        return;
      }
      fontFrameRef.current = requestAnimationFrame(tick);
    };

    fontFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const startRest = React.useCallback(() => {
    if (!activeRef.current || morphingRef.current || explodingRef.current) return;
    stopRest();
    stopKapow();

    const count = KAPOW_VARIANT_POINTS.length;
    const from = kapowIndexRef.current % count;
    const to = (from + 1) % count;
    kapowFromRef.current = from;
    kapowToRef.current = to;
    kapowProgressRef.current = 0;
    const startedAt = performance.now();
    let completed = false;
    setKapowActive(true, indexRef.current % 4);

    const tick = (now: number) => {
      const restMs = restMsRef.current;
      const offset = Math.min(Math.max(kapowOffsetRef.current, 0), Math.max(restMs - 1, 0));
      const morphMs = Math.max(restMs - offset, 1);
      const raw = Math.min(Math.max(now - startedAt - offset, 0) / morphMs, 1);
      const progress = Math.min(sampleCubicBezier(raw, easeBezierRef.current), 1);
      kapowProgressRef.current = progress;
      const scratch = interpolatePointsInto(
        kapowScratch.current,
        KAPOW_VARIANT_POINTS[from],
        KAPOW_VARIANT_POINTS[to],
        progress,
      );
      kapowScratch.current = scratch;
      kapowPathRef.current?.setAttribute(
        "d",
        pointsToKapowPath(scratch, KAPOW_POINT_COUNT, 0),
      );
      if (raw >= 1) {
        completed = true;
        settleKapow(to);
        kapowFrameRef.current = 0;
        return;
      }
      kapowFrameRef.current = requestAnimationFrame(tick);
    };

    kapowFrameRef.current = requestAnimationFrame(tick);
    restTimerRef.current = window.setTimeout(() => {
      restTimerRef.current = 0;
      stopKapow();
      if (!completed) settleKapow(to);
      if (!activeRef.current || explodingRef.current) return;
      startMorph();
    }, restMsRef.current);
  }, [startMorph]);
  startRestRef.current = startRest;

  React.useEffect(() => {
    if (active && !exploding) {
      startRestRef.current();
      return () => {
        stopRest();
        stopKapow();
        kapowProgressRef.current = 1;
        setKapowActive(false, null);
      };
    }
    stopRest();
    stopKapow();
    kapowProgressRef.current = 1;
    if (!exploding && !morphingRef.current) setKapowActive(false, null);
  }, [active, exploding]);

  React.useEffect(() => {
    const node = kapowPathRef.current;
    if (!node) return;
    node.classList.toggle("logo-kapow-path--explode", exploding);
    if (!exploding) return;
    setKapowActive(true, 0);
    if (!morphingRef.current) startMorph();
  }, [exploding, startMorph]);

  React.useEffect(
    () => () => {
      stopFont();
      stopKapow();
      stopRest();
    },
    [],
  );

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
