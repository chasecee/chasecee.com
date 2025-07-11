"use client";
import React, { useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PhysicsCanvas, PhysicsCanvasRef } from "./PhysicsCanvas";

// Dynamic import with SSR disabled
const DynamicPhysicsCanvas = dynamic(
  () => import("./PhysicsCanvas").then((mod) => mod.PhysicsCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex w-full justify-center"
        style={{ minHeight: "400px" }}
      >
        <div className="flex h-96 w-full max-w-4xl animate-pulse items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
          <div className="text-gray-500 dark:text-gray-400">
            Loading physics simulation...
          </div>
        </div>
      </div>
    ),
  },
);

interface PhysicsSettings {
  gravity: number;
  timeStep: number;
  damping: number;
  friction: number;
  restitution: number;
}

const HomeHero8 = () => {
  const [showControls, setShowControls] = useState(false);
  const [settings, setSettings] = useState<PhysicsSettings>({
    gravity: 50,
    timeStep: 1 / 60, // Adjusted for smoother simulation
    damping: 0.1,
    friction: 0.8,
    restitution: 0.6,
  });

  const canvasRef = useRef<PhysicsCanvasRef>(null);

  const updateSettings = useCallback(
    (newSettings: Partial<PhysicsSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  const solveLayout = useCallback(() => {
    canvasRef.current?.solve();
  }, []);

  const resetSimulation = useCallback(() => {
    canvasRef.current?.reset();
  }, []);

  return (
    <div className="relative w-full">
      <div className="container flex flex-col items-center gap-12 pt-20 pb-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="w-full text-left lg:max-w-md">
          <h1 className="mb-6 text-5xl font-semibold tracking-tight text-gray-900 md:text-6xl dark:text-white">
            Who is gonna fix this mess?
          </h1>
          <div className="flex flex-col gap-6">
            <p className="max-w-2xl text-lg text-pretty text-gray-600 md:text-xl dark:text-gray-300">
              Leveraging web can be scary. Call the guy who's obsessed with
              building excellent websites.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={solveLayout}
                className="flex-grow rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Fix it, Chase!
              </button>
              <Link href="/contact" passHref legacyBehavior>
                <a className="flex-grow rounded-full border border-gray-300 px-8 py-3 text-center text-sm font-medium text-gray-900 transition-all hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
                  Contact Me
                </a>
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full flex-1">
          <DynamicPhysicsCanvas
            ref={canvasRef}
            gravity={settings.gravity}
            timeStep={settings.timeStep}
            damping={settings.damping}
            friction={settings.friction}
            restitution={settings.restitution}
            onDragStateChange={() => {}}
            onHoverStateChange={() => {}}
          />
        </div>
      </div>

      <div className="absolute right-4 bottom-4 flex flex-col items-end gap-4 sm:right-8 sm:bottom-8">
        <div className="flex gap-4">
          <button
            onClick={resetSimulation}
            className="rounded-full bg-gray-200/50 px-4 py-2 text-xs font-medium text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-200/80 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-800/80"
          >
            Reset
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="rounded-full bg-gray-200/50 px-4 py-2 text-xs font-medium text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-200/80 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-800/80"
          >
            {showControls ? "Hide" : "Show"} Controls
          </button>
        </div>
        {showControls && (
          <div className="w-72 max-w-xs rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key}>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                    {key === "timeStep"
                      ? `${Math.round(1 / value)} fps`
                      : value.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={
                      key === "gravity" ? 0 : key === "timeStep" ? 1 / 120 : 0
                    }
                    max={
                      key === "gravity" ? 200 : key === "timeStep" ? 1 / 10 : 1
                    }
                    step={
                      key === "gravity" ? 5 : key === "timeStep" ? 0.001 : 0.05
                    }
                    value={value}
                    onChange={(e) =>
                      updateSettings({ [key]: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeHero8;
