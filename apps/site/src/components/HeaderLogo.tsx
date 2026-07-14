"use client";

import { navigate } from "astro:transitions/client";
import {
  createPortal,
} from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ChaseCeeLogo, { type MorphStep } from "./logo/ChaseCeeLogo";
import LogoKapowBackground from "./logo/LogoKapowBackground";
import { MORPH_VARIANTS } from "./logo/variants/morphData.js";
import { STICKER_PATHS, STICKER_VARIANT_IDS } from "./logo/variants/stickerData";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./logo/silhouette";

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

type StickerBox = {
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
  const storedIndex = STICKER_VARIANT_IDS.findIndex((id) => id === storedId);
  if (storedIndex === -1) return FONT_CYCLE[0];
  if (storedIndex === 1) return FONT_CYCLE[1];
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
  const stickerStrokeRef = useRef<SVGPathElement | null>(null);
  const stickerFillRef = useRef<SVGPathElement | null>(null);
  const stickerStrokeAnimateRef = useRef<SVGAnimateElement | null>(null);
  const stickerFillAnimateRef = useRef<SVGAnimateElement | null>(null);
  const kapowContainerRef = useRef<HTMLDivElement | null>(null);
  const [stickerBox, setStickerBox] = useState<StickerBox | null>(null);
  const [stickerStrokeRoot, setStickerStrokeRoot] = useState<HTMLElement | null>(null);
  const [stickerFillRoot, setStickerFillRoot] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [initialIndex] = useState(readStoredIndex);
  const [currentIndex, setCurrentIndex] = useState(readStoredIndex);
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<MorphStep | null>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [restDurationMs, setRestDurationMs] = useState(720);
  const [morphDurationMs, setMorphDurationMs] = useState(140);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
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
      cycleIndex === -1
        ? FONT_CYCLE[0]
        : FONT_CYCLE[(cycleIndex + 1) % FONT_CYCLE.length];
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
    restTimerRef.current = window.setTimeout(() => {
      restTimerRef.current = null;
      if (!hoverRef.current || pendingNavigateRef.current) return;
      startStep();
    }, restDurationMs);
  }, [activeStep, prefersReducedMotion, restDurationMs, startStep, stopRest]);

  const applyStickerStep = useCallback((step: MorphStep) => {
    const from = STICKER_PATHS[step.fromIndex];
    const to = STICKER_PATHS[step.toIndex];
    const duration = `${step.durationMs}ms`;
    if (stickerStrokeRef.current) stickerStrokeRef.current.setAttribute("d", from);
    if (stickerFillRef.current) stickerFillRef.current.setAttribute("d", from);
    if (stickerStrokeAnimateRef.current) {
      stickerStrokeAnimateRef.current.setAttribute("dur", duration);
      stickerStrokeAnimateRef.current.setAttribute("from", from);
      stickerStrokeAnimateRef.current.setAttribute("to", to);
      stickerStrokeAnimateRef.current.beginElement();
    }
    if (stickerFillAnimateRef.current) {
      stickerFillAnimateRef.current.setAttribute("dur", duration);
      stickerFillAnimateRef.current.setAttribute("from", from);
      stickerFillAnimateRef.current.setAttribute("to", to);
      stickerFillAnimateRef.current.beginElement();
    }
  }, []);

  useEffect(() => {
    setStickerStrokeRoot(document.getElementById("logo-sticker-stroke-root"));
    setStickerFillRoot(document.getElementById("logo-sticker-fill-root"));
  }, []);

  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>("header.header");
    const kapow = kapowContainerRef.current;
    if (!header || !kapow) return;

    const sync = () => {
      const headerRect = header.getBoundingClientRect();
      const kapowRect = kapow.getBoundingClientRect();
      setStickerBox({
        left: kapowRect.left - headerRect.left,
        top: kapowRect.top - headerRect.top,
        width: kapowRect.width,
        height: kapowRect.height,
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    observer.observe(kapow);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const styles = getComputedStyle(document.documentElement);
    setRestDurationMs(
      parseCssDurationMs(styles.getPropertyValue("--logo-rest-duration")) ?? 720,
    );
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
  }, []);

  useEffect(() => {
    if (!activeStep) return;
    applyStickerStep(activeStep);
  }, [activeStep, applyStickerStep]);

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

  useEffect(() => {
    const path = STICKER_PATHS[currentIndex];
    if (stickerStrokeRef.current) stickerStrokeRef.current.setAttribute("d", path);
    if (stickerFillRef.current) stickerFillRef.current.setAttribute("d", path);
  }, [currentIndex]);

  const handleStepEnd = useCallback(
    (step: MorphStep) => {
      setCurrentIndex(step.toIndex);
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

  const stickerLayer = (content: ReactNode) =>
    stickerBox ? (
      <div
        className="pointer-events-none absolute"
        style={{
          left: stickerBox.left,
          top: stickerBox.top,
          width: stickerBox.width,
          height: stickerBox.height,
        }}
      >
        <div className="logo-wordmark absolute top-1/2 left-0 w-full origin-top-left [transform:translateY(-50%)_skew(-3.5deg,-4deg)]">
          {content}
        </div>
      </div>
    ) : null;

  const stickerStrokeLayer = stickerLayer(
    <svg
      aria-hidden
      className="logo-sticker-overlay pointer-events-none overflow-visible"
      width={LOGO_VIEW_WIDTH}
      height={LOGO_VIEW_HEIGHT}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      fill="none"
      overflow="visible"
    >
      <path
        ref={stickerStrokeRef}
        d={STICKER_PATHS[currentIndex]}
        className="fill-none stroke-neutral-500/50 dark:stroke-neutral-600"
        strokeWidth="calc(var(--site-border-width) * 2)"
        vectorEffect="non-scaling-stroke"
      >
        <animate
          ref={stickerStrokeAnimateRef}
          attributeName="d"
          begin="indefinite"
          dur="360ms"
          fill="freeze"
        />
      </path>
    </svg>,
  );

  const stickerFillLayer = stickerLayer(
    <svg
      aria-hidden
      className="logo-sticker-overlay pointer-events-none overflow-visible"
      width={LOGO_VIEW_WIDTH}
      height={LOGO_VIEW_HEIGHT}
      viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
      fill="none"
      overflow="visible"
    >
      <path
        ref={stickerFillRef}
        d={STICKER_PATHS[currentIndex]}
        className="fill-neutral-50 dark:fill-neutral-900"
      >
        <animate
          ref={stickerFillAnimateRef}
          attributeName="d"
          begin="indefinite"
          dur="360ms"
          fill="freeze"
        />
      </path>
    </svg>,
  );

  const stickerStrokePortal =
    stickerStrokeLayer && stickerStrokeRoot
      ? createPortal(stickerStrokeLayer, stickerStrokeRoot)
      : null;
  const stickerFillPortal =
    stickerFillLayer && stickerFillRoot
      ? createPortal(stickerFillLayer, stickerFillRoot)
      : null;

  return (
    <>
      {stickerStrokePortal}
      {stickerFillPortal}
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
          className="logo-kapow-container relative min-h-[var(--site-header-height)] w-[15rem] overflow-visible [--kapow-offset-x:0px] [--kapow-offset-y:2.5%] before:absolute before:-inset-x-[18px] before:-inset-y-[15px] before:content-['']"
        >
          <div className="logo-wordmark absolute top-1/2 left-0 w-full origin-top-left [transform:translateY(-50%)_skew(-3.5deg,-4deg)]">
            <div className="logo-wordmark-core relative z-5 w-full overflow-visible">
              <LogoKapowBackground activePhase={activePhase} isExploding={isExploding} />
              <ChaseCeeLogo
                initialIndex={initialIndex}
                activeStep={activeStep}
                onStepEnd={handleStepEnd}
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
