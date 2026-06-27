"use client";

import { useRef, useEffect } from "react";
import StatsOverlay from "./StatsOverlay";
import type { MainToWorkerMessage } from "./messages";
import { isMobileViewport, isWithinPlanet, prefersReducedMotion, shockwaveDiameterPx } from "./shockwave";
import "./shockwave.css";

const IS_DEV = import.meta.env.DEV;

export function PhysicsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shockwaveOverlayRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const instanceKeyRef = useRef(Math.random().toString(36).slice(2));

  const getColorLevel = () => {
    if (typeof window === "undefined") return 4;
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue("--physics-color-level")
      .trim();
    const level = parseInt(cssValue, 10);
    return Number.isNaN(level) ? 4 : level;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (offscreenRef.current) {
      if (IS_DEV) {
        console.log("Canvas control already transferred, skipping...");
      }
      return;
    }

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollForceTimeout: number | undefined;

    let lastTouchY = 0;

    let scrollRafId = 0;
    let logSampleCount = 0;
    let logAccSim = 0;
    let logAccDraw = 0;
    let logAccTotal = 0;
    let logAccGravity = 0;
    let logAccStep = 0;
    let logAccSync = 0;
    let logAccUpload = 0;
    let latestBodyCount = 0;
    let lastPerfLogTime = performance.now();

    const emitPerfLog = (now: number) => {
      if (!IS_DEV || logSampleCount === 0) return;
      if (now - lastPerfLogTime < 2000) return;
      const avgSim = logAccSim / logSampleCount;
      const avgDraw = logAccDraw / logSampleCount;
      const avgTotal = logAccTotal / logSampleCount;
      const avgGravity = logAccGravity / logSampleCount;
      const avgStep = logAccStep / logSampleCount;
      const avgSync = logAccSync / logSampleCount;
      const avgUpload = logAccUpload / logSampleCount;
      const stages = [
        { name: "gravity", ms: avgGravity },
        { name: "step", ms: avgStep },
        { name: "sync", ms: avgSync },
        { name: "upload", ms: avgUpload },
        { name: "draw", ms: avgDraw },
      ];
      let bottleneck = stages[0];
      for (let i = 1; i < stages.length; i++) {
        if (stages[i].ms > bottleneck.ms) bottleneck = stages[i];
      }
      console.log(
        `[physics] bodies=${latestBodyCount} avg(total=${avgTotal.toFixed(2)}ms sim=${avgSim.toFixed(2)}ms draw=${avgDraw.toFixed(2)}ms grav=${avgGravity.toFixed(2)}ms step=${avgStep.toFixed(2)}ms sync=${avgSync.toFixed(2)}ms up=${avgUpload.toFixed(2)}ms) bottleneck=${bottleneck.name}`,
      );
      logSampleCount = 0;
      logAccSim = 0;
      logAccDraw = 0;
      logAccTotal = 0;
      logAccGravity = 0;
      logAccStep = 0;
      logAccSync = 0;
      logAccUpload = 0;
      lastPerfLogTime = now;
    };

    const handleScroll = () => {
      if (scrollRafId) return;
      scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = 0;
        const currentScrollY = window.scrollY;
        const deltaY = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        scrollVelocity = deltaY;

        const message: Extract<MainToWorkerMessage, { type: "SCROLL_FORCE" }> =
          {
            type: "SCROLL_FORCE",
            force: scrollVelocity * 5,
          };
        workerRef.current?.postMessage(message);

        if (scrollForceTimeout) clearTimeout(scrollForceTimeout);

        scrollForceTimeout = window.setTimeout(() => {
          scrollVelocity = 0;
        }, 100);
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    let touchMoveRafId = 0;
    let touchAccumDelta = 0;
    const flushTouchDelta = () => {
      touchMoveRafId = 0;
      if (touchAccumDelta !== 0) {
        const message: Extract<MainToWorkerMessage, { type: "SCROLL_FORCE" }> =
          {
            type: "SCROLL_FORCE",
            force: touchAccumDelta * 25,
          };
        workerRef.current?.postMessage(message);
        touchAccumDelta = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY;
      lastTouchY = currentTouchY;
      touchAccumDelta += deltaY;
      if (!touchMoveRafId) {
        touchMoveRafId = window.requestAnimationFrame(flushTouchDelta);
      }
    };

    workerRef.current = new Worker(
      new URL("./physics.render.worker.ts", import.meta.url),
      { type: "module" },
    );
    let lastMetricsTime = 0;
    workerRef.current.onmessage = (e) => {
      const data = e.data as { type: string; [key: string]: unknown };
      if (!data) return;
      if (data.type === "METRICS") {
        if (!IS_DEV) return; 
        const now = performance.now();
        logSampleCount++;
        logAccSim += (data.simulationTime as number) || 0;
        logAccDraw += (data.renderTime as number) || 0;
        logAccTotal += (data.totalTime as number) || 0;
        logAccGravity += (data.gravityTime as number) || 0;
        logAccStep += (data.stepTime as number) || 0;
        logAccSync += (data.syncTime as number) || 0;
        logAccUpload += (data.uploadTime as number) || 0;
        latestBodyCount = (data.bodyCount as number) || latestBodyCount;
        emitPerfLog(now);
        if (now - lastMetricsTime > 250) {
          lastMetricsTime = now;
          window.dispatchEvent(
            new CustomEvent("physicsMetrics", { detail: data }),
          );
        }
      }
    };

    try {
      const offscreenCanvas = canvas.transferControlToOffscreen();
      const transferList: Transferable[] = [offscreenCanvas];

      offscreenRef.current = offscreenCanvas;

      const level = getColorLevel();

      const initMessage: Extract<MainToWorkerMessage, { type: "INIT" }> = {
        type: "INIT",
        canvas: offscreenCanvas,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        isMobile: window.innerWidth < 768,
        colorLevel: level,
        devicePixelRatio: window.devicePixelRatio || 1,
      };
      workerRef.current.postMessage(initMessage, transferList);
    } catch (error) {
      console.error("Failed to transfer canvas control:", error);
      offscreenRef.current = null;
      return;
    }

    let isDragging = false;
    let lastShockX = 0;
    let lastShockY = 0;
    const SHOCK_DISTANCE = 20;

    const MIN_SHOCK_INTERVAL = 100;
    let lastShockTime = 0;

    const spawnVisualShockwave = (
      clientX: number,
      clientY: number,
      rect: DOMRect,
      diameterMul = 1,
    ) => {
      if (prefersReducedMotion()) return;
      const overlay = shockwaveOverlayRef.current;
      if (!overlay) return;

      const isMobile = isMobileViewport();
      const ring = document.createElement("div");
      ring.className = "hero-shockwave";
      ring.style.left = `${clientX - rect.left}px`;
      ring.style.top = `${clientY - rect.top}px`;
      ring.style.setProperty(
        "--shock-diameter",
        `${shockwaveDiameterPx(rect.width, rect.height, isMobile, diameterMul)}px`,
      );
      ring.addEventListener(
        "animationend",
        () => {
          ring.remove();
        },
        { once: true },
      );
      overlay.appendChild(ring);
    };

    const sendShockwave = (
      clientX: number,
      clientY: number,
      strength = 1,
      force = false,
      cyclePlanetShape = false,
    ) => {
      const now = performance.now();
      if (!force && now - lastShockTime < MIN_SHOCK_INTERVAL) return;
      const rect = canvas.getBoundingClientRect();
      const isMobile = isMobileViewport();
      const inPlanet = isWithinPlanet(clientX, clientY, rect, isMobile);
      const x = clientX - rect.left;
      const y = canvas.clientHeight - (clientY - rect.top);
      const msg: Extract<MainToWorkerMessage, { type: "SHOCKWAVE" }> = {
        type: "SHOCKWAVE",
        x,
        y,
        strength,
        ...(inPlanet && {
          radiusMul: 2,
          forceMul: 2,
          ...(cyclePlanetShape && { cyclePlanetShape: true }),
        }),
      };
      workerRef.current?.postMessage(msg);
      spawnVisualShockwave(clientX, clientY, rect, inPlanet ? 2 : 1);
      lastShockX = clientX;
      lastShockY = clientY;
      lastShockTime = now;
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;

      sendShockwave(e.clientX, e.clientY, 0.25, true, true);
    };

    let moveClientX = 0;
    let moveClientY = 0;
    let moveRafId = 0;
    const pointerMoveRAF = () => {
      moveRafId = 0;
      const dx = moveClientX - lastShockX;
      const dy = moveClientY - lastShockY;
      if (dx * dx + dy * dy >= SHOCK_DISTANCE * SHOCK_DISTANCE) {
        sendShockwave(moveClientX, moveClientY, 0.5);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      moveClientX = e.clientX;
      moveClientY = e.clientY;
      if (!moveRafId) {
        moveRafId = window.requestAnimationFrame(pointerMoveRAF);
      }
    };

    const endDrag = () => {
      isDragging = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointerleave", endDrag);

    window.addEventListener("scroll", handleScroll, { passive: true });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });

    const handleVisibilityChange = () => {
      const pauseMessage: Extract<MainToWorkerMessage, { type: "SET_PAUSED" }> =
        {
          type: "SET_PAUSED",
          paused: document.hidden,
        };
      workerRef.current?.postMessage(pauseMessage);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const lastBuf = { w: 0, h: 0 };
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;

      const dpr = window.devicePixelRatio || 1;
      const bufW = Math.floor(width * dpr);
      const bufH = Math.floor(height * dpr);
      if (bufW === lastBuf.w && bufH === lastBuf.h) return;
      lastBuf.w = bufW;
      lastBuf.h = bufH;

      const resizeMessage: Extract<MainToWorkerMessage, { type: "RESIZE" }> = {
        type: "RESIZE",
        width,
        height,
        devicePixelRatio: dpr,
      };
      workerRef.current?.postMessage(resizeMessage);
    });

    resizeObserver.observe(canvas);

    let isCanvasVisible = true;
    const sendPause = (paused: boolean) => {
      const pauseMsg: Extract<MainToWorkerMessage, { type: "SET_PAUSED" }> = {
        type: "SET_PAUSED",
        paused,
      } as const;
      workerRef.current?.postMessage(pauseMsg);
      window.dispatchEvent(
        new CustomEvent("physicsPaused", { detail: paused }),
      );
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (!entries || entries.length === 0) return;
        isCanvasVisible = entries[0].isIntersecting;
        sendPause(!isCanvasVisible || document.hidden || !windowFocused);
      },
      {
        root: null,
        threshold: 0.01,
      },
    );

    intersectionObserver.observe(canvas);

    let windowFocused = true;
    const handleWindowBlur = () => {
      windowFocused = false;
      sendPause(true);
    };

    const handleWindowFocus = () => {
      windowFocused = true;
      if (isCanvasVisible && !document.hidden) {
        sendPause(false);
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointerleave", endDrag);
      window.removeEventListener("scroll", handleScroll);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const terminateMessage: Extract<
        MainToWorkerMessage,
        { type: "TERMINATE" }
      > = { type: "TERMINATE" };
      workerRef.current?.postMessage(terminateMessage);

      workerRef.current?.terminate();
      workerRef.current = null;

      offscreenRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        key={instanceKeyRef.current}
        ref={canvasRef}
        className="h-full w-full"
      />
      <div
        ref={shockwaveOverlayRef}
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-[90%] bottom-0 bg-linear-to-t from-neutral-100 to-transparent dark:from-neutral-900" />
      {IS_DEV && <StatsOverlay />}
    </div>
  );
}
