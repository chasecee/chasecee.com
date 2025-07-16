"use client";

import { useRef, useEffect, RefObject } from "react";
import type { MainToWorkerMessage } from "./messages";

export function PhysicsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollForceTimeout: number | undefined;

    let lastTouchY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      scrollVelocity = deltaY;

      const message: Extract<MainToWorkerMessage, { type: "SCROLL_FORCE" }> = {
        type: "SCROLL_FORCE",
        force: scrollVelocity * 5,
      };
      workerRef.current?.postMessage(message);

      if (scrollForceTimeout) clearTimeout(scrollForceTimeout);

      scrollForceTimeout = window.setTimeout(() => {
        scrollVelocity = 0;
      }, 100);
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
    );

    const offscreenCanvas = canvas.transferControlToOffscreen();

    const initMessage: Extract<MainToWorkerMessage, { type: "INIT" }> = {
      type: "INIT",
      canvas: offscreenCanvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      isMobile: window.innerWidth < 768,
    };
    workerRef.current.postMessage(initMessage, [offscreenCanvas]);

    // --- Pointer-based shockwave line ---
    let isDragging = false;
    let lastShockX = 0;
    let lastShockY = 0;
    const SHOCK_DISTANCE = 20; // px between shockwave points

    const MIN_SHOCK_INTERVAL = 100; // ms
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
      // small pre-shock (force send)
      sendShockwave(e.clientX, e.clientY, 0.25, true);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastShockX;
      const dy = e.clientY - lastShockY;
      if (dx * dx + dy * dy >= SHOCK_DISTANCE * SHOCK_DISTANCE) {
        sendShockwave(e.clientX, e.clientY, 0.5);
      }
    };

    const endDrag = () => {
      isDragging = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointerleave", endDrag);

    window.addEventListener("scroll", handleScroll);
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
      const resizeMessage: Extract<MainToWorkerMessage, { type: "RESIZE" }> = {
        type: "RESIZE",
        width,
        height,
      };
      workerRef.current?.postMessage(resizeMessage);
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
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
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
