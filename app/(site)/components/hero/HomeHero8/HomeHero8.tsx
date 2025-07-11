"use client";
import React, { useRef, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  PhysicsCanvas,
  PhysicsCanvasRef,
  PhysicsCanvasProps,
} from "./PhysicsCanvas";

// Dynamic import with SSR disabled
const DynamicPhysicsCanvas = dynamic(() => Promise.resolve(PhysicsCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex w-full justify-center" style={{ minHeight: "400px" }}>
      <div className="flex h-96 w-full max-w-4xl animate-pulse items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <div className="text-gray-500 dark:text-gray-400">
          Loading physics simulation...
        </div>
      </div>
    </div>
  ),
});

interface PhysicsSettings {
  gravity: number;
  timeStep: number;
  damping: number;
  friction: number;
  restitution: number;
}

const HomeHero8 = () => {
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [settings, setSettings] = useState<PhysicsSettings>({
    gravity: 50,
    timeStep: 1 / 30,
    damping: 0.4,
    friction: 0.7,
    restitution: 0.9,
  });

  const canvasRef = useRef<PhysicsCanvasRef>(null);

  const updateSettings = useCallback(
    (newSettings: Partial<PhysicsSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [],
  );

  const resetSimulation = useCallback(() => {
    canvasRef.current?.reset();
  }, []);

  return (
    <div className="relative w-full">
      <div className="container flex flex-row items-center gap-16 pt-20">
        <div className="text-left">
          <h1 className="mb-6 text-6xl font-semibold tracking-tight text-gray-900 dark:text-white">
            who you gonna call?
          </h1>
          <div className="flex flex-col gap-10">
            <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
              When the gap between the web and the real world is too big, we
              need to call the web builder.
            </p>
            <button
              onClick={resetSimulation}
              className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Call the web builder
            </button>
          </div>
          <div className="absolute right-0 bottom-0">
            <div className="mb-8 flex justify-center gap-6">
              <button
                onClick={() => setShowControls(!showControls)}
                className="rounded-full border border-gray-300 px-8 py-3 text-sm font-medium text-gray-900 transition-all hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
              >
                Controls
              </button>
            </div>

            {showControls && (
              <div className="mx-auto mb-12 max-w-5xl rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
                  {Object.entries(settings).map(([key, value]) => (
                    <div key={key}>
                      <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                        {key === "timeStep"
                          ? Math.round(1 / value) + "fps"
                          : value}
                      </label>
                      <input
                        type="range"
                        min={
                          key === "gravity" ? 0 : key === "timeStep" ? 0.016 : 0
                        }
                        max={
                          key === "gravity" ? 100 : key === "timeStep" ? 0.1 : 1
                        }
                        step={
                          key === "gravity"
                            ? 2.5
                            : key === "timeStep"
                              ? 0.003
                              : 0.1
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

        <DynamicPhysicsCanvas
          ref={canvasRef}
          gravity={settings.gravity}
          timeStep={settings.timeStep}
          damping={settings.damping}
          friction={settings.friction}
          restitution={settings.restitution}
          onDragStateChange={setIsDragging}
          onHoverStateChange={setIsHovering}
        />
      </div>
    </div>
  );
};

export default HomeHero8;
