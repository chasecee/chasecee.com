"use client";

import { useEffect, useRef } from "react";

export default function StatsOverlay() {
  const overlayRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const {
        simulationTime,
        renderTime,
        totalTime,
        fps,
        calcsPerSec,
        bodyCount,
        gravityTime,
        stepTime,
        syncTime,
        uploadTime,
      } = (e as CustomEvent).detail || {};
      if (!overlayRef.current) return;
      overlayRef.current.textContent =
        `FPS: ${fps.toFixed(1)}\n` +
        `bodies: ${bodyCount}\n` +
        `sim: ${simulationTime.toFixed(2)} ms\n` +
        `grav: ${gravityTime.toFixed(2)} ms\n` +
        `step: ${stepTime.toFixed(2)} ms\n` +
        `sync: ${syncTime.toFixed(2)} ms\n` +
        `up: ${uploadTime.toFixed(2)} ms\n` +
        `draw: ${renderTime.toFixed(2)} ms\n` +
        `tot: ${totalTime.toFixed(2)} ms\n` +
        `calc/s: ${calcsPerSec.toFixed(0)}`;
    };

    window.addEventListener("physicsMetrics", handler);

    const pausedHandler = (e: Event) => {
      const paused = (e as CustomEvent<boolean>).detail;
      if (!overlayRef.current) return;
      overlayRef.current.style.opacity = paused ? "0.5" : "1";
    };
    window.addEventListener("physicsPaused", pausedHandler);
    return () => {
      window.removeEventListener("physicsMetrics", handler);
      window.removeEventListener("physicsPaused", pausedHandler);
    };
  }, []);

  return (
    <pre
      ref={overlayRef}
      style={{
        position: "fixed",
        top: 78,
        right: 8,
        zIndex: 999,
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.2,
        color: "#0f0",
        background: "rgba(0,0,0,0.6)",
        padding: "4px 6px",
        borderRadius: 4,
        pointerEvents: "none",
        width: "168px",
        whiteSpace: "pre-line",
      }}
    />
  );
}
