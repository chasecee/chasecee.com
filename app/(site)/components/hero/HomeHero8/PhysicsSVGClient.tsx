"use client";
import { useRef, useImperativeHandle, forwardRef } from "react";
import { PhysicsSVG, type PhysicsSVGRef } from "./PhysicsSVG";
import { getPhysicsConfig } from "./physicsConfig";
import { usePhysicsViewport } from "./usePhysicsViewport";

const PhysicsSVGClient = forwardRef<PhysicsSVGRef>((_, ref) => {
  const physicsRef = useRef<PhysicsSVGRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isMobile, colorLevel, dimensions, mounted } = usePhysicsViewport({
    physicsRef,
    containerRef,
    canvasRef,
  });

  useImperativeHandle(ref, () => ({
    shockwave: (x?: number, y?: number) => physicsRef.current?.shockwave(x, y),
    applyScrollForce: (force: number, direction: number) =>
      physicsRef.current?.applyScrollForce(force, direction),
    getCanvasBounds: () => physicsRef.current?.getCanvasBounds() || null,
    getCanvasDimensions: () =>
      physicsRef.current?.getCanvasDimensions() || { width: 0, height: 0 },
  }));

  if (!mounted) {
    return null;
  }

  const settings = {
    ...getPhysicsConfig(isMobile),
    colorLevel,
  };

  return (
    <PhysicsSVG
      key={`physics-${isMobile ? "mobile" : "desktop"}-${colorLevel}`}
      ref={physicsRef}
      containerRef={containerRef}
      canvasRef={canvasRef}
      dimensions={dimensions}
      {...settings}
    />
  );
});

PhysicsSVGClient.displayName = "PhysicsSVGClient";

export default PhysicsSVGClient;
