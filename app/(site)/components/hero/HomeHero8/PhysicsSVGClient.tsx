"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { PhysicsSVGRef } from "./PhysicsSVG";

const DynamicPhysicsSVG = dynamic(
  () => import("./PhysicsSVG").then((mod) => mod.PhysicsSVG),
  {
    ssr: false,
  },
);

const DESKTOP_SETTINGS = {
  gravity: 40,
  timeStep: 1,
  damping: 0,
  friction: 0,
  restitution: 0,
  numBodies: 800,
  bodySize: 0.35,
  bodySizeVariance: 0.7,
  bodiesStartSpread: 0.7,
  bodiesStartRadius: 0.6,
  colorLevel: 4,
  gridGapSize: 5,
  shockwaveForce: 1000,
  shockwaveRadius: 0.3,
  shockwaveDecay: 0.8,
  shockwaveDirectionality: 0.2,
  centerCircleRadius: 0.3,
  initialClockwiseVelocity: 5,
} as const;

const MOBILE_SETTINGS = {
  gravity: 40,
  timeStep: 1,
  damping: 0,
  friction: 0,
  restitution: 0,
  numBodies: 450,
  bodySize: 0.36,
  bodySizeVariance: 0.5,
  bodiesStartRadius: 0.9,
  bodiesStartSpread: 0.3,
  colorLevel: 4,
  gridGapSize: 8,
  shockwaveForce: 1000,
  shockwaveRadius: 0.4,
  shockwaveDecay: 0.9,
  shockwaveDirectionality: 0.3,
  centerCircleRadius: 0.45,
  initialClockwiseVelocity: 5,
} as const;

const PhysicsSVGClient = React.forwardRef<PhysicsSVGRef>((_, ref) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const physicsRef = useRef<PhysicsSVGRef>(null);

  React.useImperativeHandle(ref, () => ({
    shockwave: (x?: number, y?: number) => physicsRef.current?.shockwave(x, y),
  }));

  const handleResize = React.useCallback(() => {
    if (!mounted) return;
    setIsMobile(window.innerWidth < 768);
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        physicsRef.current?.shockwave();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, isMobile]);

  if (!mounted) {
    return null;
  }

  const settings = isMobile ? MOBILE_SETTINGS : DESKTOP_SETTINGS;

  return (
    <DynamicPhysicsSVG
      key={`physics-${isMobile ? "mobile" : "desktop"}`}
      ref={physicsRef}
      gravity={settings.gravity}
      timeStep={settings.timeStep}
      damping={settings.damping}
      friction={settings.friction}
      restitution={settings.restitution}
      numBodies={settings.numBodies}
      bodySize={settings.bodySize}
      bodySizeVariance={settings.bodySizeVariance}
      colorLevel={settings.colorLevel}
      centerCircleRadius={settings.centerCircleRadius}
      gridGapSize={settings.gridGapSize}
      bodiesStartRadius={settings.bodiesStartRadius}
      bodiesStartSpread={settings.bodiesStartSpread}
      shockwaveForce={settings.shockwaveForce}
      shockwaveRadius={settings.shockwaveRadius}
      shockwaveDecay={settings.shockwaveDecay}
      shockwaveDirectionality={settings.shockwaveDirectionality}
      initialClockwiseVelocity={settings.initialClockwiseVelocity}
      onDragStateChange={() => {}}
      onHoverStateChange={() => {}}
    />
  );
});

PhysicsSVGClient.displayName = "PhysicsSVGClient";

export default PhysicsSVGClient;
