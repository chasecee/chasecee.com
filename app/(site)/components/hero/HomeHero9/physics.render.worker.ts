import { initRapier } from "./rapier-init";
import { MainToWorkerMessage } from "./messages";
import * as WebGL from "./gl";
import { makeSlabs, PhysicsSlabs } from "./struct";
import config from "./physics.config.json";
import type RAPIER_API from "@dimforge/rapier2d";
import { interpolatedColorWheels } from "./palette-rgb";

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// A single meter in the simulation is this many pixels on screen.
const PIXELS_PER_METER = 50;

type PhysicsSettings = typeof config;
type MobileOverrides = DeepPartial<Omit<PhysicsSettings, "mobileOverrides">>;

let rapier: typeof RAPIER_API;

// State
let canvas: OffscreenCanvas | null = null;
let gl: WebGL2RenderingContext | null = null;
let world: import("@dimforge/rapier2d").World;
let slabs: PhysicsSlabs;
let rigidBodies: import("@dimforge/rapier2d").RigidBody[] = [];
let planetBody: import("@dimforge/rapier2d").RigidBody | null = null;
let planetCollider: import("@dimforge/rapier2d").Collider | null = null;

// Add a list for active shockwaves
let shockwaves: { x: number; y: number; force: number; radius: number }[] = [];

// Scroll force state
let scrollForce = 0;
let scrollDirection = 0;

let program: WebGLProgram | null = null;
let projectionMatrix: WebGLUniformLocation | null = null;

let wallColliderHandles: number[] = [];
let vao: WebGLVertexArrayObject | null = null;
let positionsVbo: WebGLBuffer | null = null;
let anglesVbo: WebGLBuffer | null = null;
let radiiVbo: WebGLBuffer | null = null;
let colorsVbo: WebGLBuffer | null = null;

let isRunning = false;
let bodyCount = 0;

// Cached canvas dimensions
let canvasWidth = 0;
let canvasHeight = 0;
let centerX = 0;
let centerY = 0;

let frameCount = 0;
const scratchDir = { x: 0, y: 0 };
const scratchForce = { x: 0, y: 0 };

let lastTime = 0;
let dt = 1 / 60; // Default timestep
let accumulator = 0;
let simulationTime = 0;
let wallsEnabled = false;

// Get the correct settings based on mobile or desktop
function getSettings(isMobile: boolean): PhysicsSettings {
  if (!isMobile) {
    return config;
  }

  const baseConfig = { ...config };
  const mobileOverrides: MobileOverrides = config.mobileOverrides || {};

  // A simple deep merge for one level of nesting
  const mergedConfig = {
    ...baseConfig,
    ...mobileOverrides,
    simulation: { ...baseConfig.simulation, ...mobileOverrides.simulation },
    bodies: { ...baseConfig.bodies, ...mobileOverrides.bodies },
    world: { ...baseConfig.world, ...mobileOverrides.world },
    interactions: {
      ...baseConfig.interactions,
      ...mobileOverrides.interactions,
      shockwave: {
        ...baseConfig.interactions.shockwave,
        ...(mobileOverrides.interactions?.shockwave || {}),
      },
      scroll: {
        ...baseConfig.interactions.scroll,
        ...(mobileOverrides.interactions?.scroll || {}),
      },
    },
    rendering: { ...baseConfig.rendering, ...mobileOverrides.rendering },
  };

  return mergedConfig as PhysicsSettings;
}

