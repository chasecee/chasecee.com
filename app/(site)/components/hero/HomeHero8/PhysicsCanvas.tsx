"use client";
import React, {
  useRef,
  useEffect,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import type { World, Vec2, Body } from "planck";

// Dynamically import planck to avoid SSR issues
const planckPromise = import("planck");

export interface PhysicsCanvasProps {
  gravity: number;
  timeStep: number;
  damping: number;
  friction: number;
  restitution: number;
  onDragStateChange: (isDragging: boolean) => void;
  onHoverStateChange: (isHovering: boolean) => void;
}

export interface PhysicsCanvasRef {
  reset: () => void;
  solve: () => void;
}

export const PhysicsCanvas = memo(
  forwardRef<PhysicsCanvasRef, PhysicsCanvasProps>(
    (
      {
        gravity,
        timeStep,
        damping,
        friction,
        restitution,
        onDragStateChange,
        onHoverStateChange,
      },
      ref,
    ) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const containerRef = useRef<HTMLDivElement>(null);
      const animationRef = useRef<number>();
      const worldRef = useRef<World | null>(null);
      const bodiesRef = useRef<
        {
          body: Body;
          width: number;
          height: number;
          label: string;
          color: string;
        }[]
      >([]);
      const initialPositionsRef = useRef<{ x: number; y: number }[]>([]);
      const mouseJointRef = useRef<any>(null); // MouseJoint is not explicitly typed in planck
      const draggedBodyRef = useRef<Body | null>(null);
      const planckRef = useRef<any>(null);

      const [isDragging, setIsDragging] = useState(false);
      const [isHovering, setIsHovering] = useState(false);

      useEffect(() => {
        onDragStateChange(isDragging);
      }, [isDragging, onDragStateChange]);

      useEffect(() => {
        onHoverStateChange(isHovering);
      }, [isHovering, onHoverStateChange]);

      const resetSimulation = useCallback(() => {
        const planck = planckRef.current;
        if (!worldRef.current || !bodiesRef.current.length || !planck) return;

        bodiesRef.current.forEach((physicsBody, index) => {
          if (initialPositionsRef.current[index]) {
            const { x, y } = initialPositionsRef.current[index];
            physicsBody.body.setPosition(planck.Vec2(x, y));
            physicsBody.body.setLinearVelocity(planck.Vec2(0, 0));
            physicsBody.body.setAngularVelocity(0);
            physicsBody.body.setAngle(0);
            physicsBody.body.setAwake(true);
          }
        });
      }, []);

      const solveLayout = useCallback(() => {
        if (
          !worldRef.current ||
          !bodiesRef.current.length ||
          !planckRef.current
        )
          return;
        const planck = planckRef.current;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const { width, height } = canvas.getBoundingClientRect();
        const scale = Math.min(width / 800, height / 600);
        const targetFillWidth = width * 0.7;
        const xOffset = (width - targetFillWidth) / 2;
        const buttonWidth = (targetFillWidth - 2 * 10 * scale) / 3;
        const buttonHeight = 50 * scale * (2 / 3);
        const spacing = 10 * scale;

        const blockHeights = {
          Header: 40 * scale * (2 / 3),
          Navigation: 35 * scale * (2 / 3),
          Hero: 120 * scale * (2 / 3),
          Button: buttonHeight,
          Footer: 50 * scale * (2 / 3),
        };

        const totalStackHeight =
          blockHeights.Header +
          spacing +
          blockHeights.Navigation +
          spacing +
          blockHeights.Hero +
          spacing +
          blockHeights.Button +
          spacing +
          blockHeights.Footer;

        let currentY = (height - totalStackHeight) / 2;

        const targetPositions = [
          { y: currentY + blockHeights.Header / 2, x: width / 2 }, // Header
          {
            y:
              currentY +
              blockHeights.Header +
              spacing +
              blockHeights.Navigation / 2,
            x: width / 2,
          }, // Nav
          {
            y:
              currentY +
              blockHeights.Header +
              spacing +
              blockHeights.Navigation +
              spacing +
              blockHeights.Hero / 2,
            x: width / 2,
          }, // Hero
          {
            y:
              currentY +
              blockHeights.Header +
              spacing +
              blockHeights.Navigation +
              spacing +
              blockHeights.Hero +
              spacing +
              buttonHeight / 2,
            x: xOffset + buttonWidth / 2,
          }, // Button 1
          {
            y:
              currentY +
              blockHeights.Header +
              spacing +
              blockHeights.Navigation +
              spacing +
              blockHeights.Hero +
              spacing +
              buttonHeight / 2,
            x: xOffset + buttonWidth + 10 * scale + buttonWidth / 2,
          }, // Button 2
          {
            y:
              currentY +
              blockHeights.Header +
              spacing +
              blockHeights.Navigation +
              spacing +
              blockHeights.Hero +
              spacing +
              buttonHeight / 2,
            x: xOffset + 2 * (buttonWidth + 10 * scale) + buttonWidth / 2,
          }, // Button 3
          {
            y:
              currentY +
              blockHeights.Header +
              spacing +
              blockHeights.Navigation +
              spacing +
              blockHeights.Hero +
              spacing +
              buttonHeight +
              spacing +
              blockHeights.Footer / 2,
            x: width / 2,
          }, // Footer
        ];

        const header = bodiesRef.current.find((b) => b.label === "Header");
        const nav = bodiesRef.current.find((b) => b.label === "Navigation");
        const hero = bodiesRef.current.find((b) => b.label === "Hero");
        const buttons = bodiesRef.current.filter((b) => b.label === "Button");
        const footer = bodiesRef.current.find((b) => b.label === "Footer");

        const orderedBodies = [
          header,
          nav,
          hero,
          ...buttons.reverse(),
          footer,
        ].filter(Boolean);

        orderedBodies.forEach((bodyItem, index) => {
          if (bodyItem && targetPositions[index]) {
            const body = bodyItem.body;
            const targetPos = planck.Vec2(
              targetPositions[index].x,
              targetPositions[index].y,
            );
            const currentPos = body.getPosition();
            const velocity = targetPos.sub(currentPos).mul(2.5);
            body.setLinearVelocity(velocity);
            body.setAngularVelocity(0);
          }
        });
      }, []);

      useImperativeHandle(ref, () => ({
        reset: resetSimulation,
        solve: solveLayout,
      }));

      useEffect(() => {
        let isMounted = true;
        let resizeTimeout: NodeJS.Timeout;
        let unregisterPointerEvents: (() => void) | null = null;
        let unregisterResizeObserver: (() => void) | null = null;

        const init = async () => {
          const planck = await planckPromise;
          planckRef.current = planck;
          if (!isMounted || !canvasRef.current || !containerRef.current) return;

          const canvas = canvasRef.current;
          const container = containerRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          let groundBody: Body;

          const updateWorldBoundaries = (width: number, height: number) => {
            if (!worldRef.current) return;
            if (groundBody) {
              worldRef.current.destroyBody(groundBody);
            }

            groundBody = worldRef.current.createBody();
            const wallThickness = 20;

            // Floor
            groundBody.createFixture(
              planck.Box(
                width / 2,
                wallThickness / 2,
                planck.Vec2(width / 2, height),
                0,
              ),
            );
            // Left wall
            groundBody.createFixture(
              planck.Box(
                wallThickness / 2,
                height / 2,
                planck.Vec2(0, height / 2),
                0,
              ),
            );
            // Right wall
            groundBody.createFixture(
              planck.Box(
                wallThickness / 2,
                height / 2,
                planck.Vec2(width, height / 2),
                0,
              ),
            );
          };

          const resizeObserver = new ResizeObserver((entries) => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              if (!entries[0]) return;
              const { width, height } = entries[0].contentRect;

              const dpr = window.devicePixelRatio || 1;
              canvas.width = width * dpr;
              canvas.height = height * dpr;
              canvas.style.width = `${width}px`;
              canvas.style.height = `${height}px`;

              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.scale(dpr, dpr);

              updateWorldBoundaries(width, height);
            }, 100);
          });

          resizeObserver.observe(container);
          unregisterResizeObserver = () => resizeObserver.disconnect();

          const initializePhysics = (width: number, height: number) => {
            if (worldRef.current) {
              for (let b = worldRef.current.getBodyList(); b; b = b.getNext()) {
                worldRef.current.destroyBody(b);
              }
            }

            const world = planck.World({ gravity: planck.Vec2(0, gravity) });
            worldRef.current = world;
            bodiesRef.current = [];
            initialPositionsRef.current = [];

            updateWorldBoundaries(width, height);

            const scale = Math.min(width / 800, height / 600);

            const palette = {
              header: "#1d1d1f",
              nav: "#424245",
              hero: "#007aff",
              button1: "#34c759",
              button2: "#ff3b30",
              button3: "#ff9500",
              footer: "#8e8e93",
            };

            const elements: {
              label: string;
              width: number;
              height: number;
              y: number;
              x: number;
              color: string;
            }[] = [];
            const targetFillWidth = width * 0.7;
            const xOffset = (width - targetFillWidth) / 2;
            const startY = -height * 0.5;

            const buttonWidth = (targetFillWidth - 2 * 10 * scale) / 3;
            const buttonHeight = 50 * scale * (2 / 3);

            const siteLayout = [
              // Row 1: Header
              {
                label: "Header",
                width: targetFillWidth,
                height: 40 * scale * (2 / 3),
                y: startY,
                x: width / 2,
                color: palette.header,
              },
              // Row 2: Navigation
              {
                label: "Navigation",
                width: targetFillWidth * 0.8,
                height: 35 * scale * (2 / 3),
                y: startY - 45 * scale,
                x: width / 2,
                color: palette.nav,
              },
              // Row 3: Hero
              {
                label: "Hero",
                width: targetFillWidth * 0.6,
                height: 120 * scale * (2 / 3),
                y: startY - 85 * scale,
                x: width / 2,
                color: palette.hero,
              },
              // Row 4: Buttons
              {
                label: "Button",
                width: buttonWidth,
                height: buttonHeight,
                y: startY - 180 * scale,
                x: xOffset + buttonWidth / 2,
                color: palette.button1,
              },
              {
                label: "Button",
                width: buttonWidth,
                height: buttonHeight,
                y: startY - 180 * scale,
                x: xOffset + buttonWidth + 10 * scale + buttonWidth / 2,
                color: palette.button2,
              },
              {
                label: "Button",
                width: buttonWidth,
                height: buttonHeight,
                y: startY - 180 * scale,
                x: xOffset + 2 * (buttonWidth + 10 * scale) + buttonWidth / 2,
                color: palette.button3,
              },
              // Row 5: Footer
              {
                label: "Footer",
                width: targetFillWidth,
                height: 50 * scale * (2 / 3),
                y: startY - 230 * scale,
                x: width / 2,
                color: palette.footer,
              },
            ].reverse();

            siteLayout.forEach((el) => {
              elements.push(el);
            });

            elements.forEach((el) => {
              initialPositionsRef.current.push({ x: el.x, y: el.y });
              const body = world.createBody({
                type: "dynamic",
                position: planck.Vec2(el.x, el.y),
                linearDamping: damping,
                angularDamping: damping,
              });
              body.createFixture({
                shape: planck.Box(el.width / 2, el.height / 2),
                density: 0.8,
                friction: friction,
                restitution: restitution,
              });
              bodiesRef.current.push({
                body,
                width: el.width,
                height: el.height,
                label: el.label,
                color: el.color,
              });
            });

            // Pointer interaction logic
            const getPointerPos = (e: PointerEvent) => {
              const rect = canvas.getBoundingClientRect();
              return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              };
            };

            const getBodyAt = (pos: { x: number; y: number }): Body | null => {
              let hitBody: Body | null = null;
              world.queryAABB(
                planck.AABB(
                  planck.Vec2(pos.x - 0.1, pos.y - 0.1),
                  planck.Vec2(pos.x + 0.1, pos.y + 0.1),
                ),
                (fixture) => {
                  const body = fixture.getBody();
                  if (
                    body.isDynamic() &&
                    fixture.testPoint(planck.Vec2(pos.x, pos.y))
                  ) {
                    hitBody = body;
                    return false; // Found a body, stop querying
                  }
                  return true; // Continue
                },
              );
              return hitBody;
            };

            const onPointerDown = (e: PointerEvent) => {
              const pos = getPointerPos(e);
              const body = getBodyAt(pos);
              if (body) {
                e.preventDefault();
                e.stopPropagation();
                canvas.setPointerCapture(e.pointerId);
                body.setAwake(true);
                const joint = planck.MouseJoint({
                  bodyA: groundBody,
                  bodyB: body,
                  target: planck.Vec2(pos.x, pos.y),
                  maxForce: 1000 * body.getMass(),
                });
                mouseJointRef.current = world.createJoint(joint);
                draggedBodyRef.current = body;
                setIsDragging(true);
              }
            };

            const onPointerMove = (e: PointerEvent) => {
              const pos = getPointerPos(e);
              if (mouseJointRef.current) {
                mouseJointRef.current.setTarget(planck.Vec2(pos.x, pos.y));
              }
              const body = getBodyAt(pos);
              setIsHovering(!!body);
            };

            const onPointerUp = (e: PointerEvent) => {
              if (mouseJointRef.current) {
                world.destroyJoint(mouseJointRef.current);
                mouseJointRef.current = null;
              }
              if (draggedBodyRef.current) {
                canvas.releasePointerCapture(e.pointerId);
                draggedBodyRef.current = null;
                setIsDragging(false);
              }
            };

            canvas.addEventListener("pointerdown", onPointerDown);
            canvas.addEventListener("pointermove", onPointerMove);
            canvas.addEventListener("pointerup", onPointerUp);
            canvas.addEventListener("pointercancel", onPointerUp);

            unregisterPointerEvents = () => {
              canvas.removeEventListener("pointerdown", onPointerDown);
              canvas.removeEventListener("pointermove", onPointerMove);
              canvas.removeEventListener("pointerup", onPointerUp);
              canvas.removeEventListener("pointercancel", onPointerUp);
            };

            return () => {
              if (unregisterPointerEvents) unregisterPointerEvents();
              if (worldRef.current) {
                for (
                  let b = worldRef.current.getBodyList();
                  b;
                  b = b.getNext()
                ) {
                  worldRef.current.destroyBody(b);
                }
              }
              worldRef.current = null;
            };
          };

          // Initial setup
          const { width, height } = container.getBoundingClientRect();
          initializePhysics(width, height);

          // Animation loop
          let lastTime = 0;
          const animate = (time: number) => {
            if (!isMounted) return;
            animationRef.current = requestAnimationFrame(animate);
            if (lastTime === 0) {
              lastTime = time;
            }
            const deltaTime = (time - lastTime) / 1000;

            worldRef.current?.step(timeStep);

            const { width, height } = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, width, height);

            bodiesRef.current.forEach(
              ({ body, width, height, label, color }) => {
                const pos = body.getPosition();
                const angle = body.getAngle();

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(angle);

                const isDragged = body === draggedBodyRef.current;
                ctx.fillStyle = isDragged ? `${color}B3` : color;
                ctx.fillRect(-width / 2, -height / 2, width, height);

                ctx.fillStyle = "white";
                ctx.font = `${Math.max(10, 14 * Math.min(width / 800, height / 600))}px -apple-system, BlinkMacSystemFont, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, 0, 0);

                ctx.restore();
              },
            );
            lastTime = time;
          };
          animationRef.current = requestAnimationFrame(animate);
        };

        init();

        return () => {
          isMounted = false;
          clearTimeout(resizeTimeout);
          if (unregisterPointerEvents) unregisterPointerEvents();
          if (unregisterResizeObserver) unregisterResizeObserver();
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        };
      }, [gravity, timeStep, damping, friction, restitution]); // Re-init on physics prop change

      return (
        <div
          ref={containerRef}
          className="aspect-square w-full max-w-full touch-none md:aspect-video"
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none rounded-2xl border border-gray-200 shadow-2xl dark:border-gray-700"
            style={{
              cursor: isDragging ? "grabbing" : isHovering ? "grab" : "default",
            }}
          />
        </div>
      );
    },
  ),
);

PhysicsCanvas.displayName = "PhysicsCanvas";
