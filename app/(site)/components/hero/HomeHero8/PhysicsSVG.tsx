"use client";
import React, {
  useRef,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  RefObject,
} from "react";
import { palette as importedPalette } from "./palette";
import type { PhysicsConfig } from "./physicsConfig";
import { generateRainbowFromPalette } from "../../../utils/colorUtils";
import { degreesToRadians, magnitude } from "../../../utils/mathUtils";

const canvasStyle = {
  touchAction: "auto",
};

const containerStyle = {
  mask: "linear-gradient(to top, transparent 0%, black 5%)",
  WebkitMask: "linear-gradient(to top, transparent 0%, black 5%)",
  touchAction: "auto",
};

export interface PhysicsSVGProps extends PhysicsConfig {
  palette?: Record<string, string[]>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  dimensions?: { width: number; height: number };
}

export interface PhysicsSVGRef {
  shockwave: (x?: number, y?: number) => void;
  applyScrollForce: (force: number, direction: number) => void;
  getCanvasBounds: () => DOMRect | null;
  getCanvasDimensions: () => { width: number; height: number };
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

interface CanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cursorStyle: string;
}

const MemoizedCanvas = memo(({ canvasRef, cursorStyle }: CanvasProps) => (
  <canvas
    ref={canvasRef}
    className="h-full w-full"
    style={{
      cursor: cursorStyle,
      ...canvasStyle,
    }}
  />
));