function setupWebgl() {
  if (!gl) return;

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const vertexShader = WebGL.createShader(
    gl,
    gl.VERTEX_SHADER,
    WebGL.VERTEX_SHADER_SOURCE,
  );
  const fragmentShader = WebGL.createShader(
    gl,
    gl.FRAGMENT_SHADER,
    WebGL.FRAGMENT_SHADER_SOURCE,
  );

  if (!vertexShader || !fragmentShader) return;
  program = WebGL.createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;

  gl.useProgram(program);
  projectionMatrix = gl.getUniformLocation(program, "u_projection");

  slabs = makeSlabs();

  positionsVbo = WebGL.createVbo(gl, slabs.positions.buffer as ArrayBuffer);
  anglesVbo = WebGL.createVbo(gl, slabs.angles.buffer as ArrayBuffer);
  radiiVbo = WebGL.createVbo(gl, slabs.radii.buffer as ArrayBuffer);
  colorsVbo = WebGL.createVbo(
    gl,
    slabs.colors.buffer as ArrayBuffer,
    gl.STATIC_DRAW,
  );

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const setupAttribute = (
    vbo: WebGLBuffer,
    location: number,
    size: number,
    type: number,
    divisor: number = 1,
    normalized: boolean = false,
  ) => {
    if (!gl) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(location);
    if (type === gl.UNSIGNED_INT) {
      gl.vertexAttribIPointer(location, size, type, 0, 0);
    } else {
      gl.vertexAttribPointer(location, size, type, normalized, 0, 0);
    }
    gl.vertexAttribDivisor(location, divisor);
  };

  const positionLoc = gl.getAttribLocation(program, "a_position");
  const angleLoc = gl.getAttribLocation(program, "a_angle");
  const radiusLoc = gl.getAttribLocation(program, "a_radius");
  const colorLoc = gl.getAttribLocation(program, "a_color");

  if (positionsVbo) setupAttribute(positionsVbo, positionLoc, 2, gl.FLOAT);
  if (anglesVbo) setupAttribute(anglesVbo, angleLoc, 1, gl.FLOAT);
  if (radiiVbo) setupAttribute(radiiVbo, radiusLoc, 1, gl.FLOAT);
  if (colorsVbo)
    setupAttribute(colorsVbo, colorLoc, 4, gl.UNSIGNED_BYTE, 1, true);

  gl.bindVertexArray(null);
}

