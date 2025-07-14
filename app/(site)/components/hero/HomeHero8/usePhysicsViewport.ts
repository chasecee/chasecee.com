import { useState, useEffect, useRef, useCallback } from "react";
import type { PhysicsSVGRef } from "./PhysicsSVG";

interface UsePhysicsViewportOptions {
  physicsRef: React.RefObject<PhysicsSVGRef | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface UsePhysicsViewportReturn {
  isMobile: boolean;
  colorLevel: number;
  dimensions: { width: number; height: number };
  mounted: boolean;
}

export const usePhysicsViewport = ({
  physicsRef,
  containerRef,
  canvasRef,
}: UsePhysicsViewportOptions): UsePhysicsViewportReturn => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [colorLevel, setColorLevel] = useState(4);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const getColorLevel = useCallback(() => {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue("--physics-color-level")
      .trim();
    const level = parseInt(cssValue, 10);
    return isNaN(level) ? 4 : level;
  }, []);

  const handleResize = useCallback(() => {
    if (!mounted) return;
    const isMobileDevice = window.innerWidth < 768;
    setIsMobile(isMobileDevice);
  }, [mounted]);

  const handleColorSchemeChange = useCallback(() => {
    setColorLevel(getColorLevel());
  }, [getColorLevel]);

  const isPointInCanvas = useCallback(
    (clientX: number, clientY: number): boolean => {
      const canvasBounds = physicsRef.current?.getCanvasBounds();
      if (!canvasBounds) return false;

      return (
        clientX >= canvasBounds.left &&
        clientX <= canvasBounds.right &&
        clientY >= canvasBounds.top &&
        clientY <= canvasBounds.bottom
      );
    },
    [physicsRef],
  );

  const convertToCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvasBounds = physicsRef.current?.getCanvasBounds();
      const canvasDimensions = physicsRef.current?.getCanvasDimensions();
      if (!canvasBounds || !canvasDimensions) return { x: 0, y: 0 };

      return {
        x:
          (clientX - canvasBounds.left) *
          (canvasDimensions.width / canvasBounds.width),
        y:
          (clientY - canvasBounds.top) *
          (canvasDimensions.height / canvasBounds.height),
      };
    },
    [physicsRef],
  );

  // Main mount effect
  useEffect(() => {
    setMounted(true);
    handleResize();
    setColorLevel(getColorLevel());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleColorSchemeChange);
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleColorSchemeChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize, handleColorSchemeChange, getColorLevel]);

  // Intersection observer and interaction handling
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

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

          const handleMouseDown = (e: MouseEvent) => {
            if (isMobile) return;

            const target = e.target as Element;
            if (
              target.tagName === "CANVAS" &&
              isPointInCanvas(e.clientX, e.clientY)
            ) {
              const canvasCoords = convertToCanvasCoords(e.clientX, e.clientY);
              physicsRef.current?.shockwave(canvasCoords.x, canvasCoords.y);
            }
          };

          const handleMouseMove = (e: MouseEvent) => {
            if (isMobile) return;

            if (e.buttons === 1) {
              const target = e.target as Element;
              if (
                target.tagName === "CANVAS" &&
                isPointInCanvas(e.clientX, e.clientY)
              ) {
                const canvasCoords = convertToCanvasCoords(
                  e.clientX,
                  e.clientY,
                );
                physicsRef.current?.shockwave(canvasCoords.x, canvasCoords.y);
              }
            }
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
          document.addEventListener("mousedown", handleMouseDown);
          document.addEventListener("mousemove", handleMouseMove);

          return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
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
  }, [mounted, isMobile, physicsRef, isPointInCanvas, convertToCanvasCoords]);

  // Canvas resize handling
  useEffect(() => {
    if (!mounted || !containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        if (!entries[0]) return;
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }, 100);
    });

    resizeObserver.observe(container);

    // Set initial dimensions
    const { width, height } = container.getBoundingClientRect();
    setDimensions({ width, height });

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [mounted]);

  // Initial shockwave
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        physicsRef.current?.shockwave();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, isMobile, physicsRef]);

  return {
    isMobile,
    colorLevel,
    dimensions,
    mounted,
  };
};