MemoizedCanvas.displayName = "MemoizedCanvas";

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
        initialClockwiseVelocity,
        scrollForceMultiplier,
        scrollVelocityDamping,
        scrollInertiaDecay,
        scrollDirectionInfluence,
        palette = importedPalette,
        containerRef: externalContainerRef,
        canvasRef: externalCanvasRef,
        dimensions,
      },
      ref,
    ) => {
      const internalContainerRef = useRef<HTMLDivElement>(null);
      const internalCanvasRef = useRef<HTMLCanvasElement>(null);
      const containerRef = externalContainerRef || internalContainerRef;
      const canvasRef = externalCanvasRef || internalCanvasRef;
      const workerRef = useRef<Worker | null>(null);
      const dimensionsRef = useRef({ width: 0, height: 0 });
      const bodiesRef = useRef<PhysicsBodyData[]>([]);
      const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
      const renderRequestRef = useRef<number>(0);
      const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

      useImperativeHandle(ref, () => ({
        shockwave: (x?: number, y?: number) => {
          const centerX = x ?? dimensionsRef.current.width / 2;
          const centerY = y ?? dimensionsRef.current.height / 2;

          workerRef.current?.postMessage({
            type: "SHOCKWAVE",
            payload: { x: centerX, y: centerY },
          });
        },
        applyScrollForce: (force: number, direction: number) => {
          workerRef.current?.postMessage({
            type: "SCROLL_FORCE",
            payload: { force, direction },
          });
        },
        getCanvasBounds: () => {
          return canvasRef.current?.getBoundingClientRect() || null;
        },
        getCanvasDimensions: () => {
          return dimensionsRef.current;
        },
      }));

      const renderBodies = useCallback(() => {
        renderRequestRef.current = 0;

        const canvas = canvasRef.current;
        const ctx = canvasContextRef.current;
        if (!canvas || !ctx) return;

        const { width, height } = dimensionsRef.current;
        const bodies = bodiesRef.current;

        ctx.clearRect(0, 0, width, height);

        const isHighBodyCount = bodies.length > 400;
        const padding = 40;

        const visibleBodies = bodies.filter(
          (body) =>
            body.x + body.width / 2 > -padding &&
            body.x - body.width / 2 < width + padding &&
            body.y + body.height / 2 > -padding &&
            body.y - body.height / 2 < height + padding,
        );

        const simplifyThreshold = Math.min(width, height) * 0.015;
        const draggedBodies = visibleBodies.filter((body) => body.isDragged);
        const regularBodies = visibleBodies.filter((body) => !body.isDragged);

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

          if (isHighBodyCount && Math.max(bodyWidth, bodyHeight) < 4) return;

          ctx.save();
          ctx.translate(x, y);

          if (Math.max(bodyWidth, bodyHeight) > simplifyThreshold) {
            ctx.rotate(degreesToRadians(rotation));
          }

          ctx.fillStyle = generateRainbowFromPalette(
            colorIndex,
            bodies.length,
            colorLevel,
            palette,
          );

          const radius = magnitude(bodyWidth, bodyHeight) / 2;

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });

        if (draggedBodies.length > 0) {
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
            ctx.rotate(degreesToRadians(rotation));

            ctx.fillStyle = generateRainbowFromPalette(
              colorIndex,
              bodies.length,
              colorLevel,
              palette,
            );

            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 6;

            const radius = magnitude(bodyWidth, bodyHeight) / 2;

            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          });
        }
      }, [colorLevel, palette]);

      // Mount-only effect for worker initialization
      useEffect(() => {
        let isMounted = true;

        const initializeWorker = async () => {
          if (!isMounted || !canvasRef.current) return;

          const canvas = canvasRef.current;
          canvasContextRef.current = canvas.getContext("2d");

          const worker = new Worker(
            new URL("./physics.worker.ts", import.meta.url),
            { type: "module" },
          );
          workerRef.current = worker;

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

              case "BODY_UPDATE_BUFFER":
                const buffer = payload.buffer;
                const count = payload.count;
                const floatView = new Float32Array(buffer);

                const bodies = [];
                for (let i = 0; i < count; i++) {
                  const offset = i * 8;
                  bodies.push({
                    id: `body-${Math.floor(floatView[offset])}`,
                    x: floatView[offset + 1],
                    y: floatView[offset + 2],
                    rotation: floatView[offset + 3],
                    isDragged: floatView[offset + 4] === 1,
                    width: floatView[offset + 5],
                    height: floatView[offset + 6],
                    colorIndex: Math.floor(floatView[offset + 7]),
                  });
                }

                bodiesRef.current = bodies;
                if (renderRequestRef.current === 0) {
                  renderRequestRef.current =
                    requestAnimationFrame(renderBodies);
                }
                break;

              case "BODY_UPDATE_DELTA":
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

          worker.postMessage({ type: "INIT" });
        };

        initializeWorker();

        return () => {
          isMounted = false;
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
          if (renderRequestRef.current) {
            cancelAnimationFrame(renderRequestRef.current);
          }
          if (workerRef.current) {
            workerRef.current.postMessage({ type: "TERMINATE" });
            workerRef.current.terminate();
            workerRef.current = null;
          }
        };
      }, []);

      // Dimensions effect
      useEffect(() => {
        if (!dimensions || !canvasRef.current || !workerRef.current) return;
        if (dimensions.width === 0 || dimensions.height === 0) return;

        const canvas = canvasRef.current;
        const { width, height } = dimensions;
        const dpr = window.devicePixelRatio || 1;

        dimensionsRef.current = { width, height };
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        if (canvasContextRef.current) {
          canvasContextRef.current.scale(dpr, dpr);
        }

        workerRef.current.postMessage({
          type: "UPDATE_DIMENSIONS",
          payload: { width, height, numBodies },
        });
      }, [dimensions, numBodies]);

      // Settings-only effect
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
              initialClockwiseVelocity,
              scrollForceMultiplier,
              scrollVelocityDamping,
              scrollInertiaDecay,
              scrollDirectionInfluence,
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
        initialClockwiseVelocity,
        scrollForceMultiplier,
        scrollVelocityDamping,
        scrollInertiaDecay,
        scrollDirectionInfluence,
      ]);

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

      return (
        <div
          ref={containerRef}
          className="relative top-1/2 h-[100svh] w-full max-w-full -translate-y-1/2 lg:h-[110svh]"
          style={containerStyle}
        >
          <MemoizedCanvas canvasRef={canvasRef} cursorStyle="default" />
        </div>
      );
    },
  ),
);

PhysicsSVG.displayName = "PhysicsSVG";