function createBodies(isMobile: boolean) {
  const settings = getSettings(isMobile);
  bodyCount = settings.bodies.count;
  const baseRadius = settings.bodies.radius;
  const radiusVariance = settings.bodies.radiusVariance;
  const initialClockwiseVelocity = settings.simulation.initialClockwiseVelocity;

  // Use cached dimensions
  const center = { x: centerX, y: centerY };

  // Create invisible center planet (physics only, no visual)
  const planetRadiusPixels =
    settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);
  if (planetRadiusPixels > 0) {
    const planetBodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(
      center.x / PIXELS_PER_METER,
      center.y / PIXELS_PER_METER,
    );
    planetBody = world.createRigidBody(planetBodyDesc);
    const planetColliderDesc = rapier.ColliderDesc.ball(
      planetRadiusPixels / PIXELS_PER_METER,
    )
      .setFriction(5)
      .setRestitution(1); // No bounce
    planetCollider = world.createCollider(planetColliderDesc, planetBody);
  }

  rigidBodies = [];
  console.log("🏗️ Creating Bodies:", {
    placement: settings.bodies.startPlacement,
    bodyCount: bodyCount,
    initialClockwiseVelocity: initialClockwiseVelocity,
    damping: settings.simulation.damping,
    centerPosition: { x: center.x, y: center.y },
  });

  const placement = settings.bodies.startPlacement || "ring";

  if (placement === "grid") {
    const planetRadiusPixels =
      settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);

    const canvasArea = canvasWidth * canvasHeight;
    const circleArea = Math.PI * Math.pow(planetRadiusPixels, 2);
    const usableArea = Math.max(0, canvasArea - circleArea);

    const targetDensity = bodyCount / usableArea;

    const totalPointsInCanvas = Math.ceil(targetDensity * canvasArea);
    const spacing = Math.sqrt(canvasArea / totalPointsInCanvas);
    const cols = Math.floor(canvasWidth / spacing);
    const rows = Math.floor(canvasHeight / spacing);

    let currentBodyIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (currentBodyIndex >= bodyCount) break;

        const x = (col + 0.5) * spacing;
        const y = (row + 0.5) * spacing;

        const dx = x - centerX;
        const dy = y - centerY;
        const distSq = dx * dx + dy * dy;

        if (distSq > planetRadiusPixels * planetRadiusPixels) {
          const angle = Math.atan2(dy, dx) + Math.PI;

          const radiusMultiplier = 1.0 + (Math.random() - 0.5) * radiusVariance;
          const finalRadiusPixels = baseRadius * radiusMultiplier;

          const rigidBodyDesc = rapier.RigidBodyDesc.dynamic()
            .setTranslation(x / PIXELS_PER_METER, y / PIXELS_PER_METER)
            .setLinearDamping(settings.simulation.damping)
            .setCcdEnabled(true);

          const rigidBody = world.createRigidBody(rigidBodyDesc);
          const colliderDesc = rapier.ColliderDesc.ball(
            finalRadiusPixels / PIXELS_PER_METER,
          )
            .setRestitution(settings.bodies.restitution)
            .setFriction(settings.bodies.friction);

          world.createCollider(colliderDesc, rigidBody);
          rigidBodies.push(rigidBody);

          slabs.radii[currentBodyIndex] = finalRadiusPixels;

          const colorLevel = settings.rendering.colorLevel;
          const normalizedPosition = (angle / (Math.PI * 2)) % 1;
          const colorPalette =
            interpolatedColorWheels[
              String(colorLevel) as keyof typeof interpolatedColorWheels
            ] || interpolatedColorWheels[4];
          const colorIndex = Math.floor(
            normalizedPosition * colorPalette.length,
          );

          const { r, g, b } = colorPalette[colorIndex];
          const color = (255 << 24) | (b << 16) | (g << 8) | r;
          slabs.colors[currentBodyIndex] = color;

          currentBodyIndex++;
        }
      }
      if (currentBodyIndex >= bodyCount) break;
    }
    bodyCount = rigidBodies.length;
    console.log(`Grid generation complete. Actual body count: ${bodyCount}`);
  } else {
    // Original ring placement
    for (let i = 0; i < bodyCount; i++) {
      const angle = (i / bodyCount) * Math.PI * 2;

      // Apply startSpread to add randomness to the initial radius
      const spreadMultiplier =
        1.0 + (Math.random() - 0.5) * settings.bodies.startSpread;
      const actualRadius =
        settings.bodies.startRadius *
        spreadMultiplier *
        Math.min(canvasWidth, canvasHeight);

      const x = center.x + Math.cos(angle) * actualRadius;
      const y = center.y + Math.sin(angle) * actualRadius;

      const radiusMultiplier = 1.0 + (Math.random() - 0.5) * radiusVariance;
      const finalRadiusPixels = baseRadius * radiusMultiplier;

      const rigidBodyDesc = rapier.RigidBodyDesc.dynamic()
        .setTranslation(x / PIXELS_PER_METER, y / PIXELS_PER_METER)
        .setLinearDamping(settings.simulation.damping)
        .setCcdEnabled(true);

      // Correct clockwise velocity calculation (from mathUtils.ts)
      const velocityX = -initialClockwiseVelocity * Math.sin(angle);
      const velocityY = initialClockwiseVelocity * Math.cos(angle);
      rigidBodyDesc.setLinvel(velocityX, velocityY);

      // Log first few bodies for debugging
      if (i < 3) {
        console.log(`📍 Body ${i}:`, {
          position: { x: x.toFixed(1), y: y.toFixed(1) },
          velocity: { x: velocityX.toFixed(3), y: velocityY.toFixed(3) },
          angle: ((angle * 180) / Math.PI).toFixed(1) + "°",
          radius: finalRadiusPixels.toFixed(1),
          spreadMultiplier: spreadMultiplier.toFixed(3),
          actualRadius: actualRadius.toFixed(1),
        });
      }

      const rigidBody = world.createRigidBody(rigidBodyDesc);
      const colliderDesc = rapier.ColliderDesc.ball(
        finalRadiusPixels / PIXELS_PER_METER,
      )
        .setRestitution(settings.bodies.restitution)
        .setFriction(settings.bodies.friction);
      // Remove sensor flag - bodies should collide with center planet
      world.createCollider(colliderDesc, rigidBody);
      rigidBodies.push(rigidBody);

      slabs.radii[i] = finalRadiusPixels;

      // Get the pre-computed, interpolated color wheel for the current color level
      const colorLevel = settings.rendering.colorLevel;
      // Map angle to color index (0-6 for 7 colors)
      const normalizedPosition = (angle / (Math.PI * 2)) % 1; // 0-1
      const colorPalette =
        interpolatedColorWheels[
          String(colorLevel) as keyof typeof interpolatedColorWheels
        ] || interpolatedColorWheels[4];
      const colorIndex = Math.floor(normalizedPosition * colorPalette.length);

      const { r, g, b } = colorPalette[colorIndex];

      const color = (255 << 24) | (b << 16) | (g << 8) | r;
      slabs.colors[i] = color;

      // Debug logging for first few bodies
      if (i < 3) {
        console.log(`🎨 Body ${i} color:`, {
          angle: ((angle * 180) / Math.PI).toFixed(1) + "°",
          colorLevel,
          colorIndex,
          rgb: [r, g, b],
        });
      }
    }
  }

  if (gl && radiiVbo && colorsVbo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, radiiVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, slabs.radii);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, slabs.colors);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}

