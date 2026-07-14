"use client";

import * as React from "react";
import { MORPH_POINT_COUNT, MORPH_VARIANTS } from "./variants/morphData.js";
import {
  interpolatePoints,
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
const PATHS_STORAGE_KEY = "chasecee:logo-paths";

export type MorphStep = {
  id: number;
  fromIndex: number;
  toIndex: number;
  durationMs: number;
};

interface ChaseCeeLogoProps extends React.SVGProps<SVGSVGElement> {
  initialIndex: number;
  currentIndex: number;
  activeStep: MorphStep | null;
  activePhase: number | null;
  isExploding: boolean;
  restDurationMs: number;
  kapowRestEpoch: number;
  easeBezier?: EaseBezier;
  kapowStartOffsetMs?: number;
  onStepEnd: (step: MorphStep) => void;
  mirrorPathRefs?: Array<React.RefObject<(SVGPathElement | null)[]>>;
  pathClassName?: string;
}

const persistVariant = (index: number) => {
  const variant = MORPH_VARIANTS[index];
  localStorage.setItem(STORAGE_KEY, variant.id);
  localStorage.setItem(PATHS_STORAGE_KEY, JSON.stringify(variant.paths));
};

export default function ChaseCeeLogo({
  initialIndex,
  currentIndex,
  activeStep,
  activePhase,
  isExploding,
  restDurationMs,
  kapowRestEpoch,
  easeBezier = DEFAULT_MORPH_BEZIER,
  kapowStartOffsetMs = 0,
  onStepEnd,
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
  const stepRef = React.useRef<MorphStep | null>(null);
  const kapowIndexRef = React.useRef(0);
  const easeBezierRef = React.useRef(easeBezier);
  const kapowStartOffsetRef = React.useRef(kapowStartOffsetMs);
  const restDurationRef = React.useRef(restDurationMs);
  const onStepEndRef = React.useRef(onStepEnd);
  easeBezierRef.current = easeBezier;
  kapowStartOffsetRef.current = kapowStartOffsetMs;
  restDurationRef.current = restDurationMs;
  onStepEndRef.current = onStepEnd;

  const setPathValue = React.useCallback(
    (index: number, pathValue: string) => {
      underlayPathRefs.current[index]?.setAttribute("d", pathValue);
      pathRefs.current[index]?.setAttribute("d", pathValue);
      mirrorPathRefs?.forEach((groupRef) => {
        groupRef.current[index]?.setAttribute("d", pathValue);
      });
    },
    [mirrorPathRefs],
  );

  const stopFont = React.useCallback(() => {
    if (!fontFrameRef.current) return;
    window.cancelAnimationFrame(fontFrameRef.current);
    fontFrameRef.current = 0;
  }, []);

  const stopKapow = React.useCallback(() => {
    if (!kapowFrameRef.current) return;
    window.cancelAnimationFrame(kapowFrameRef.current);
    kapowFrameRef.current = 0;
  }, []);

  const setKapowPath = React.useCallback((index: number) => {
    kapowPathRef.current?.setAttribute(
      "d",
      pointsToKapowPath(KAPOW_VARIANT_POINTS[index], KAPOW_POINT_COUNT, 0),
    );
  }, []);

  React.useEffect(() => {
    if (activeStep) return;
    const variant = MORPH_VARIANTS[currentIndex];
    variant.paths.forEach((pathValue, index) => {
      setPathValue(index, pathValue);
    });
  }, [activeStep, currentIndex, setPathValue]);

  React.useEffect(() => {
    stopFont();
    if (!activeStep) return;
    stepRef.current = activeStep;
    const from = MORPH_VARIANTS[activeStep.fromIndex];
    const to = MORPH_VARIANTS[activeStep.toIndex];
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const raw = Math.min(elapsed / activeStep.durationMs, 1);
      const progress = sampleCubicBezier(raw, easeBezierRef.current);
      from.glyphs.forEach((points, index) => {
        const d = pointsToQuadraticPath(
          interpolatePoints(points, to.glyphs[index], progress),
          MORPH_POINT_COUNT,
        );
        setPathValue(index, d);
      });
      if (raw >= 1) {
        to.paths.forEach((pathValue, index) => {
          setPathValue(index, pathValue);
        });
        persistVariant(activeStep.toIndex);
        stepRef.current = null;
        fontFrameRef.current = 0;
        onStepEndRef.current(activeStep);
        return;
      }
      fontFrameRef.current = window.requestAnimationFrame(tick);
    };

    fontFrameRef.current = window.requestAnimationFrame(tick);
    return stopFont;
  }, [activeStep, setPathValue, stopFont]);

  React.useEffect(() => {
    if (kapowRestEpoch === 0) return;

    stopKapow();
    const kapowCount = KAPOW_VARIANT_POINTS.length;
    const fromKapow = kapowIndexRef.current % kapowCount;
    const toKapow = (fromKapow + 1) % kapowCount;
    const startedAt = performance.now();
    let completed = false;

    const tick = (now: number) => {
      const restMs = restDurationRef.current;
      const elapsed = now - startedAt;
      const offset = Math.min(
        Math.max(kapowStartOffsetRef.current, 0),
        Math.max(restMs - 1, 0),
      );
      const morphMs = Math.max(restMs - offset, 1);
      const raw = Math.min(Math.max(elapsed - offset, 0) / morphMs, 1);
      const progress = Math.min(sampleCubicBezier(raw, easeBezierRef.current), 1);
      kapowPathRef.current?.setAttribute(
        "d",
        pointsToKapowPath(
          interpolatePoints(
            KAPOW_VARIANT_POINTS[fromKapow],
            KAPOW_VARIANT_POINTS[toKapow],
            progress,
          ),
          KAPOW_POINT_COUNT,
          0,
        ),
      );
      if (elapsed - offset >= morphMs) {
        completed = true;
        kapowIndexRef.current = toKapow;
        setKapowPath(toKapow);
        kapowFrameRef.current = 0;
        return;
      }
      kapowFrameRef.current = window.requestAnimationFrame(tick);
    };

    kapowFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      stopKapow();
      if (!completed) {
        setKapowPath(fromKapow);
      }
    };
  }, [kapowRestEpoch, setKapowPath, stopKapow]);

  React.useEffect(
    () => () => {
      stopFont();
      stopKapow();
    },
    [stopFont, stopKapow],
  );

  const phaseIndex =
    activePhase !== null
      ? activePhase
      : activeStep
        ? activeStep.fromIndex % 4
        : isExploding
          ? 0
          : null;

  const kapowClassName = [
    "logo-kapow-path",
    phaseIndex !== null || isExploding || activeStep ? "logo-kapow-path--active" : "",
    phaseIndex !== null ? `logo-kapow-path--phase-${phaseIndex}` : "",
    isExploding ? "logo-kapow-path--explode" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
          className={kapowClassName}
        />
      </g>
      {MORPH_VARIANTS[initialIndex].paths.map((pathValue, index) => (
        <path
          key={`underlay-${index}`}
          ref={(node) => {
            underlayPathRefs.current[index] = node;
          }}
          d={pathValue}
          suppressHydrationWarning
          data-chasecee-logo-path-index={index}
          className="logo-wordmark-underlay-path"
        />
      ))}
      {MORPH_VARIANTS[initialIndex].paths.map((pathValue, index) => (
        <path
          key={index}
          ref={(node) => {
            pathRefs.current[index] = node;
          }}
          d={pathValue}
          suppressHydrationWarning
          fillRule="evenodd"
          data-chasecee-logo-path-index={index}
          className={["logo-wordmark-path", pathClassName].filter(Boolean).join(" ")}
        />
      ))}
    </svg>
  );
}
