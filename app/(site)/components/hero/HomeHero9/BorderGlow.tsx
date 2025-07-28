"use client";
import React, { useEffect, useState, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { keyColorLevels } from "./palette";

const makeGradientFromSamples = (samples: Uint8Array): string => {
  const stepCount = samples.length / 3;
  const parts: string[] = [];
  for (let i = 0; i < stepCount; i++) {
    const r = samples[i * 3];
    const g = samples[i * 3 + 1];
    const b = samples[i * 3 + 2];
    const pct = (i / stepCount) * 100;
    parts.push(`rgb(${r},${g},${b}) ${pct}%`);
  }
  const r0 = samples[0],
    g0 = samples[1],
    b0 = samples[2];
  parts.push(`rgb(${r0},${g0},${b0}) 100%`);
  return `conic-gradient(${parts.join(", ")})`;
};

const fallbackGradient = "transparent";

interface Props {
  children: ReactNode;
  className?: string;
}

const BorderGlow = ({ children, className = "" }: Props) => {
  const [bg, setBg] = useState<string>(fallbackGradient);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      const custom = e as CustomEvent<Uint8Array>;
      const samples = custom.detail;
      if (samples && samples.length >= 6) {
        let bright = 0;
        for (let i = 0; i < samples.length; i += 3) {
          const v = samples[i] + samples[i + 1] + samples[i + 2];
          if (v > 60) bright++;
        }
        if (bright > samples.length / 9) {
          setBg(makeGradientFromSamples(samples));
        }
      }
    };

    window.addEventListener("physicsFrameColors", handler);

    const avgHandler = (e: Event) => {
      const { r, g, b } = (
        e as CustomEvent<{ r: number; g: number; b: number }>
      ).detail;
      const grad = `conic-gradient(rgb(${r},${g},${b}) 0%, rgb(${r},${g},${b}) 100%)`;
      setBg(grad);
    };

    window.addEventListener("physicsFrameColors", handler);
    window.addEventListener("physicsAvgColor", avgHandler);
    return () => {
      window.removeEventListener("physicsFrameColors", handler);
      window.removeEventListener("physicsAvgColor", avgHandler);
    };
  }, []);

  return (
    <span
      className={twMerge(
        "pointer-events-none relative inline-block rounded-[.35rem] p-[.125rem]",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute -inset-1 scale-x-100 scale-y-95 rounded-[100px] opacity-60 blur-sm transition-transform duration-500 ease-in-out group-hover:scale-110"
        style={{
          background: bg,
        }}
      />
      <span className="pointer-events-none absolute -inset-[.125rem] rounded-[inherit] backdrop-blur-md" />
      <span className="pointer-events-auto relative block rounded-[.25rem]">
        {children}
      </span>
    </span>
  );
};

export default BorderGlow;