function update(currentTime: number) {
  if (!isRunning || !canvas) return;

  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(update);
    return;
  }

  const frameTime = (currentTime - lastTime) / 1000.0;
  lastTime = currentTime;
  accumulator += Math.min(frameTime, 0.2); // Clamp to avoid death spiral

  frameCount++;

  const settings = getSettings(canvas.width < 768);
  // No need to recalculate these every frame
  const centerXMeters = centerX / PIXELS_PER_METER;
  const centerYMeters = centerY / PIXELS_PER_METER;

  // Apply scroll impulse once per frame
  const normalizedScroll = Math.tanh(scrollForce * 0.01);
  const scrollInfluence =
    normalizedScroll * settings.interactions.scroll.forceMultiplier;
  if (Math.abs(scrollInfluence) > 0.05) {
    const impulseStrength = scrollInfluence * 1.5; // Make it feel more direct

    for (const body of rigidBodies) {
      const vel = body.linvel();
      // Apply a purely vertical impulse. The direction is handled by the sign of impulseStrength.
      body.setLinvel({ x: vel.x, y: vel.y + impulseStrength }, true);
    }
  }

  // Decay scroll force once per frame
  scrollForce *= settings.interactions.scroll.velocityDamping ?? 0.98;

  while (accumulator >= dt) {
    simulationTime += dt;
    if (
      !wallsEnabled &&
      (settings.world.walls?.initiallyDisabled ?? false) &&
      simulationTime >= (settings.world.walls?.enableDelaySeconds ?? 0)
    ) {
      for (const handle of wallColliderHandles) {
        const collider = world.getCollider(handle);
        if (collider) {
          collider.setSensor(false);
        }
      }
      wallsEnabled = true;
      console.log("Walls enabled");
    }

    const planetRadiusPixels =
      settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);
    const planetRadiusMeters = planetRadiusPixels / PIXELS_PER_METER;

    // These are now cached
    // const centerX = canvas.width / 2;
    // const centerY = canvas.height / 2;
    // const centerXMeters = centerX / PIXELS_PER_METER;
    // const centerYMeters = centerY / PIXELS_PER_METER;
    const gravityCoeff = settings.simulation.gravity;

    // Scroll impulses temporarily disabled for stability.

    let maxForce = 0;
    let avgDistance = 0;
    let gravityApplications = 0;

    for (const body of rigidBodies) {
      const mass = body.mass();
      if (mass === 0) continue;

      const pos = body.translation();
      scratchDir.x = centerXMeters - pos.x;
      scratchDir.y = centerYMeters - pos.y;
      const distSq = scratchDir.x * scratchDir.x + scratchDir.y * scratchDir.y;

      if (distSq < 1e-6) continue;

      const dist = Math.sqrt(distSq);

      // Only apply gravity if the body is outside the central planet.
      if (dist > planetRadiusMeters) {
        gravityApplications++;
        // Simple attractive gravity. Damping is handled by Rapier's linearDamping.
        const F_gravity = gravityCoeff * mass;

        scratchForce.x = (scratchDir.x / dist) * F_gravity;
        scratchForce.y = (scratchDir.y / dist) * F_gravity;

        body.addForce(scratchForce, true);

        // --- Tangential drag to counteract scroll-induced orbits ---
        const vel = body.linvel();
        const radialVel = (vel.x * scratchDir.x + vel.y * scratchDir.y) / dist;
        const tangVelX = vel.x - radialVel * (scratchDir.x / dist);
        const tangVelY = vel.y - radialVel * (scratchDir.y / dist);
        const tangentialDamping = settings.simulation.tangentialDamping ?? 1.0;
        const tangDragX = -tangentialDamping * tangVelX * mass;
        const tangDragY = -tangentialDamping * tangVelY * mass;
        body.addForce({ x: tangDragX, y: tangDragY }, true);

        const forceMagnitude = Math.sqrt(
          scratchForce.x * scratchForce.x + scratchForce.y * scratchForce.y,
        );
        maxForce = Math.max(maxForce, forceMagnitude);
      }
      avgDistance += dist;
    }
    world.step();
    accumulator -= dt;
  }

  for (let i = 0; i < bodyCount; i++) {
    const body = rigidBodies[i];
    if (!body) continue;
    const pos = body.translation();
    const rot = body.rotation();
    slabs.positions[i * 2] = pos.x * PIXELS_PER_METER;
    slabs.positions[i * 2 + 1] = pos.y * PIXELS_PER_METER;
    slabs.angles[i] = rot;
  }

  if (gl && positionsVbo && anglesVbo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, slabs.positions);
    gl.bindBuffer(gl.ARRAY_BUFFER, anglesVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, slabs.angles);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  if (gl && program && vao) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.drawArraysInstanced(gl.POINTS, 0, 1, bodyCount);

    gl.bindVertexArray(null);
  }

  requestAnimationFrame(update);
}

