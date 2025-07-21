"use client";

import { useRef, useEffect } from "react";
import StatsOverlay from "./StatsOverlay";
import { keyColorLevels } from "./palette";
import type { MainToWorkerMessage } from "./messages";

export function PhysicsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const gradient =
    "linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 10%)";
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

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollForceTimeout: number | undefined;

    let lastTouchY = 0;

    let scrollRafId = 0;
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

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY;
      lastTouchY = currentTouchY;

      const message: Extract<MainToWorkerMessage, { type: "SCROLL_FORCE" }> = {
        type: "SCROLL_FORCE",
        force: deltaY * 25,
      };
      workerRef.current?.postMessage(message);
    };

    workerRef.current = new Worker(
      new URL("./physics.render.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current.onmessage = (e) => {
      const data: any = e.data;
      if (data && data.type === "METRICS") {
        window.dispatchEvent(
          new CustomEvent("physicsMetrics", { detail: data }),
        );
      }
    };
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
    };
    workerRef.current.postMessage(initMessage, transferList);

    let isDragging = false;
    let lastShockX = 0;
    let lastShockY = 0;
    const SHOCK_DISTANCE = 20;

    const MIN_SHOCK_INTERVAL = 100;
    let lastShockTime = 0;

    const sendShockwave = (
      clientX: number,
      clientY: number,
      strength = 1,
      force = false,
    ) => {
      const now = performance.now();
      if (!force && now - lastShockTime < MIN_SHOCK_INTERVAL) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = canvas.clientHeight - (clientY - rect.top);
      const msg: Extract<MainToWorkerMessage, { type: "SHOCKWAVE" }> = {
        type: "SHOCKWAVE",
        x,
        y,
        strength,
      };
      workerRef.current?.postMessage(msg);
      lastShockX = clientX;
      lastShockY = clientY;
      lastShockTime = now;
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;

      sendShockwave(e.clientX, e.clientY, 0.25, true);
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

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;

      if ((resizeObserver as any)._debounceId) {
        clearTimeout((resizeObserver as any)._debounceId);
      }
      (resizeObserver as any)._debounceId = setTimeout(() => {
        const resizeMessage: Extract<MainToWorkerMessage, { type: "RESIZE" }> =
          {
            type: "RESIZE",
            width,
            height,
          };
        workerRef.current?.postMessage(resizeMessage);
      }, 100);
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

      if (offscreenRef.current) {
        offscreenRef.current.width = 0;
      }
    };
  }, []);

  return (
    <>
      <canvas
        key={instanceKeyRef.current}
        ref={canvasRef}
        className="h-full w-full"
        style={{
          WebkitMaskImage: gradient,
          maskImage: gradient,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
      {process.env.NODE_ENV !== "production" && <StatsOverlay />}
    </>
  );
}
