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
      const worldRef = useRef<any>(null);
      const animationRef = useRef<number>();
      const bodiesRef = useRef<any[]>([]);
      const mouseJointRef = useRef<any>(null);
      const draggedBodyRef = useRef<any>(null);
      const isDraggingRef = useRef(false);
      const isHoveringRef = useRef(false);
      const frameTimeRef = useRef(0);
      const planckRef = useRef<any>(null);
      const resizeTimeoutRef = useRef<number>();

      const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

      // Memoize callbacks to prevent re-initialization
      const memoizedOnDragStateChange = useCallback(onDragStateChange, []);
      const memoizedOnHoverStateChange = useCallback(onHoverStateChange, []);

      // Mount-only useEffect for physics initialization
      useEffect(() => {
        const initializePhysics = async () => {
          if (!canvasRef.current || !containerRef.current) return;

          const planck = await import("planck");
          planckRef.current = planck;

          const canvas = canvasRef.current;
          const container = containerRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Get container dimensions
          const containerRect = container.getBoundingClientRect();
          const displayWidth = Math.max(600, containerRect.width);
          const displayHeight = Math.max(
            400,
            Math.min(600, containerRect.width * 0.6),
          );

          setDimensions({ width: displayWidth, height: displayHeight });

          // High-DPI support
          const dpr = window.devicePixelRatio || 1;
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          canvas.style.width = displayWidth + "px";
          canvas.style.height = displayHeight + "px";
          ctx.scale(dpr, dpr);

          // Create physics world
          const world = planck.World({ gravity: planck.Vec2(0, gravity) });
          worldRef.current = world;

          const groundBody = world.createBody({ type: "static" });
          const wallThickness = 15;

          // Create boundaries
          const boundaries = [
            {
              pos: [displayWidth / 2, displayHeight - wallThickness / 2],
              size: [displayWidth / 2, wallThickness / 2],
            },
            {
              pos: [wallThickness / 2, displayHeight / 2],
              size: [wallThickness / 2, displayHeight / 2],
            },
            {
              pos: [displayWidth - wallThickness / 2, displayHeight / 2],
              size: [wallThickness / 2, displayHeight / 2],
            },
          ];

          boundaries.forEach(({ pos, size }) => {
            const wall = world.createBody({
              type: "static",
              position: planck.Vec2(pos[0], pos[1]),
            });
            wall.createFixture({
              shape: planck.Box(size[0], size[1]),
              density: 0,
              friction,
            });
          });

          // Website elements with proper responsive sizing
          const scale = Math.min(displayWidth / 800, displayHeight / 600);
          const elements = [
            {
              x: displayWidth * 0.5,
              y: 60 * scale,
              width: 320 * scale,
              height: 32 * scale,
              label: "Header",
              color: "#1d1d1f",
            },
            {
              x: displayWidth * 0.5,
              y: 110 * scale,
              width: 240 * scale,
              height: 28 * scale,
              label: "Navigation",
              color: "#424245",
            },
            {
              x: displayWidth * 0.5,
              y: 180 * scale,
              width: 180 * scale,
              height: 72 * scale,
              label: "Hero",
              color: "#007aff",
            },
            {
              x: displayWidth * 0.425,
              y: 300 * scale,
              width: 60 * scale,
              height: 24 * scale,
              label: "Button",
              color: "#34c759",
            },
            {
              x: displayWidth * 0.5,
              y: 300 * scale,
              width: 60 * scale,
              height: 24 * scale,
              label: "Button",
              color: "#ff3b30",
            },
            {
              x: displayWidth * 0.575,
              y: 300 * scale,
              width: 60 * scale,
              height: 24 * scale,
              label: "Button",
              color: "#ff9500",
            },
            {
              x: displayWidth * 0.5,
              y: 380 * scale,
              width: 280 * scale,
              height: 24 * scale,
              label: "Footer",
              color: "#8e8e93",
            },
          ];

          const bodies = elements.map((element) => {
            const body = world.createBody({
              type: "dynamic",
              position: planck.Vec2(element.x, element.y),
              linearDamping: damping,
              angularDamping: damping,
            });

            body.createFixture({
              shape: planck.Box(element.width / 2, element.height / 2),
              density: 0.8,
              friction,
              restitution,
            });

            return {
              body,
              width: element.width,
              height: element.height,
              label: element.label,
              color: element.color,
            };
          });

          bodiesRef.current = bodies;

          const getMousePos = (e: MouseEvent | Touch) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = displayWidth / rect.width;
            const scaleY = displayHeight / rect.height;
            return {
              x: (e.clientX - rect.left) * scaleX,
              y: (e.clientY - rect.top) * scaleY,
            };
          };

          const getBodyAtMouse = (mousePos: { x: number; y: number }) => {
            let selectedBody: any = null;
            const queryPos = planck.Vec2(mousePos.x, mousePos.y);

            world.queryAABB(
              planck.AABB(
                planck.Vec2(mousePos.x - 1, mousePos.y - 1),
                planck.Vec2(mousePos.x + 1, mousePos.y + 1),
              ),
              (fixture: any) => {
                if (
                  fixture.getBody().getType() === "dynamic" &&
                  fixture.testPoint(queryPos)
                ) {
                  selectedBody = fixture.getBody();
                  return false;
                }
                return true;
              },
            );

            return selectedBody;
          };

          const handlePointerDown = (pos: { x: number; y: number }) => {
            const body = getBodyAtMouse(pos);
            if (!body) return;

            isDraggingRef.current = true;
            draggedBodyRef.current = body;
            memoizedOnDragStateChange(true);

            mouseJointRef.current = world.createJoint(
              planck.MouseJoint({
                bodyA: groundBody,
                bodyB: body,
                target: planck.Vec2(pos.x, pos.y),
                maxForce: 1000 * body.getMass(),
                frequencyHz: 5,
                dampingRatio: 0.7,
              }),
            );

            body.setAwake(true);
          };

          const handlePointerMove = (pos: { x: number; y: number }) => {
            if (mouseJointRef.current) {
              mouseJointRef.current.setTarget(planck.Vec2(pos.x, pos.y));
            } else {
              const hoveredBody = getBodyAtMouse(pos);
              const wasHovering = isHoveringRef.current;
              const isNowHovering = !!hoveredBody;

              if (wasHovering !== isNowHovering) {
                isHoveringRef.current = isNowHovering;
                memoizedOnHoverStateChange(isNowHovering);
              }
            }
          };

          const handlePointerUp = () => {
            if (mouseJointRef.current) {
              world.destroyJoint(mouseJointRef.current);
              mouseJointRef.current = null;
            }

            if (isDraggingRef.current) {
              isDraggingRef.current = false;
              memoizedOnDragStateChange(false);
            }

            if (isHoveringRef.current) {
              isHoveringRef.current = false;
              memoizedOnHoverStateChange(false);
            }

            draggedBodyRef.current = null;
          };

          // Event handlers
          const onMouseDown = (e: MouseEvent) =>
            handlePointerDown(getMousePos(e));
          const onMouseMove = (e: MouseEvent) =>
            handlePointerMove(getMousePos(e));
          const onTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches[0]) handlePointerDown(getMousePos(e.touches[0]));
          };
          const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches[0]) handlePointerMove(getMousePos(e.touches[0]));
          };
          const onTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            handlePointerUp();
          };

          // Add event listeners
          canvas.addEventListener("mousedown", onMouseDown);
          canvas.addEventListener("mousemove", onMouseMove);
          canvas.addEventListener("mouseup", handlePointerUp);
          canvas.addEventListener("mouseleave", handlePointerUp);
          canvas.addEventListener("touchstart", onTouchStart, {
            passive: false,
          });
          canvas.addEventListener("touchmove", onTouchMove, { passive: false });
          canvas.addEventListener("touchend", onTouchEnd, { passive: false });

          // Render loop
          const render = (currentTime: number) => {
            const frameDelta = timeStep * 1000;

            if (currentTime - frameTimeRef.current < frameDelta) {
              animationRef.current = requestAnimationFrame(render);
              return;
            }
            frameTimeRef.current = currentTime;

            ctx.clearRect(0, 0, displayWidth, displayHeight);
            world.step(timeStep);

            bodiesRef.current.forEach(
              ({ body, width, height, label, color }) => {
                const pos = body.getPosition();
                const angle = body.getAngle();
                const isBeingDragged = draggedBodyRef.current === body;
                const isHovered =
                  isHoveringRef.current &&
                  getBodyAtMouse({ x: pos.x, y: pos.y }) === body;

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(angle);

                // Main body - slightly transparent when hovered for visual feedback
                ctx.fillStyle =
                  isHovered && !isBeingDragged ? color + "CC" : color;
                ctx.fillRect(-width / 2, -height / 2, width, height);

                // Subtle shadow/border only when dragging
                if (isBeingDragged) {
                  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
                  ctx.lineWidth = 1;
                  ctx.strokeRect(-width / 2, -height / 2, width, height);
                }

                // Text
                ctx.fillStyle = "white";
                ctx.font = `${Math.max(10, 14 * scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, 0, 0);

                ctx.restore();
              },
            );

            animationRef.current = requestAnimationFrame(render);
          };

          animationRef.current = requestAnimationFrame(render);

          // Store cleanup functions for later use
          const cleanupEventListeners = () => {
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseup", handlePointerUp);
            canvas.removeEventListener("mouseleave", handlePointerUp);
            canvas.removeEventListener("touchstart", onTouchStart);
            canvas.removeEventListener("touchmove", onTouchMove);
            canvas.removeEventListener("touchend", onTouchEnd);
          };

          return cleanupEventListeners;
        };

        // Initialize physics and store cleanup function
        let cleanupEventListeners: (() => void) | undefined;
        initializePhysics().then((cleanup) => {
          cleanupEventListeners = cleanup;
        });

        // Comprehensive cleanup on unmount
        return () => {
          // Cancel animation frame
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
          }

          // Destroy active mouse joint
          if (mouseJointRef.current && worldRef.current) {
            worldRef.current.destroyJoint(mouseJointRef.current);
            mouseJointRef.current = null;
          }

          // Clear all bodies and joints from world
          if (worldRef.current) {
            // Destroy all joints
            for (
              let joint = worldRef.current.getJointList();
              joint;
              joint = joint.getNext()
            ) {
              worldRef.current.destroyJoint(joint);
            }

            // Destroy all bodies
            for (
              let body = worldRef.current.getBodyList();
              body;
              body = body.getNext()
            ) {
              worldRef.current.destroyBody(body);
            }
          }

          // Clean up event listeners
          if (cleanupEventListeners) {
            cleanupEventListeners();
          }

          // Clear refs
          worldRef.current = null;
          bodiesRef.current = [];
          draggedBodyRef.current = null;
          isDraggingRef.current = false;
          isHoveringRef.current = false;

          // Clear resize timeout
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
        };
      }, []); // Empty dependency array - run only on mount

      // Separate useEffect for prop-driven physics updates
      useEffect(() => {
        if (!worldRef.current || !planckRef.current) return;

        const world = worldRef.current;
        const planck = planckRef.current;

        // Update gravity
        world.setGravity(planck.Vec2(0, gravity));

        // Update body properties
        bodiesRef.current.forEach(({ body }) => {
          body.setLinearDamping(damping);
          body.setAngularDamping(damping);

          for (
            let fixture = body.getFixtureList();
            fixture;
            fixture = fixture.getNext()
          ) {
            fixture.setFriction(friction);
            fixture.setRestitution(restitution);
          }
        });
      }, [gravity, damping, friction, restitution]);

      // Debounced window resize handler - only adjust dimensions, don't rebuild world
      useEffect(() => {
        const handleResize = () => {
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          resizeTimeoutRef.current = window.setTimeout(() => {
            if (!canvasRef.current || !containerRef.current) return;

            const canvas = canvasRef.current;
            const container = containerRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Update canvas dimensions only
            const containerRect = container.getBoundingClientRect();
            const displayWidth = Math.max(600, containerRect.width);
            const displayHeight = Math.max(
              400,
              Math.min(600, containerRect.width * 0.6),
            );

            setDimensions({ width: displayWidth, height: displayHeight });

            // Update canvas sizing
            const dpr = window.devicePixelRatio || 1;
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
            canvas.style.width = displayWidth + "px";
            canvas.style.height = displayHeight + "px";
            ctx.scale(dpr, dpr);
          }, 250); // 250ms debounce
        };

        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("resize", handleResize);
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }
        };
      }, []);

      const resetSimulation = useCallback(() => {
        if (
          !worldRef.current ||
          !bodiesRef.current.length ||
          !planckRef.current
        )
          return;

        const planck = planckRef.current;
        const scale = Math.min(dimensions.width / 800, dimensions.height / 600);

        const positions = [
          { x: dimensions.width * 0.5, y: 60 * scale },
          { x: dimensions.width * 0.5, y: 110 * scale },
          { x: dimensions.width * 0.5, y: 180 * scale },
          { x: dimensions.width * 0.425, y: 300 * scale },
          { x: dimensions.width * 0.5, y: 300 * scale },
          { x: dimensions.width * 0.575, y: 300 * scale },
          { x: dimensions.width * 0.5, y: 380 * scale },
        ];

        bodiesRef.current.forEach((physicsBody, index) => {
          if (positions[index]) {
            const { x, y } = positions[index];
            physicsBody.body.setPosition(planck.Vec2(x, y));
            physicsBody.body.setLinearVelocity(planck.Vec2(0, 0));
            physicsBody.body.setAngularVelocity(0);
            physicsBody.body.setAngle(0);
          }
        });
      }, [dimensions]);

      useImperativeHandle(ref, () => ({
        reset: resetSimulation,
      }));

      return (
        <div
          ref={containerRef}
          className="flex w-full justify-center"
          style={{ minHeight: "400px" }}
        >
          <canvas
            ref={canvasRef}
            className="rounded-2xl border border-gray-200 shadow-2xl dark:border-gray-700"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              maxWidth: "100%",
              cursor: isDraggingRef.current
                ? "grabbing"
                : isHoveringRef.current
                  ? "grab"
                  : "default",
            }}
          />
        </div>
      );
    },
  ),
);

PhysicsCanvas.displayName = "PhysicsCanvas";