function handleShockwave(
  msg: Extract<MainToWorkerMessage, { type: "SHOCKWAVE" }>,
) {
  if (!canvas) return;

  const settingsSW = getSettings(canvas.width < 768);
  const shockConfig = settingsSW.interactions.shockwave;
  const shockRadiusPixels =
    shockConfig.radius * Math.min(canvas.width, canvas.height);
  const shockRadiusMeters = shockRadiusPixels / PIXELS_PER_METER;

  const msgXMeters = msg.x / PIXELS_PER_METER;
  const msgYMeters = msg.y / PIXELS_PER_METER;

  for (const body of rigidBodies) {
    const mass = body.mass();
    if (mass === 0) continue;

    const bodyPos = body.translation();
    const dx = bodyPos.x - msgXMeters;
    const dy = bodyPos.y - msgYMeters;
    const distSq = dx * dx + dy * dy;

    if (distSq < shockRadiusMeters * shockRadiusMeters) {
      const dist = Math.sqrt(distSq);
      const dirX = dist < 1e-6 ? 0 : dx / dist;
      const dirY = dist < 1e-6 ? 0 : dy / dist;

      const falloff = 1 - dist / shockRadiusMeters;
      const baseImpulse = shockConfig.force * falloff;
      const impulse = baseImpulse * mass;

      body.applyImpulse({ x: dirX * impulse, y: dirY * impulse }, true);
    }
  }
}

