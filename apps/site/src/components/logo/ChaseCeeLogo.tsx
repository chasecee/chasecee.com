"use client";

import * as React from "react";
import { MORPH_POINT_COUNT, MORPH_VARIANTS } from "./variants/morphData.js";
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
  activeStep: MorphStep | null;
  onStepEnd: (step: MorphStep) => void;
}

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
  activeStep,
  onStepEnd,
  className,
  ...props
}: ChaseCeeLogoProps) {
  const pathRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const frameRef = React.useRef(0);
  const stepRef = React.useRef<MorphStep | null>(null);
  const onStepEndRef = React.useRef(onStepEnd);
  onStepEndRef.current = onStepEnd;

  const stop = React.useCallback(() => {
    if (!frameRef.current) return;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }, []);

  React.useEffect(() => {
    stop();
    const variant = MORPH_VARIANTS[initialIndex];
    variant.paths.forEach((pathValue, index) => {
      pathRefs.current[index]?.setAttribute("d", pathValue);
    });
  }, [initialIndex, stop]);

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
      from.glyphs.forEach((points, index) => {
        const d = toPath(interpolate(points, to.glyphs[index], progress));
        pathRefs.current[index]?.setAttribute("d", d);
      });
      if (raw >= 1) {
        to.paths.forEach((pathValue, index) => {
          pathRefs.current[index]?.setAttribute("d", pathValue);
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
  }, [activeStep, stop]);

  React.useEffect(() => stop, [stop]);

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
      {MORPH_VARIANTS[initialIndex].paths.map((pathValue, index) => (
        <path
          key={index}
          ref={(node) => {
            pathRefs.current[index] = node;
          }}
          d={pathValue}
          suppressHydrationWarning
          fillRule="evenodd"
          className="logo-wordmark-path"
        />
      ))}
    </svg>
  );
}
