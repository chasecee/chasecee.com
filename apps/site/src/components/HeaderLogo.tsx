"use client";

import { navigate } from "astro:transitions/client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import ChaseCeeLogo, { type MorphStep } from "./logo/ChaseCeeLogo";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./logo/silhouette";
import { MORPH_VARIANTS } from "./logo/variants/morphData.js";

const parseCssDurationMs = (raw: string) => {
  const value = raw.trim();
  if (!value) return null;
  if (value.endsWith("ms")) return Number.parseFloat(value);
  if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
  return null;
};

const STORAGE_KEY = "chasecee:logo-font";
const KAPOW_EXPLODE_DURATION_MS = 440;
const FONT_CYCLE = [0, 5, 2, 3, 4] as const;

type StrokeBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const isHomePath = () => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/";
};

const readStoredIndex = () => {
  if (typeof window === "undefined") return 0;
  const storedId = localStorage.getItem(STORAGE_KEY);
  const storedIndex = MORPH_VARIANTS.findIndex((variant) => variant.id === storedId);
  if (storedIndex === -1) return FONT_CYCLE[0];
  if (storedIndex === 1) return FONT_CYCLE[1];
  if (!FONT_CYCLE.includes(storedIndex as (typeof FONT_CYCLE)[number])) return FONT_CYCLE[0];
  return storedIndex;
};

