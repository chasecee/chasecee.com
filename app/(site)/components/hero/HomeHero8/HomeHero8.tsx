"use client";
import React, { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { PhysicsSVGRef } from "./PhysicsSVG";

const DynamicPhysicsSVG = dynamic(
  () => import("./PhysicsSVG").then((mod) => mod.PhysicsSVG),
  {
    ssr: false,
  },
);

const PHYSICS_SETTINGS = {
  gravity: 10,
  timeStep: 1,
  damping: 0,
  friction: 0,
  restitution: 0.25,
  numBodies: 1000,
  bodySize: 0.2,
  bodySizeVariance: 0.5,
  bodyCornerRadius: 0.8,
  colorLevel: 4,
  centerCircleRadius: 0.25,
  gridGapSize: 5,
  bodiesStartRadius: 0.4,
  bodiesStartSpread: 0.4,
  shockwaveForce: 5000,
  shockwaveRadius: 0.1,
  shockwaveDecay: 0.8,
  shockwaveDirectionality: 0.2,
} as const;

const HomeHero8 = () => {
  const physicsRef = useRef<PhysicsSVGRef>(null);

  const resetSimulation = useCallback(() => {
    physicsRef.current?.reset();
  }, []);

  return (
    <div className="relative w-full">
      <div className="mt-24 flex h-[calc(100vh-10rem)] flex-col items-center gap-12 pb-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="pointer-events-none relative z-10 mx-auto w-full p-10 text-center lg:max-w-1/2">
          <h1 className="text-5xl font-semibold tracking-wide text-pretty text-gray-900 md:text-6xl dark:text-white">
            Let&apos;s build something great together.
          </h1>
          <div className="flex flex-col gap-8">
            <p className="text-lg text-pretty text-gray-600 md:text-xl dark:text-gray-300">
              Call the guy who&apos;s obsessed with crafting excellent
              experiences.
            </p>
            <div className="pointer-events-auto flex flex-col flex-wrap items-center justify-center gap-3 md:flex-row">
              <button
                onClick={() => physicsRef.current?.solve()}
                className="pointer-events-auto flex-grow cursor-pointer rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                Solve
              </button>
              <button
                onClick={() => physicsRef.current?.shockwave()}
                className="pointer-events-auto flex-grow cursor-pointer rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
              >
                Explode
              </button>
              <Link
                href="/contact"
                className="pointer-events-auto flex-grow rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 w-full flex-1">
          <DynamicPhysicsSVG
            ref={physicsRef}
            gravity={PHYSICS_SETTINGS.gravity}
            timeStep={PHYSICS_SETTINGS.timeStep}
            damping={PHYSICS_SETTINGS.damping}
            friction={PHYSICS_SETTINGS.friction}
            restitution={PHYSICS_SETTINGS.restitution}
            numBodies={PHYSICS_SETTINGS.numBodies}
            bodySize={PHYSICS_SETTINGS.bodySize}
            bodySizeVariance={PHYSICS_SETTINGS.bodySizeVariance}
            colorLevel={PHYSICS_SETTINGS.colorLevel}
            centerCircleRadius={PHYSICS_SETTINGS.centerCircleRadius}
            bodyCornerRadius={PHYSICS_SETTINGS.bodyCornerRadius}
            gridGapSize={PHYSICS_SETTINGS.gridGapSize}
            bodiesStartRadius={PHYSICS_SETTINGS.bodiesStartRadius}
            bodiesStartSpread={PHYSICS_SETTINGS.bodiesStartSpread}
            shockwaveForce={PHYSICS_SETTINGS.shockwaveForce}
            shockwaveRadius={PHYSICS_SETTINGS.shockwaveRadius}
            shockwaveDecay={PHYSICS_SETTINGS.shockwaveDecay}
            shockwaveDirectionality={PHYSICS_SETTINGS.shockwaveDirectionality}
            onDragStateChange={() => {}}
            onHoverStateChange={() => {}}
          />
        </div>
      </div>

      <div className="absolute right-4 bottom-4 sm:right-8 sm:bottom-8">
        <button
          onClick={resetSimulation}
          className="rounded-full bg-gray-200/50 px-4 py-2 text-xs font-medium text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-200/80 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-800/80"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default HomeHero8;
