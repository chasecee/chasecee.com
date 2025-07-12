"use client";
import React, {
  useRef,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { palette } from "./pallette";

export interface PhysicsSVGProps {
  gravity: number;
  timeStep: number;
  damping: number;
  friction: number;
  restitution: number;
  numBodies?: number;
  bodySize?: number;
  bodySizeVariance?: number;
  colorLevel: number;
  centerCircleRadius: number;
  gridGapSize: number;
  bodiesStartRadius: number;
  bodiesStartSpread: number;
  shockwaveForce: number;
  shockwaveRadius: number;
  shockwaveDecay: number;
  shockwaveDirectionality: number;
  onDragStateChange: (isDragging: boolean) => void;
  onHoverStateChange: (isHovering: boolean) => void;
}

export interface PhysicsSVGRef {
  reset: () => void;
  solve: () => void;
  shockwave: (x?: number, y?: number) => void;
}

interface PhysicsBodyData {
  id: string;
  x: number;
  y: number;
  rotation: number;
  isDragged: boolean;
  width: number;
  height: number;
  colorIndex: number;
}

// Helper function to parse HSLA color string
const parseHSLA = (hslaString: string) => {
  const match = hslaString.match(/HSLA\((\d+),(\d+)%,(\d+)%,([0-9.]+)\)/);
  if (!match) return { h: 0, s: 0, l: 0, a: 1 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
    a: parseFloat(match[4]),
  };
};

// Helper function to interpolate between two HSLA colors
const interpolateHSLA = (color1: string, color2: string, factor: number) => {
  const hsla1 = parseHSLA(color1);
  const hsla2 = parseHSLA(color2);

  // Handle hue interpolation (shortest path around color wheel)
  let h1 = hsla1.h;
  let h2 = hsla2.h;
  let hDiff = h2 - h1;

  if (Math.abs(hDiff) > 180) {
    if (hDiff > 0) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }

  const h = (h1 + (h2 - h1) * factor) % 360;
  const s = hsla1.s + (hsla2.s - hsla1.s) * factor;
  const l = hsla1.l + (hsla2.l - hsla1.l) * factor;
  const a = hsla1.a + (hsla2.a - hsla1.a) * factor;

  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
};

const generateRainbowFromPalette = (
  index: number,
  totalBodies: number,
  colorLevel: number,
): string => {
  // Define color order for better visual flow (traditional rainbow order)
  const colorOrder: Array<keyof typeof palette> = [
    "red",
    "amber",
    "green",
    "teal",
    "blue",
    "purple",
    "pink",
  ];

  // Use the specified level (0-9 maps to 100-900)
  const levelIndex = Math.min(Math.max(colorLevel, 0), 9);

  // Calculate position in the rainbow (0 to 1)
  const rainbowPosition = (index / totalBodies) % 1;

  // Calculate which color segment we're in
  const colorPosition = rainbowPosition * colorOrder.length;
  const colorIndex = Math.floor(colorPosition);
  const nextColorIndex = (colorIndex + 1) % colorOrder.length;

  // Get interpolation factor between the two colors
  const interpolationFactor = colorPosition - colorIndex;

  // Get the two colors to interpolate between
  const currentColor = palette[colorOrder[colorIndex]][levelIndex];
  const nextColor = palette[colorOrder[nextColorIndex]][levelIndex];

  // Return interpolated color
  return interpolateHSLA(currentColor, nextColor, interpolationFactor);
};

export const PhysicsSVG = memo(
  forwardRef<PhysicsSVGRef, PhysicsSVGProps>(
    (
      {
        gravity,
        timeStep,
        damping,
        friction,
        restitution,
        numBodies = 20,
        bodySize = 1.0,
        bodySizeVariance = 0.5,
        colorLevel,
        centerCircleRadius,
        gridGapSize,
        bodiesStartRadius,
        bodiesStartSpread,
        shockwaveForce,
        shockwaveRadius,
        shockwaveDecay,
        shockwaveDirectionality,
        onDragStateChange,
        onHoverStateChange,
      },
      ref,
    ) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const workerRef = useRef<Worker | null>(null);
      const dimensionsRef = useRef({ width: 0, height: 0 });
      const bodiesRef = useRef<PhysicsBodyData[]>([]);
      const isHoveringRef = useRef(false);
      const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
      const renderRequestRef = useRef<number>(0);
      const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

      useImperativeHandle(ref, () => ({
        reset: () => {
          workerRef.current?.postMessage({ type: "RESET" });
        },
        solve: () => {
          workerRef.current?.postMessage({ type: "SOLVE_GRID" });
        },
        shockwave: (x?: number, y?: number) => {
          // If no coordinates provided, use center of canvas
          const centerX = x ?? dimensionsRef.current.width / 2;
          const centerY = y ?? dimensionsRef.current.height / 2;

          workerRef.current?.postMessage({
            type: "SHOCKWAVE",
            payload: { x: centerX, y: centerY },
          });
        },
      }));

      // Initialize worker and physics simulation once
      useEffect(() => {
        let isMounted = true;
        let unregisterPointerEvents: (() => void) | null = null;
        let unregisterResizeObserver: (() => void) | null = null;

        const initializeWorker = async () => {
          if (!isMounted || !canvasRef.current || !containerRef.current) return;

          const canvas = canvasRef.current;
          const container = containerRef.current;

          // Cache canvas context
          canvasContextRef.current = canvas.getContext("2d");

          // Create worker - Turbopack compatible pattern
          const worker = new Worker(
            new URL("./physics.worker.ts", import.meta.url),
            { type: "module" },
          );
          workerRef.current = worker;

          // Handle worker messages
          worker.onmessage = (event) => {
            const { type, payload } = event.data;

            switch (type) {
              case "INITIALIZED":
                break;

              case "BODY_UPDATE":
                bodiesRef.current = payload;

                if (renderRequestRef.current === 0) {
                  renderRequestRef.current =
                    requestAnimationFrame(renderBodies);
                }
                break;

              case "BODY_UPDATE_DELTA":
                // Handle delta updates by merging with existing data
                const updatedBodies = [...bodiesRef.current];
                payload.forEach((changedBody: PhysicsBodyData) => {
                  const index = updatedBodies.findIndex(
                    (b) => b.id === changedBody.id,
                  );
                  if (index !== -1) {
                    updatedBodies[index] = changedBody;
                  }
                });
                bodiesRef.current = updatedBodies;

                if (renderRequestRef.current === 0) {
                  renderRequestRef.current =
                    requestAnimationFrame(renderBodies);
                }
                break;
            }
          };

          // Setup resize observer
          const resizeObserver = new ResizeObserver((entries) => {
            if (resizeTimeoutRef.current) {
              clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
              if (!entries[0]) return;
              const { width, height } = entries[0].contentRect;
              const dpr = window.devicePixelRatio || 1;

              dimensionsRef.current = { width, height };
              canvas.width = width * dpr;
              canvas.height = height * dpr;
              canvas.style.width = `${width}px`;
              canvas.style.height = `${height}px`;

              if (canvasContextRef.current) {
                canvasContextRef.current.scale(dpr, dpr);
              }

              worker.postMessage({
                type: "UPDATE_DIMENSIONS",
                payload: { width, height, numBodies },
              });
            }, 100);
          });

          resizeObserver.observe(container);
          unregisterResizeObserver = () => resizeObserver.disconnect();

          // Initial setup
          const { width, height } = container.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          dimensionsRef.current = { width, height };
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;

          if (canvasContextRef.current) {
            canvasContextRef.current.scale(dpr, dpr);
          }

          // Initialize physics
          worker.postMessage({ type: "INIT" });

          // Send settings BEFORE creating bodies
          worker.postMessage({
            type: "UPDATE_SETTINGS",
            payload: {
              gravity,
              timeStep,
              damping,
              friction,
              restitution,
              bodySize,
              bodySizeVariance,
              centerCircleRadius,
              gridGapSize,
              bodiesStartRadius,
              bodiesStartSpread,
              shockwaveForce,
              shockwaveRadius,
              shockwaveDecay,
              shockwaveDirectionality,
            },
          });

          worker.postMessage({
            type: "UPDATE_DIMENSIONS",
            payload: { width, height, numBodies },
          });

          // Unified pointer event handlers
          const getPointerPos = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            return {
              x:
                (e.clientX - rect.left) *
                (dimensionsRef.current.width / rect.width),
              y:
                (e.clientY - rect.top) *
                (dimensionsRef.current.height / rect.height),
            };
          };

          const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const pos = getPointerPos(e);

            // Check if click is in center circle
            const centerX = dimensionsRef.current.width / 2;
            const centerY = dimensionsRef.current.height / 2;
            const centerRadius =
              Math.min(
                dimensionsRef.current.width,
                dimensionsRef.current.height,
              ) * centerCircleRadius;

            const distanceFromCenter = Math.sqrt(
              Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2),
            );

            if (distanceFromCenter <= centerRadius) {
              // Clicked in center - trigger enhanced omnidirectional shockwave
              worker.postMessage({
                type: "CENTER_SHOCKWAVE",
                payload: { x: centerX, y: centerY },
              });
            } else {
              // Clicked elsewhere - trigger normal shockwave
              worker.postMessage({
                type: "SHOCKWAVE",
                payload: { x: pos.x, y: pos.y },
              });
            }
          };

          const onPointerMove = (e: PointerEvent) => {
            const pos = getPointerPos(e);

            // Check if hovering over a body
            const isOverBody = bodiesRef.current.some((body) => {
              const dx = pos.x - body.x;
              const dy = pos.y - body.y;
              const radius = Math.sqrt(body.width * body.height) / 2;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= radius;
            });

            if (isOverBody !== isHoveringRef.current) {
              isHoveringRef.current = isOverBody;
              onHoverStateChange(isOverBody);
            }
          };

          // Register pointer events once
          canvas.addEventListener("pointerdown", onPointerDown);
          canvas.addEventListener("pointermove", onPointerMove);

          unregisterPointerEvents = () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
          };
        };

        initializeWorker();

        return () => {
          isMounted = false;
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          if (unregisterPointerEvents) unregisterPointerEvents();
          if (unregisterResizeObserver) unregisterResizeObserver();
          if (renderRequestRef.current) {
            cancelAnimationFrame(renderRequestRef.current);
          }
          if (workerRef.current) {
            workerRef.current.postMessage({ type: "DESTROY" });
            workerRef.current.terminate();
            workerRef.current = null;
          }
        };
      }, [onDragStateChange, onHoverStateChange]);

      // Update physics settings in separate effect
      useEffect(() => {
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: "UPDATE_SETTINGS",
            payload: {
              gravity,
              timeStep,
              damping,
              friction,
              restitution,
              bodySize,
              bodySizeVariance,
              centerCircleRadius,
              gridGapSize,
              bodiesStartRadius,
              bodiesStartSpread,
              shockwaveForce,
              shockwaveRadius,
              shockwaveDecay,
              shockwaveDirectionality,
            },
          });
        }
      }, [
        gravity,
        timeStep,
        damping,
        friction,
        restitution,
        bodySize,
        bodySizeVariance,
        centerCircleRadius,
        gridGapSize,
        bodiesStartRadius,
        bodiesStartSpread,
        shockwaveForce,
        shockwaveRadius,
        shockwaveDecay,
        shockwaveDirectionality,
      ]);

      // Update number of bodies when it changes
      useEffect(() => {
        if (workerRef.current && dimensionsRef.current.width > 0) {
          workerRef.current.postMessage({
            type: "UPDATE_DIMENSIONS",
            payload: {
              width: dimensionsRef.current.width,
              height: dimensionsRef.current.height,
              numBodies,
            },
          });
        }
      }, [numBodies]);

      // Canvas render function for optimal performance
      const renderBodies = useCallback(() => {
        renderRequestRef.current = 0;

        const canvas = canvasRef.current;
        const ctx = canvasContextRef.current;
        if (!canvas || !ctx) return;

        const { width, height } = dimensionsRef.current;
        const bodies = bodiesRef.current;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Performance optimizations for high body counts
        const isHighBodyCount = bodies.length > 500;

        // Viewport culling - only draw bodies that are visible
        const padding = 50; // Add padding to catch bodies partially off-screen
        const visibleBodies = bodies.filter(
          (body) =>
            body.x + body.width / 2 > -padding &&
            body.x - body.width / 2 < width + padding &&
            body.y + body.height / 2 > -padding &&
            body.y - body.height / 2 < height + padding,
        );

        // Level of detail - use simpler shapes for small bodies
        const simplifyThreshold = Math.min(width, height) * 0.02; // 2% of canvas size

        // Batch drawing by grouping bodies with similar properties
        const draggedBodies = visibleBodies.filter((body) => body.isDragged);
        const regularBodies = visibleBodies.filter((body) => !body.isDragged);

        // Draw regular bodies first (no shadows)
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        regularBodies.forEach((body) => {
          const {
            x,
            y,
            width: bodyWidth,
            height: bodyHeight,
            rotation,
            colorIndex,
          } = body;

          // Skip tiny bodies when there are many
          if (isHighBodyCount && Math.max(bodyWidth, bodyHeight) < 5) return;

          ctx.save();
          ctx.translate(x, y);

          // Skip rotation for small bodies to save performance
          if (Math.max(bodyWidth, bodyHeight) > simplifyThreshold) {
            ctx.rotate((rotation * Math.PI) / 180);
          }

          // Set fill color using palette
          ctx.fillStyle = generateRainbowFromPalette(
            colorIndex,
            bodies.length,
            colorLevel,
          );

          // Draw circles for all bodies - use consistent radius
          const radius = Math.sqrt(bodyWidth * bodyHeight) / 2;

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });

        // Draw dragged bodies last (with shadows)
        draggedBodies.forEach((body) => {
          const {
            x,
            y,
            width: bodyWidth,
            height: bodyHeight,
            rotation,
            colorIndex,
          } = body;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rotation * Math.PI) / 180);

          // Set fill color using palette
          ctx.fillStyle = generateRainbowFromPalette(
            colorIndex,
            bodies.length,
            colorLevel,
          );

          // Apply shadow for dragged bodies
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 6;

          // Draw circles for dragged bodies - use consistent radius
          const radius = Math.sqrt(bodyWidth * bodyHeight) / 2;

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });
      }, [colorLevel]);

      return (
        <div
          ref={containerRef}
          className="relative top-1/2 aspect-[9/14] w-full max-w-full -translate-y-1/2 md:aspect-square"
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{
              cursor: isHoveringRef.current ? "pointer" : "default",
            }}
          />
        </div>
      );
    },
  ),
);

PhysicsSVG.displayName = "PhysicsSVG";
