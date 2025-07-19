"use client";

import { useEffect, useState } from "react";

const isProd = process.env.NODE_ENV === "production";

export default function StatsOverlay() {
  if (isProd) return null;

  const [fps, setFps] = useState(0);
  const [sim, setSim] = useState(0);
  const [render, setRender] = useState(0);
  const [total, setTotal] = useState(0);
  const [calcs, setCalcs] = useState(0);

  useEffect(() => {
    function handleMetrics(e: Event) {
      const { simulationTime, renderTime, totalTime, fps, calcsPerSec } =
        (e as CustomEvent).detail || {};
      setFps(fps);
      setSim(simulationTime);
      setRender(renderTime);
      setTotal(totalTime);
      setCalcs(calcsPerSec);
    }

    window.addEventListener("physicsMetrics", handleMetrics);
    return () => {
      window.removeEventListener("physicsMetrics", handleMetrics);
    };
  }, []);

  return (
    <div
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
      }}
    >
      FPS: {fps.toFixed(1)}
      <br />
      sim: {sim.toFixed(2)} ms
      <br />
      draw: {render.toFixed(2)} ms
      <br />
      tot: {total.toFixed(2)} ms
      <br />
      calc/s: {calcs.toFixed(0)}
    </div>
  );
}