async function handleInit(msg: Extract<MainToWorkerMessage, { type: "INIT" }>) {
  try {
    canvas = msg.canvas;
    gl = WebGL.createContext(canvas);
    if (!gl) throw new Error("Could not create WebGL2 context");

    rapier = await initRapier();

    const gravity = { x: 0.0, y: 0.0 };
    world = new rapier.World(gravity);

    // Apply custom timestep from config, with safety guards.
    const settingsInit = getSettings(msg.isMobile);
    let dtCfg = settingsInit.simulation.timeStep ?? 60; // Default to 60Hz if not provided
    // Heuristic: if value > 1, assume it's in milliseconds.
    if (dtCfg > 1) {
      dtCfg /= 1000;
    }
    // Clamp to a sane range to prevent instability.
    dt = Math.min(Math.max(dtCfg, 0.001), 0.1);

    world.integrationParameters.dt = dt;
    // Increase position iterations to prevent "squishing".
    // This makes collision response more rigid at a small performance cost.
    (world.integrationParameters as any).maxPositionIterations = 8;
    console.log(`[Worker] Physics timestep set to ${dt} s per step`);
    console.log(
      `[Worker] Position iterations set to ${
        (world.integrationParameters as any).maxPositionIterations
      }`,
    );

    setupWebgl();

    handleResize({ type: "RESIZE", width: msg.width, height: msg.height });

    createBodies(msg.isMobile);

    isRunning = true;
    requestAnimationFrame(update);
    self.postMessage({ type: "INITIALIZED" });
  } catch (e) {
    console.error("[Worker] Failed during initialization:", e);
    // Terminate the worker if init fails
    handleTerminate();
  }
}

