import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { EaseBezier } from "./morphEase";

const PAD = 96;
const PAD_Y_MIN = -0.35;
const PAD_Y_MAX = 1.85;
const HANDLE = 9;

type LogoMorphDevControlsProps = {
  bezier: EaseBezier;
  kapowStartOffsetMs: number;
  restDurationMs: number;
  forceHover: boolean;
  onBezierChange: (bezier: EaseBezier) => void;
  onKapowStartOffsetChange: (ms: number) => void;
  onForceHoverChange: (value: boolean) => void;
};

const toPad = (x: number, y: number) => ({
  cx: x * PAD,
  cy: ((PAD_Y_MAX - y) / (PAD_Y_MAX - PAD_Y_MIN)) * PAD,
});

const fromPad = (cx: number, cy: number) => {
  const x = Math.min(1, Math.max(0, cx / PAD));
  const y = PAD_Y_MAX - (cy / PAD) * (PAD_Y_MAX - PAD_Y_MIN);
  return [x, y] as const;
};

const curvePath = (bezier: EaseBezier) => {
  const steps = 24;
  let d = `M0 ${toPad(0, 0).cy}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x =
      3 * bezier[0] * (t - 2 * t * t + t * t * t) +
      3 * bezier[2] * (t * t - t * t * t) +
      t * t * t;
    const y =
      3 * bezier[1] * (t - 2 * t * t + t * t * t) +
      3 * bezier[3] * (t * t - t * t * t) +
      t * t * t;
    const point = toPad(x, y);
    d += `L${point.cx.toFixed(1)} ${point.cy.toFixed(1)}`;
  }
  return d;
};

export default function LogoMorphDevControls({
  bezier,
  kapowStartOffsetMs,
  restDurationMs,
  forceHover,
  onBezierChange,
  onKapowStartOffsetChange,
  onForceHoverChange,
}: LogoMorphDevControlsProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<0 | 1 | null>(null);
  const bezierRef = useRef(bezier);
  bezierRef.current = bezier;

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (dragRef.current === null || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const [x, y] = fromPad(event.clientX - rect.left, event.clientY - rect.top);
      const next = [...bezierRef.current] as EaseBezier;
      if (dragRef.current === 0) {
        next[0] = x;
        next[1] = y;
      } else {
        next[2] = x;
        next[3] = y;
      }
      onBezierChange(next);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onBezierChange]);

  const startDrag =
    (handle: 0 | 1) => (event: ReactPointerEvent<SVGCircleElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = handle;
    };

  const p0 = toPad(0, 0);
  const p1 = toPad(bezier[0], bezier[1]);
  const p2 = toPad(bezier[2], bezier[3]);
  const p3 = toPad(1, 1);
  const maxOffset = Math.max(restDurationMs - 40, 0);

  return (
    <div
      className="absolute top-full left-0 z-50 mt-2 flex gap-3 rounded border border-neutral-500/50 bg-neutral-50/95 p-2 font-mono text-[10px] text-neutral-700 shadow-sm backdrop-blur-sm dark:border-neutral-600 dark:bg-neutral-900/95 dark:text-neutral-200"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col gap-1">
        <span>ease</span>
        <svg
          ref={svgRef}
          width={PAD}
          height={PAD}
          viewBox={`0 0 ${PAD} ${PAD}`}
          className="touch-none rounded bg-neutral-200/80 dark:bg-neutral-800"
        >
          <line
            x1={p0.cx}
            y1={toPad(0, 1).cy}
            x2={p3.cx}
            y2={toPad(1, 0).cy}
            className="stroke-neutral-400/40"
            strokeWidth={1}
          />
          <line
            x1={p0.cx}
            y1={p0.cy}
            x2={p1.cx}
            y2={p1.cy}
            className="stroke-neutral-400"
            strokeWidth={1}
          />
          <line
            x1={p3.cx}
            y1={p3.cy}
            x2={p2.cx}
            y2={p2.cy}
            className="stroke-neutral-400"
            strokeWidth={1}
          />
          <path
            d={curvePath(bezier)}
            fill="none"
            className="stroke-current"
            strokeWidth={1.5}
          />
          <circle cx={p0.cx} cy={p0.cy} r={3} className="fill-current" />
          <circle cx={p3.cx} cy={p3.cy} r={3} className="fill-current" />
          <circle
            cx={p1.cx}
            cy={p1.cy}
            r={HANDLE / 2}
            className="fill-sky-500 stroke-white"
            strokeWidth={1}
            onPointerDown={startDrag(0)}
          />
          <circle
            cx={p2.cx}
            cy={p2.cy}
            r={HANDLE / 2}
            className="fill-amber-500 stroke-white"
            strokeWidth={1}
            onPointerDown={startDrag(1)}
          />
        </svg>
        <span>{bezier.map((value) => value.toFixed(2)).join(", ")}</span>
      </div>
      <div className="flex w-28 flex-col gap-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={forceHover}
            onChange={(event) => onForceHoverChange(event.target.checked)}
          />
          <span>hover</span>
        </label>
        <label className="flex flex-col gap-1">
          <span>kapow delay</span>
          <input
            type="range"
            min={0}
            max={maxOffset}
            step={10}
            value={Math.min(kapowStartOffsetMs, maxOffset)}
            onChange={(event) =>
              onKapowStartOffsetChange(Number(event.target.value))
            }
            className="w-full"
          />
          <span>{kapowStartOffsetMs}ms</span>
        </label>
      </div>
    </div>
  );
}
