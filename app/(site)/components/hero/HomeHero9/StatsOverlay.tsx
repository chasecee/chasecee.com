"use client";

import { useEffect, useRef } from "react";

export default function StatsOverlay() {
  const overlayRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { simulationTime, renderTime, totalTime, fps, calcsPerSec } =
        (e as CustomEvent).detail || {};
      if (!overlayRef.current) return;
      overlayRef.current.textContent =
        `FPS: ${fps.toFixed(1)}\n` +
        `sim: ${simulationTime.toFixed(2)} ms\n` +
        `draw: ${renderTime.toFixed(2)} ms\n` +
        `tot: ${totalTime.toFixed(2)} ms\n` +
        `calc/s: ${calcsPerSec.toFixed(0)}`;
    };

    window.addEventListener("physicsMetrics", handler);
    return () => window.removeEventListener("physicsMetrics", handler);
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
        width: "150px",
        whiteSpace: "pre-line",
      }}
    />
  );
}