export default function HeaderLogo() {
  const stepCounterRef = useRef(0);
  const restTimerRef = useRef<number | null>(null);
  const explodeTimerRef = useRef<number | null>(null);
  const hoverRef = useRef(false);
  const pendingNavigateRef = useRef(false);
  const morphDoneRef = useRef(true);
  const explodeDoneRef = useRef(true);
  const currentIndexRef = useRef(readStoredIndex());
  const borderPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const borderInnerPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const mirrorPathRefs = useMemo(() => [borderPathRefs, borderInnerPathRefs], []);
  const kapowContainerRef = useRef<HTMLDivElement | null>(null);
  const [strokeBox, setStrokeBox] = useState<StrokeBox | null>(null);
  const [borderRoot, setBorderRoot] = useState<HTMLElement | null>(null);
  const [borderInnerRoot, setBorderInnerRoot] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [initialIndex, setInitialIndex] = useState(readStoredIndex);
  const [currentIndex, setCurrentIndex] = useState(readStoredIndex);
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<MorphStep | null>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [restDurationMs, setRestDurationMs] = useState(720);
  const [morphDurationMs, setMorphDurationMs] = useState(140);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [kapowRestEpoch, setKapowRestEpoch] = useState(0);
  const currentFontId = MORPH_VARIANTS[currentIndex]?.id ?? MORPH_VARIANTS[0].id;

  const maybeNavigate = useCallback(() => {
    if (!pendingNavigateRef.current) return;
    if (!morphDoneRef.current || !explodeDoneRef.current) return;
    pendingNavigateRef.current = false;
    if (isHomePath()) return;
    navigate("/");
  }, []);

  const stopRest = useCallback(() => {
    if (!restTimerRef.current) return;
    window.clearTimeout(restTimerRef.current);
    restTimerRef.current = null;
  }, []);

  const startExplosion = useCallback(() => {
    if (explodeTimerRef.current) {
      window.clearTimeout(explodeTimerRef.current);
      explodeTimerRef.current = null;
    }
    explodeDoneRef.current = false;
    setIsExploding(true);
    explodeTimerRef.current = window.setTimeout(() => {
      explodeTimerRef.current = null;
      setIsExploding(false);
      explodeDoneRef.current = true;
      maybeNavigate();
    }, KAPOW_EXPLODE_DURATION_MS);
  }, [maybeNavigate]);

  const startStep = useCallback(() => {
    if (activeStep || prefersReducedMotion) return;
    const fromIndex = currentIndexRef.current;
    const cycleIndex = FONT_CYCLE.indexOf(fromIndex as (typeof FONT_CYCLE)[number]);
    const toIndex =
      cycleIndex === -1 ? FONT_CYCLE[0] : FONT_CYCLE[(cycleIndex + 1) % FONT_CYCLE.length];
    morphDoneRef.current = false;
    setActivePhase(null);
    const step: MorphStep = {
      id: ++stepCounterRef.current,
      fromIndex,
      toIndex,
      durationMs: morphDurationMs,
    };
    setActiveStep(step);
  }, [activeStep, morphDurationMs, prefersReducedMotion]);

  const startRest = useCallback(() => {
    if (activeStep || prefersReducedMotion || pendingNavigateRef.current) return;
    stopRest();
    setActivePhase(currentIndexRef.current % 4);
    setKapowRestEpoch((epoch) => epoch + 1);
    restTimerRef.current = window.setTimeout(() => {
      restTimerRef.current = null;
      if (!hoverRef.current || pendingNavigateRef.current) return;
      startStep();
    }, restDurationMs);
  }, [activeStep, prefersReducedMotion, restDurationMs, startStep, stopRest]);

  useEffect(() => {
    const onSwap = () => {
      setBorderRoot(document.getElementById("logo-border-root"));
      setBorderInnerRoot(document.getElementById("logo-border-inner-root"));
      hoverRef.current = false;
      setIsHovered(false);
      setActivePhase(null);
      stopRest();
    };
    onSwap();
    document.addEventListener("astro:after-swap", onSwap);
    return () => document.removeEventListener("astro:after-swap", onSwap);
  }, [stopRest]);

  useLayoutEffect(() => {
    const paths = MORPH_VARIANTS[currentIndexRef.current]?.paths;
    if (!paths) return;
    paths.forEach((pathValue, index) => {
      borderPathRefs.current[index]?.setAttribute("d", pathValue);
      borderInnerPathRefs.current[index]?.setAttribute("d", pathValue);
    });
  }, [borderRoot, borderInnerRoot, strokeBox]);

  useLayoutEffect(() => {
    const kapow = kapowContainerRef.current;
    if (!kapow) return;

    const measure = () => {
      const header = document.querySelector<HTMLElement>("header.header");
      if (!header) return;
      const headerRect = header.getBoundingClientRect();
      const kapowRect = kapow.getBoundingClientRect();
      setStrokeBox({
        left: kapowRect.left - headerRect.left,
        top: kapowRect.top - headerRect.top,
        width: kapowRect.width,
        height: kapowRect.height,
      });
    };

    const observer = new ResizeObserver(measure);
    const bind = () => {
      observer.disconnect();
      const header = document.querySelector<HTMLElement>("header.header");
      if (header) observer.observe(header);
      observer.observe(kapow);
      measure();
    };

    bind();
    window.addEventListener("resize", measure);
    document.addEventListener("astro:after-swap", bind);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("astro:after-swap", bind);
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const styles = getComputedStyle(document.documentElement);
    setRestDurationMs(parseCssDurationMs(styles.getPropertyValue("--logo-rest-duration")) ?? 720);
    setMorphDurationMs(
      parseCssDurationMs(styles.getPropertyValue("--logo-morph-duration")) ?? 140,
    );

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => setPrefersReducedMotion(media.matches);
    applyMotionPref();
    media.addEventListener("change", applyMotionPref);

    return () => {
      media.removeEventListener("change", applyMotionPref);
      stopRest();
      if (explodeTimerRef.current) {
        window.clearTimeout(explodeTimerRef.current);
        explodeTimerRef.current = null;
      }
    };
  }, [stopRest]);

  useEffect(() => {
    hoverRef.current = isHovered;
    if (!isHovered) {
      stopRest();
      setActivePhase(null);
      return;
    }
    if (pendingNavigateRef.current) return;
    if (!activeStep && !restTimerRef.current && !prefersReducedMotion) {
      startRest();
    }
  }, [isHovered, activeStep, prefersReducedMotion, startRest, stopRest]);

  const handleStepEnd = useCallback(
    (step: MorphStep) => {
      setCurrentIndex(step.toIndex);
      setInitialIndex(step.toIndex);
      currentIndexRef.current = step.toIndex;
      setActiveStep((current) => (current?.id === step.id ? null : current));
      setActivePhase(null);
      morphDoneRef.current = true;
      if (pendingNavigateRef.current) {
        maybeNavigate();
        return;
      }
      if (hoverRef.current && !prefersReducedMotion) {
        startRest();
      }
    },
    [maybeNavigate, prefersReducedMotion, startRest],
  );

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (prefersReducedMotion) return;
    event.preventDefault();
    setIsHovered(false);
    hoverRef.current = false;
    stopRest();
    setActivePhase(null);
    pendingNavigateRef.current = !isHomePath();
    startExplosion();
    if (!activeStep) {
      startStep();
    }
  };

  const strokeLayer = (content: ReactNode) =>
    strokeBox ? (
      <div
        className="pointer-events-none absolute"
        style={{
          left: strokeBox.left,
          top: strokeBox.top,
          width: strokeBox.width,
          height: strokeBox.height,
        }}
      >
        <div className="logo-wordmark absolute top-0 left-0 w-full origin-center [transform:translateY(0%)_skew(-3.5deg,-4deg)]">
          {content}
        </div>
      </div>
    ) : null;

  const renderStrokePaths = (
    refGroup: React.MutableRefObject<(SVGPathElement | null)[]>,
    className: string,
  ) =>
    MORPH_VARIANTS[initialIndex].paths.map((pathValue, index) => (
      <path
        key={`${className}-${index}`}
        ref={(node) => {
          refGroup.current[index] = node;
        }}
        d={pathValue}
        fillRule="evenodd"
        suppressHydrationWarning
        data-chasecee-logo-path-index={index}
        className={className}
      />
    ));

  const borderLayer = strokeLayer(
    <svg
      aria-hidden
      className="logo-stroke-overlay pointer-events-none overflow-visible"
      width={LOGO_VIEW_WIDTH}
      height={LOGO_VIEW_HEIGHT}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      fill="none"
      overflow="visible"
    >
      {renderStrokePaths(borderPathRefs, "logo-border-path")}
    </svg>,
  );

  const borderInnerLayer = strokeLayer(
    <svg
      aria-hidden
      className="logo-stroke-overlay pointer-events-none overflow-visible"
      width={LOGO_VIEW_WIDTH}
      height={LOGO_VIEW_HEIGHT}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      fill="none"
      overflow="visible"
    >
      {renderStrokePaths(borderInnerPathRefs, "logo-border-inner-path")}
    </svg>,
  );

  const borderPortal = borderLayer && borderRoot ? createPortal(borderLayer, borderRoot) : null;
  const borderInnerPortal =
    borderInnerLayer && borderInnerRoot ? createPortal(borderInnerLayer, borderInnerRoot) : null;

  return (
    <>
      {borderPortal}
      {borderInnerPortal}
      <a
        onClick={handleLogoClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="header__title group relative flex flex-row items-center gap-2"
        href="/"
      >
        <div className="sr-only">Chase Cee Logo</div>
        <div
          ref={kapowContainerRef}
          className="logo-kapow-container relative min-h-[var(--site-header-height)] w-[12rem] md:w-[15rem] overflow-visible before:absolute before:-inset-x-[18px] before:-inset-y-[15px] before:content-['']"
        >
          <div className="logo-wordmark-core relative z-5 h-full w-full overflow-visible">
            <div className="logo-wordmark absolute top-0 left-0 w-full origin-center [transform:translateY(0%)_skew(-3.5deg,-4deg)]">
              <ChaseCeeLogo
                initialIndex={initialIndex}
                currentIndex={currentIndex}
                activeStep={activeStep}
                activePhase={activePhase}
                isExploding={isExploding}
                restDurationMs={restDurationMs}
                kapowRestEpoch={kapowRestEpoch}
                onStepEnd={handleStepEnd}
                mirrorPathRefs={mirrorPathRefs}
              />
            </div>
          </div>
          {import.meta.env.DEV && (
            <span className="pointer-events-none absolute top-1/2 left-full z-20 ml-2 -translate-y-1/2 rounded border border-neutral-500/60 bg-neutral-50/90 px-2 py-1 font-mono text-[10px] leading-none text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900/90 dark:text-neutral-200">
              {currentFontId}
            </span>
          )}
        </div>
      </a>
    </>
  );
}