function handleResize(msg: Extract<MainToWorkerMessage, { type: "RESIZE" }>) {
  if (!canvas || !gl || !program || !rapier) return;

  // Update cached dimensions
  canvasWidth = msg.width;
  canvasHeight = msg.height;
  centerX = canvasWidth / 2;
  centerY = canvasHeight / 2;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  gl.viewport(0, 0, canvasWidth, canvasHeight);

  const settings = getSettings(msg.width < 768);
  const centerXMeters = centerX / PIXELS_PER_METER;
  const centerYMeters = centerY / PIXELS_PER_METER;

  // Recalculate and update the central planet
  if (planetBody && planetCollider) {
    const planetRadiusPixels =
      settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);
    const planetRadiusMeters = planetRadiusPixels / PIXELS_PER_METER;

    planetBody.setTranslation({ x: centerXMeters, y: centerYMeters }, true);
    planetCollider.setRadius(planetRadiusMeters);

    // After resizing, ensure no bodies are inside the new planet radius
    const planetRadiusMetersSq = planetRadiusMeters * planetRadiusMeters;

    for (const body of rigidBodies) {
      const pos = body.translation();
      const dx = pos.x - centerXMeters;
      const dy = pos.y - centerYMeters;
      const distSq = dx * dx + dy * dy;

      if (distSq < planetRadiusMetersSq) {
        const dist = Math.sqrt(distSq);
        if (dist < 1e-6) {
          // Body is at the center, move it to the edge
          body.setTranslation(
            { x: centerXMeters + planetRadiusMeters + 0.01, y: centerYMeters },
            true,
          );
        } else {
          const overlap = planetRadiusMeters - dist;
          // Push out along the vector from center to body
          const pushOutX = (dx / dist) * (overlap + 0.01);
          const pushOutY = (dy / dist) * (overlap + 0.01);
          body.setTranslation(
            { x: pos.x + pushOutX, y: pos.y + pushOutY },
            true,
          );
        }
      }
    }
  }

  // Remove old walls before creating new ones.
  for (const handle of wallColliderHandles) {
    const collider = world.getCollider(handle);
    // It's possible the collider doens't exist if the world was just created
    if (collider) {
      world.removeCollider(collider, false);
    }
  }
  wallColliderHandles = [];

  const wallThickness = 100.0;

  const wallThicknessMeters = wallThickness / PIXELS_PER_METER;
  const widthMeters = canvasWidth / PIXELS_PER_METER;
  const heightMeters = canvasHeight / PIXELS_PER_METER;

  // Optional perimeter offset – negative values push walls outward,
  // positive pull them inward. Default 0.
  const wallOffset = (settings.world as any).wallOffset ?? 0;
  const offsetXMeters = widthMeters * wallOffset;
  const offsetYMeters = heightMeters * wallOffset;

  // Pre-compute reusable dimensions taking the offset into account
  const leftX = 0 + offsetXMeters;
  const rightX = widthMeters - offsetXMeters;
  const bottomY = 0 + offsetYMeters;
  const topY = heightMeters - offsetYMeters;

  const halfSpanX = (rightX - leftX) / 2 + wallThicknessMeters;
  const halfSpanY = (topY - bottomY) / 2 + wallThicknessMeters;

  const initiallyDisabled = settings.world.walls?.initiallyDisabled ?? false;

  // Top wall
  let wallDesc = rapier.ColliderDesc.cuboid(halfSpanX, wallThicknessMeters / 2)
    .setTranslation((leftX + rightX) / 2, topY + wallThicknessMeters / 2)
    .setFriction(0.1)
    .setSensor(initiallyDisabled)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  // Bottom wall
  wallDesc = rapier.ColliderDesc.cuboid(halfSpanX, wallThicknessMeters / 2)
    .setTranslation((leftX + rightX) / 2, bottomY - wallThicknessMeters / 2)
    .setFriction(0.1)
    .setSensor(initiallyDisabled)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  // Left wall
  wallDesc = rapier.ColliderDesc.cuboid(wallThicknessMeters / 2, halfSpanY)
    .setTranslation(leftX - wallThicknessMeters / 2, (bottomY + topY) / 2)
    .setFriction(0.1)
    .setSensor(initiallyDisabled)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  // Right wall
  wallDesc = rapier.ColliderDesc.cuboid(wallThicknessMeters / 2, halfSpanY)
    .setTranslation(rightX + wallThicknessMeters / 2, (bottomY + topY) / 2)
    .setFriction(0.1)
    .setSensor(initiallyDisabled)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  const left = 0,
    right = canvasWidth,
    bottom = 0,
    top = canvasHeight,
    near = -1,
    far = 1;
  const tx = -((right + left) / (right - left));
  const ty = -((top + bottom) / (top - bottom));
  const tz = -((far + near) / (far - near));
  const projection = [
    2 / (right - left),
    0,
    0,
    0,
    0,
    2 / (top - bottom),
    0,
    0,
    0,
    0,
    -2 / (far - near),
    0,
    tx,
    ty,
    tz,
    1,
  ];
  gl.useProgram(program);
  gl.uniformMatrix4fv(projectionMatrix, false, projection);
}

function handleTerminate() {
  isRunning = false;
  world.free();
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  close();
}

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case "INIT":
        handleInit(msg);
        break;
      case "RESIZE":
        handleResize(msg);
        break;
      case "TERMINATE":
        handleTerminate();
        break;
      case "GET_STATE":
        self.postMessage({
          type: "STATE_UPDATE",
          positions: slabs.positions,
          angles: slabs.angles,
        });
        break;
      case "SHOCKWAVE":
        handleShockwave(msg);
        break;
      case "SCROLL_FORCE":
        scrollForce = msg.force;
        scrollDirection = msg.direction;
        break;
    }
  } catch (e) {
    console.error(`[Worker] Error processing message type ${msg.type}:`, e);
  }
};
