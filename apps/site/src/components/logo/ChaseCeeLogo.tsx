"use client";

import * as React from "react";
import { MORPH_POINT_COUNT, MORPH_VARIANTS } from "./variants/morphData.js";
import {
  interpolatePoints,
  KAPOW_POINT_COUNT,
  KAPOW_VARIANT_PATHS,
  KAPOW_VARIANT_POINTS,
  pointsToQuadraticPath,
} from "./kapowMorph";
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
  onStepEnd: (step: MorphStep) => void;
  mirrorPathRefs?: Array<React.RefObject<(SVGPathElement | null)[]>>;
  pathClassName?: string;
}

const ease = (progress: number) => {
  const overshoot = 0.38;
  return (
    1 +
    (overshoot + 1) * Math.pow(progress - 1, 3) +
    overshoot * Math.pow(progress - 1, 2)
  );
};

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
  onStepEnd,
  mirrorPathRefs,
  pathClassName,
  className,
  ...props
}: ChaseCeeLogoProps) {
  const kapowPathRef = React.useRef<SVGPathElement | null>(null);
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const frameRef = React.useRef(0);
  const stepRef = React.useRef<MorphStep | null>(null);
  const onStepEndRef = React.useRef(onStepEnd);
  onStepEndRef.current = onStepEnd;

  const setPathValue = React.useCallback(
    (index: number, pathValue: string) => {
      pathRefs.current[index]?.setAttribute("d", pathValue);
      mirrorPathRefs?.forEach((groupRef) => {
        groupRef.current[index]?.setAttribute("d", pathValue);
      });
    },
    [mirrorPathRefs],
  );

  const stop = React.useCallback(() => {
    if (!frameRef.current) return;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }, []);

  React.useEffect(() => {
    stop();
    const variant = MORPH_VARIANTS[initialIndex];
    kapowPathRef.current?.setAttribute("d", KAPOW_VARIANT_PATHS[initialIndex]);
    variant.paths.forEach((pathValue, index) => {
      setPathValue(index, pathValue);
    });
  }, [initialIndex, setPathValue, stop]);

  React.useEffect(() => {
    stop();
    if (!activeStep) return;
    stepRef.current = activeStep;
    const from = MORPH_VARIANTS[activeStep.fromIndex];
    const to = MORPH_VARIANTS[activeStep.toIndex];
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const raw = Math.min(elapsed / activeStep.durationMs, 1);
      const progress = ease(raw);
      const kapowPoints = interpolatePoints(
        KAPOW_VARIANT_POINTS[activeStep.fromIndex],
        KAPOW_VARIANT_POINTS[activeStep.toIndex],
        progress,
      );
      kapowPathRef.current?.setAttribute(
        "d",
        pointsToQuadraticPath(kapowPoints, KAPOW_POINT_COUNT),
      );
      from.glyphs.forEach((points, index) => {
        const d = pointsToQuadraticPath(
          interpolatePoints(points, to.glyphs[index], progress),
          MORPH_POINT_COUNT,
        );
        setPathValue(index, d);
      });
      if (raw >= 1) {
        kapowPathRef.current?.setAttribute("d", KAPOW_VARIANT_PATHS[activeStep.toIndex]);
        to.paths.forEach((pathValue, index) => {
          setPathValue(index, pathValue);
        });
        persistVariant(activeStep.toIndex);
        stepRef.current = null;
        frameRef.current = 0;
        onStepEndRef.current(activeStep);
        return;
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return stop;
  }, [activeStep, setPathValue, stop]);

  React.useEffect(() => stop, [stop]);

  const kapowClassName = [
    "logo-kapow-path",
    activePhase !== null || isExploding ? "logo-kapow-path--active" : "",
    activePhase !== null ? `logo-kapow-path--phase-${activePhase}` : "",
    isExploding ? "logo-kapow-path--phase-0 logo-kapow-path--explode" : "",
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
      <path
        ref={kapowPathRef}
        d={KAPOW_VARIANT_PATHS[currentIndex]}
        suppressHydrationWarning
        className={kapowClassName}
      />
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
