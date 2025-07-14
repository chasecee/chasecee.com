"use client";
import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { PhysicsSVG, type PhysicsSVGRef } from "./PhysicsSVG";

const noop = () => {};

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
  initialClockwiseVelocity: 2,
  scrollForceMultiplier: 2.5,
  scrollVelocityDamping: 0.95,
  scrollInertiaDecay: 0.92,
  scrollDirectionInfluence: 1.0,
} as const;

const MOBILE_SETTINGS = {
  gravity: 40,
  timeStep: 1,
  damping: 0,
  friction: 0,
  restitution: 0,
  numBodies: 350,
  bodySize: 0.38,
  bodySizeVariance: 0.5,
  bodiesStartRadius: 0.9,
  bodiesStartSpread: 0.3,
  colorLevel: 4,
  gridGapSize: 8,
  shockwaveForce: 1000,
  shockwaveRadius: 0.4,
  shockwaveDecay: 0.9,
  shockwaveDirectionality: 0.3,
  centerCircleRadius: 0.4,
  initialClockwiseVelocity: 5,
  scrollForceMultiplier: 1.5,
  scrollVelocityDamping: 0.88,
  scrollInertiaDecay: 0.85,
  scrollDirectionInfluence: 1.2,
} as const;

const PhysicsSVGClient = forwardRef<PhysicsSVGRef>((_, ref) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const physicsRef = useRef<PhysicsSVGRef>(null);

  useImperativeHandle(ref, () => ({
    shockwave: (x?: number, y?: number) => physicsRef.current?.shockwave(x, y),
    applyScrollForce: (force: number, direction: number) =>
      physicsRef.current?.applyScrollForce(force, direction),
    getCanvasBounds: () => physicsRef.current?.getCanvasBounds() || null,
  }));

  useEffect(() => {
    const handleResize = () => {
      if (!mounted) return;
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    setMounted(true);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let lastScrollPos = window.scrollY;
          let lastTouchY = 0;
          let lastTime = performance.now();

          const applyForce = (velocity: number) => {
            if (physicsRef.current && Math.abs(velocity) > 2) {
              physicsRef.current.applyScrollForce(
                velocity,
                Math.sign(velocity),
              );
            }
          };

          const handleScroll = () => {
            if (isMobile) return;

            const now = performance.now();
            const currentScrollY = window.scrollY;
            const deltaTime = now - lastTime;
            const deltaScroll = currentScrollY - lastScrollPos;

            if (deltaTime > 16 && Math.abs(deltaScroll) > 1) {
              const velocity = (deltaScroll / deltaTime) * 18;
              applyForce(velocity);
            }

            lastScrollPos = currentScrollY;
            lastTime = now;
          };

          const isPointInCanvas = (
            clientX: number,
            clientY: number,
          ): boolean => {
            const canvasBounds = physicsRef.current?.getCanvasBounds();
            if (!canvasBounds) return false;

            return (
              clientX >= canvasBounds.left &&
              clientX <= canvasBounds.right &&
              clientY >= canvasBounds.top &&
              clientY <= canvasBounds.bottom
            );
          };

          const convertToCanvasCoords = (clientX: number, clientY: number) => {
            const canvasBounds = physicsRef.current?.getCanvasBounds();
            if (!canvasBounds) return { x: 0, y: 0 };

            return {
              x: clientX - canvasBounds.left,
              y: clientY - canvasBounds.top,
            };
          };

          const handleTouchStart = (e: TouchEvent) => {
            if (!isMobile) return;

            const touch = e.touches[0];
            lastTouchY = touch.clientY;
            lastTime = performance.now();

            if (isPointInCanvas(touch.clientX, touch.clientY)) {
              const canvasCoords = convertToCanvasCoords(
                touch.clientX,
                touch.clientY,
              );
              physicsRef.current?.shockwave(canvasCoords.x, canvasCoords.y);
            }
          };

          const handleTouchMove = (e: TouchEvent) => {
            if (!isMobile) return;

            const now = performance.now();
            const touch = e.touches[0];
            const currentTouchY = touch.clientY;
            const deltaTime = now - lastTime;
            const deltaY = lastTouchY - currentTouchY;

            const isTouchingCanvas = isPointInCanvas(
              touch.clientX,
              touch.clientY,
            );

            if (deltaTime > 16 && Math.abs(deltaY) > 3) {
              const velocity = (deltaY / deltaTime) * 25;

              if (isTouchingCanvas) {
                applyForce(velocity);
                const canvasCoords = convertToCanvasCoords(
                  touch.clientX,
                  touch.clientY,
                );
                physicsRef.current?.shockwave(canvasCoords.x, canvasCoords.y);
              }
            }

            lastTouchY = currentTouchY;
            lastTime = now;
          };

          window.addEventListener("scroll", handleScroll, { passive: true });
          document.addEventListener("touchstart", handleTouchStart, {
            passive: true,
          });
          document.addEventListener("touchmove", handleTouchMove, {
            passive: true,
          });

          return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
          };
        }
      },
      { threshold: 0.1 },
    );

    const sentinel = document.getElementById("hero-sentinel");
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      observer.disconnect();
    };
  }, [mounted, isMobile]);

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
    <PhysicsSVG
      key={`physics-${isMobile ? "mobile" : "desktop"}`}
      ref={physicsRef}
      {...settings}
      onDragStateChange={noop}
      onHoverStateChange={noop}
    />
  );
});

PhysicsSVGClient.displayName = "PhysicsSVGClient";

export default PhysicsSVGClient;
