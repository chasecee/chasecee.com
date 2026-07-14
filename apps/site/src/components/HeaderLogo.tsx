"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ChaseCeeLogo, { type MorphFrame } from "./logo/ChaseCeeLogo";
import LogoKapowBackground from "./logo/LogoKapowBackground";
import { MORPH_VARIANTS as BASE_MORPH_VARIANTS } from "./logo/variants/morphData.js";
import {
  LOGO_VIEW_HEIGHT,
  LOGO_VIEW_WIDTH,
  alignStickerPoints,
  interpolateStickerPoints,
  logoStickerPoints,
  stickerOutlineFromPoints,
  type StickerPoint,
} from "./logo/silhouette";

type LogoOutline = {
  d: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

const parseCssDurationMs = (raw: string) => {
  const value = raw.trim();
  if (!value) return null;
  if (value.endsWith("ms")) return Number.parseFloat(value);
  if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
  return null;
};

export default function HeaderLogo() {
  const kapowFrameRef = useRef<number>(0);
  const explodeFrameRef = useRef<number>(0);
  const cycleStartRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [kapowIndex, setKapowIndex] = useState<number | null>(null);
  const [explodeProgress, setExplodeProgress] = useState(0);
  const [outline, setOutline] = useState<LogoOutline | null>(null);
  const KAPOW_EXPLODE_DURATION_MS = 440;
  const KAPOW_PHASES = 3;

  const stopKapowCycle = () => {
    if (kapowFrameRef.current) {
      window.cancelAnimationFrame(kapowFrameRef.current);
      kapowFrameRef.current = 0;
    }
  };

  const stopKapowExplode = () => {
    if (explodeFrameRef.current) {
      window.cancelAnimationFrame(explodeFrameRef.current);
      explodeFrameRef.current = 0;
    }
    setExplodeProgress(0);
  };

  const triggerKapowExplode = useCallback(() => {
    stopKapowExplode();
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / KAPOW_EXPLODE_DURATION_MS, 1);
      setExplodeProgress(progress);
      if (progress < 1) {
        explodeFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        explodeFrameRef.current = 0;
        setExplodeProgress(0);
      }
    };
    explodeFrameRef.current = window.requestAnimationFrame(tick);
  }, []);

  const startKapowCycle = useCallback(() => {
    stopKapowCycle();
    const cycleMs =
      parseCssDurationMs(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--logo-cycle-duration",
        ),
      ) ?? 1080;
    const stepMs = cycleMs / KAPOW_PHASES;
    cycleStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - cycleStartRef.current;
      const index = Math.floor(elapsed / stepMs) % KAPOW_PHASES;
      setKapowIndex((prev) => (prev === index ? prev : index));
      kapowFrameRef.current = window.requestAnimationFrame(tick);
    };
    kapowFrameRef.current = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!isHovered) {
      stopKapowCycle();
      setKapowIndex(null);
      return;
    }
    startKapowCycle();
    return stopKapowCycle;
  }, [isHovered, startKapowCycle]);

  useEffect(() => {
    return () => {
      stopKapowCycle();
      stopKapowExplode();
    };
  }, []);

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    setIsHovered(false);
    triggerKapowExplode();
  };

  const stickerCache = useRef<Array<StickerPoint[] | null>>([]);

  const buildStickerCache = useCallback(() => {
    if (typeof document === "undefined") return;
    if (stickerCache.current.length === BASE_MORPH_VARIANTS.length) return;
    const baked = BASE_MORPH_VARIANTS.map((variant) =>
      logoStickerPoints(variant.glyphs),
    );
    const reference = baked[0];
    stickerCache.current = baked.map((points) =>
      reference && points ? alignStickerPoints(reference, points) : points,
    );
  }, []);

  const handleMorphFrame = useCallback((frame: MorphFrame) => {
    buildStickerCache();
    const from = stickerCache.current[frame.fromBaseIndex];
    const to = stickerCache.current[frame.toBaseIndex];
    if (!from || !to) return;
    const points =
      frame.progress >= 1
        ? to
        : interpolateStickerPoints(from, to, frame.progress);
    setOutline(stickerOutlineFromPoints(points));
  }, [buildStickerCache]);

  useLayoutEffect(() => {
    buildStickerCache();
    const first = stickerCache.current[0];
    if (!first) return;
    setOutline(stickerOutlineFromPoints(first));
  }, [buildStickerCache]);

  return (
    <a
      onClick={handleLogoClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="header__title group relative flex flex-row items-center gap-2"
      href="/"
    >
      <div className="sr-only">Chase Cee Logo</div>
      <div className="logo-kapow-container relative h-[calc(var(--site-header-height)-1rem)] w-[15rem] [--kapow-offset-x:0px] [--kapow-offset-y:2.5%] before:absolute before:-inset-x-[18px] before:-inset-y-[15px] before:content-['']">
        <div className="logo-wordmark absolute top-[calc(50%-1.586rem)] left-0 w-full">
          {outline && (
            <>
              <svg
                aria-hidden
                className="logo-sticker-overlay pointer-events-none absolute z-2 overflow-visible"
                width={outline.width}
                height={outline.height}
                viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
                style={{
                  left: outline.offsetX,
                  top: outline.offsetY,
                }}
                fill="none"
              >
                <path
                  d={outline.d}
                  className="logo-sticker-overlay__stroke"
                  strokeWidth="calc(var(--site-border-width) * 2)"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <svg
                aria-hidden
                className="logo-sticker-overlay pointer-events-none absolute z-4 overflow-visible"
                width={outline.width}
                height={outline.height}
                viewBox={`0 0 ${LOGO_VIEW_WIDTH} ${LOGO_VIEW_HEIGHT}`}
                style={{
                  left: outline.offsetX,
                  top: outline.offsetY,
                }}
                fill="none"
              >
                <path d={outline.d} className="logo-sticker-overlay__fill" />
              </svg>
            </>
          )}
            <ChaseCeeLogo
              active={isHovered}
              onMorphFrame={handleMorphFrame}
            />
            <LogoKapowBackground
              activeIndex={kapowIndex}
              isHovered={isHovered}
              explodeProgress={explodeProgress}
            />
        </div>
      </div>
    </a>
  );
}
