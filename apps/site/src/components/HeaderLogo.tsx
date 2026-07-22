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
import ChaseCeeLogo, { FONT_CYCLE } from "./logo/ChaseCeeLogo";
import { LOGO_VIEW_HEIGHT, LOGO_VIEW_WIDTH } from "./logo/silhouette";
import {
  MORPH_PATHS,
  MORPH_VARIANT_IDS,
} from "./logo/variants/morphMeta.js";
import "./logo/logo.css";

const parseCssDurationMs = (raw: string) => {
  const value = raw.trim();
  if (!value) return null;
  if (value.endsWith("ms")) return Number.parseFloat(value);
  if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
  return null;
};

const STORAGE_KEY = "chasecee:logo-font";
const KAPOW_EXPLODE_DURATION_MS = 440;

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
  if (typeof window === "undefined") return FONT_CYCLE[0];
  const storedId = localStorage.getItem(STORAGE_KEY);
  const storedIndex = storedId ? MORPH_VARIANT_IDS.indexOf(storedId) : -1;
  if (storedIndex === -1) return FONT_CYCLE[0];
  if (!FONT_CYCLE.includes(storedIndex as (typeof FONT_CYCLE)[number])) return FONT_CYCLE[0];
  return storedIndex;
};

export default function HeaderLogo() {
  const explodeTimerRef = useRef<number | null>(null);
  const pendingNavigateRef = useRef(false);
  const morphDoneRef = useRef(true);
  const borderPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const borderInnerPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const mirrorPathRefs = useMemo(() => [borderPathRefs, borderInnerPathRefs], []);
  const kapowContainerRef = useRef<HTMLDivElement | null>(null);
  const [strokeBox, setStrokeBox] = useState<StrokeBox | null>(null);
  const [borderRoot, setBorderRoot] = useState<HTMLElement | null>(null);
  const [borderInnerRoot, setBorderInnerRoot] = useState<HTMLElement | null>(null);
  const [paintIndex, setPaintIndex] = useState<number>(FONT_CYCLE[0]);
  const [currentIndex, setCurrentIndex] = useState<number>(paintIndex);
  const [isExploding, setIsExploding] = useState(false);
  const [morphNonce, setMorphNonce] = useState(0);
  const [morphDurationMs, setMorphDurationMs] = useState(140);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const currentFontId = MORPH_VARIANT_IDS[currentIndex] ?? MORPH_VARIANT_IDS[0];

  const maybeNavigate = useCallback(() => {
    if (!pendingNavigateRef.current) return;
    if (!morphDoneRef.current) return;
    pendingNavigateRef.current = false;
    if (isHomePath()) return;
    navigate("/");
  }, []);

  const handleIndexChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      morphDoneRef.current = true;
      maybeNavigate();
    },
    [maybeNavigate],
  );

  useEffect(() => {
    const onSwap = () => {
      setBorderRoot(document.getElementById("logo-border-root"));
      setBorderInnerRoot(document.getElementById("logo-border-inner-root"));
      setIsExploding(false);
    };
    onSwap();
    document.addEventListener("astro:after-swap", onSwap);
    return () => document.removeEventListener("astro:after-swap", onSwap);
  }, []);

  useLayoutEffect(() => {
    const paths = MORPH_PATHS[currentIndex];
    if (!paths) return;
    paths.forEach((pathValue, index) => {
      borderPathRefs.current[index]?.setAttribute("d", pathValue);
      borderInnerPathRefs.current[index]?.setAttribute("d", pathValue);
    });
  }, [borderRoot, borderInnerRoot, strokeBox, currentIndex]);

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
    setIsMounted(true);
    const storedIndex = readStoredIndex();
    setPaintIndex(storedIndex);
    setCurrentIndex(storedIndex);

    const styles = getComputedStyle(document.documentElement);
    setMorphDurationMs(
      parseCssDurationMs(styles.getPropertyValue("--logo-morph-duration")) ?? 140,
    );

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => setPrefersReducedMotion(media.matches);
    applyMotionPref();
    media.addEventListener("change", applyMotionPref);
    return () => {
      media.removeEventListener("change", applyMotionPref);
      if (explodeTimerRef.current) {
        window.clearTimeout(explodeTimerRef.current);
        explodeTimerRef.current = null;
      }
    };
  }, []);

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (prefersReducedMotion) return;
    event.preventDefault();
    pendingNavigateRef.current = !isHomePath();
    morphDoneRef.current = false;
    setMorphNonce((n) => n + 1);
    setIsExploding(true);
    if (explodeTimerRef.current) window.clearTimeout(explodeTimerRef.current);
    explodeTimerRef.current = window.setTimeout(() => {
      explodeTimerRef.current = null;
      setIsExploding(false);
    }, KAPOW_EXPLODE_DURATION_MS);
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
    refGroup: React.RefObject<(SVGPathElement | null)[]>,
    className: string,
  ) =>
    Array.from({ length: MORPH_PATHS[paintIndex].length }, (_, index) => (
      <path
        key={`${className}-${index}`}
        ref={(node) => {
          refGroup.current[index] = node;
        }}
        fillRule="evenodd"
        suppressHydrationWarning
        className={className}
      />
    ));

  const borderPortal =
    strokeBox && borderRoot
      ? createPortal(
          strokeLayer(
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
          ),
          borderRoot,
        )
      : null;

  const borderInnerPortal =
    strokeBox && borderInnerRoot
      ? createPortal(
          strokeLayer(
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
          ),
          borderInnerRoot,
        )
      : null;

  return (
    <>
      {borderPortal}
      {borderInnerPortal}
      <div className="relative">
        <a
          onClick={handleLogoClick}
          className="header__title group relative -left-8 md:-left-0 flex flex-row items-center gap-2"
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
                  initialIndex={paintIndex}
                  exploding={isExploding}
                  morphNonce={morphNonce}
                  morphDurationMs={morphDurationMs}
                  onIndexChange={handleIndexChange}
                  mirrorPathRefs={mirrorPathRefs}
                />
              </div>
            </div>
            {import.meta.env.DEV && isMounted && (
              <span className="hidden md:block pointer-events-none absolute top-1/2 left-full z-20 ml-2 -translate-y-1/2 rounded border border-neutral-400 bg-neutral-50/90 px-2 py-1 font-mono text-[10px] leading-none text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-200">
                {currentFontId}
              </span>
            )}
          </div>
        </a>
      </div>
    </>
  );
}
