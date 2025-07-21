import { initRapier } from "./rapier-init";
import { MainToWorkerMessage } from "./messages";
import * as WebGL from "./gl";
import {
  makeSlabs,
  PhysicsSlabs,
  MAX_BODIES,
  BYTES_PER_VERTEX,
} from "./struct";
import config from "./physics.config.json";
import type RAPIER_API from "@dimforge/rapier2d";
import { keyColorLevels } from "./palette";
import { parseHsla, hslToRgb, lerpColor } from "../../../utils/color";

const BYTES_PER_COLOR = 3;
// Hue-dependent friction scaling factor (0 disables the effect)
const COLOR_FRICTION_MULTIPLIER = 0;
// Attractive force pulling bodies toward their hue group's centroid.
// Tune from 0 (disabled) to ~0.05 for noticeable effect without instability.
const COLOR_CLUSTER_FORCE = 0.015;
// Angular force coefficient to align bodies of same hue along circumference.
const ANGULAR_CLUSTER_FORCE = 0.01;
let activeSettings: PhysicsSettings;

const paletteCache = new Map<string, Uint8Array>();

function hslToRgbObj(h: number, s: number, l: number) {
  const [r, g, b] = hslToRgb(h, s, l);
  return { r, g, b } as const;
}

function buildPalette(level: number, steps: number): Uint8Array {
  const cacheKey = `${level}|${steps}`;
  const existing = paletteCache.get(cacheKey);
  if (existing) return existing;

  const keyHsla =
    keyColorLevels[level as keyof typeof keyColorLevels] ?? keyColorLevels[4];
  if (!keyHsla) throw new Error(`Missing palette level ${level}`);

  const keyRgb = keyHsla.map((hsla) => {
    const { h, s, l } = parseHsla(hsla);
    return hslToRgbObj(h, s, l);
  });

  const lut = new Uint8Array(steps * BYTES_PER_COLOR);
  for (let i = 0; i < steps; i++) {
    const pos = i / steps;
    const scaled = pos * keyRgb.length;
    const from = Math.floor(scaled) % keyRgb.length;
    const to = (from + 1) % keyRgb.length;
    const f = scaled - Math.floor(scaled);
    const { r, g, b } = lerpColor(keyRgb[from], keyRgb[to], f);
    const base = i * BYTES_PER_COLOR;
    lut[base] = r;
    lut[base + 1] = g;
    lut[base + 2] = b;
  }
  paletteCache.set(cacheKey, lut);
  return lut;
}

function getPaletteColor(level: number, normPos: number, steps: number) {
  const lut = buildPalette(level, steps);
  const idx = Math.floor(normPos * steps) * BYTES_PER_COLOR;
  return { r: lut[idx], g: lut[idx + 1], b: lut[idx + 2] } as const;
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

const PIXELS_PER_METER = 50;
const INV_PIXELS_PER_METER = 1 / PIXELS_PER_METER;

type PhysicsSettings = typeof config;
type MobileOverrides = DeepPartial<Omit<PhysicsSettings, "mobileOverrides">>;

let rapier: typeof RAPIER_API;

let canvas: OffscreenCanvas | null = null;
let gl: WebGL2RenderingContext | null = null;
let world: import("@dimforge/rapier2d").World;
let slabs: PhysicsSlabs;
let rigidBodies: import("@dimforge/rapier2d").RigidBody[] = [];
let planetBody: import("@dimforge/rapier2d").RigidBody | null = null;
let planetCollider: import("@dimforge/rapier2d").Collider | null = null;

let scrollForce = 0;

let program: WebGLProgram | null = null;
let projectionMatrix: WebGLUniformLocation | null = null;
let shapeSidesUniform: WebGLUniformLocation | null = null;

let wallColliderHandles: number[] = [];
let vao: WebGLVertexArrayObject | null = null;
let interleavedVbo: WebGLBuffer | null = null;
let cornerVbo: WebGLBuffer | null = null;
let interleavedBuffer: ArrayBuffer;
let interleavedFloat32: Float32Array;
let interleavedUint8: Uint8Array;
let interleavedSlice: Uint8Array | null = null;

let isRunning = false;
let isPaused = false;
let bodyCount = 0;

let canvasWidth = 0;
let canvasHeight = 0;
let centerX = 0;
let centerY = 0;

let frameCount = 0;
const scratchDir = { x: 0, y: 0 };
const scratchForce = { x: 0, y: 0 };
const tmpLinvel = { x: 0, y: 0 };

let lastTime = 0;
let dt = 1 / 60;
let accumulator = 0;

// Per-body hue group id (0..steps-1) – length mirrors rigidBodies.
let colorGroups: Uint16Array = new Uint16Array(MAX_BODIES);

// Group aggregates for angular clustering.
let sumSin: Float32Array | null = null;
let sumCos: Float32Array | null = null;
let groupCounts: Uint32Array | null = null;

function getSettings(isMobile: boolean): PhysicsSettings {
  if (!isMobile) {
    return config;
  }

  const baseConfig = { ...config };
  const mobileOverrides: MobileOverrides = config.mobileOverrides || {};

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
    WebGL.QUAD_VERTEX_SHADER_SOURCE,
  );
  const fragmentShader = WebGL.createShader(
    gl,
    gl.FRAGMENT_SHADER,
    WebGL.QUAD_FRAGMENT_SHADER_SOURCE,
  );

  if (!vertexShader || !fragmentShader) return;
  program = WebGL.createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;

  gl.useProgram(program);
  projectionMatrix = gl.getUniformLocation(program, "u_projection");
  shapeSidesUniform = gl.getUniformLocation(program, "u_sides");
  if (shapeSidesUniform) {
    const sidesVal = activeSettings?.rendering?.shapeSides ?? 0;
    gl.uniform1i(shapeSidesUniform, sidesVal);
  }

  slabs = makeSlabs();

  interleavedBuffer = new ArrayBuffer(MAX_BODIES * BYTES_PER_VERTEX);
  interleavedFloat32 = new Float32Array(interleavedBuffer);
  interleavedUint8 = new Uint8Array(interleavedBuffer);

  interleavedVbo = WebGL.createVbo(gl, interleavedBuffer, gl.STREAM_DRAW);

  const cornerData = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
  cornerVbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerVbo);
  gl.bufferData(gl.ARRAY_BUFFER, cornerData, gl.STATIC_DRAW);

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, cornerVbo);
  const cornerLoc = gl.getAttribLocation(program, "a_corner");
  gl.enableVertexAttribArray(cornerLoc);
  gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);

  const positionLoc = gl.getAttribLocation(program, "a_position");
  const angleLoc = gl.getAttribLocation(program, "a_angle");
  const radiusLoc = gl.getAttribLocation(program, "a_radius");
  const colorLoc = gl.getAttribLocation(program, "a_color");

  const stride = BYTES_PER_VERTEX;

  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
  gl.vertexAttribDivisor(positionLoc, 1);

  gl.enableVertexAttribArray(angleLoc);
  gl.vertexAttribPointer(angleLoc, 1, gl.FLOAT, false, stride, 8);
  gl.vertexAttribDivisor(angleLoc, 1);

  gl.enableVertexAttribArray(radiusLoc);
  gl.vertexAttribPointer(radiusLoc, 1, gl.FLOAT, false, stride, 12);
  gl.vertexAttribDivisor(radiusLoc, 1);

  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, stride, 16);
  gl.vertexAttribDivisor(colorLoc, 1);

  gl.bindVertexArray(null);
}

function createBodies(settings: PhysicsSettings) {
  bodyCount = settings.bodies.count;
  const baseRadius = settings.bodies.radius;
  const radiusVariance = settings.bodies.radiusVariance;
  const initialClockwiseVelocity = settings.simulation.initialClockwiseVelocity;

  const center = { x: centerX, y: centerY };

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
      .setFriction(0.05)
      .setRestitution(0.01);
    planetCollider = world.createCollider(planetColliderDesc, planetBody);
  }

  rigidBodies.length = 0;

  const startRadiusPixels =
    settings.bodies.startRadius * Math.min(canvasWidth, canvasHeight);

  const canvasArea = canvasWidth * canvasHeight;
  const circleArea = Math.PI * Math.pow(startRadiusPixels, 2);
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

      if (distSq > startRadiusPixels * startRadiusPixels) {
        const angle = Math.atan2(dy, dx) + Math.PI;

        const normalizedPosition = (angle / (Math.PI * 2)) % 1;
        const hueSimilarity = 1 - Math.abs(normalizedPosition - 0.5) * 2;
        const frictionCoeff =
          settings.bodies.friction *
          (1 + hueSimilarity * COLOR_FRICTION_MULTIPLIER);

        const radiusMultiplier = 1.0 + (Math.random() - 0.5) * radiusVariance;
        const finalRadiusPixels = baseRadius * radiusMultiplier;

        const rigidBodyDesc = rapier.RigidBodyDesc.dynamic()
          .setTranslation(x / PIXELS_PER_METER, y / PIXELS_PER_METER)
          .setLinearDamping(settings.simulation.damping)
          .setAngularDamping(
            (settings.simulation as any).angularDamping ??
              settings.simulation.damping,
          )
          .setCanSleep(true);

        const rigidBody = world.createRigidBody(rigidBodyDesc);
        // Build collider shape: circle (0) or regular polygon (3-8 sides)
        const shapeSides = settings.rendering.shapeSides ?? 0;
        let colliderDesc: import("@dimforge/rapier2d").ColliderDesc;
        const radiusMeters = finalRadiusPixels / PIXELS_PER_METER;

        if (shapeSides >= 3) {
          // Generate regular polygon vertices around the origin in local space.
          const verts = new Float32Array(shapeSides * 2);
          for (let s = 0; s < shapeSides; s++) {
            const ang = (s * Math.PI * 2) / shapeSides;
            verts[s * 2] = Math.cos(ang) * radiusMeters;
            verts[s * 2 + 1] = Math.sin(ang) * radiusMeters;
          }
          // Attempt to create convex hull collider; fallback to circle if it fails.
          const maybeHull = rapier.ColliderDesc.convexHull(verts);
          colliderDesc = maybeHull ?? rapier.ColliderDesc.ball(radiusMeters);
        } else {
          // Default: circle collider.
          colliderDesc = rapier.ColliderDesc.ball(radiusMeters);
        }

        colliderDesc = colliderDesc
          .setRestitution(settings.bodies.restitution)
          .setFriction(frictionCoeff);

        world.createCollider(colliderDesc, rigidBody);

        if (initialClockwiseVelocity !== 0) {
          const distance = Math.sqrt(distSq);
          if (distance > 0) {
            const tangentialVelX = (dy / distance) * initialClockwiseVelocity;
            const tangentialVelY = (-dx / distance) * initialClockwiseVelocity;
            rigidBody.setLinvel({ x: tangentialVelX, y: tangentialVelY }, true);
          }
        }

        rigidBodies.push(rigidBody);

        slabs.radii[currentBodyIndex] = finalRadiusPixels;
        slabs.positions[currentBodyIndex * 2] = x;
        slabs.positions[currentBodyIndex * 2 + 1] = y;
        slabs.angles[currentBodyIndex] = 0;

        const colorLevel = settings.rendering.colorLevel;
        const steps = settings.rendering.colorSteps ?? 1024;
        const { r, g, b } = getPaletteColor(
          colorLevel,
          normalizedPosition,
          steps,
        );
        const groupIdx = Math.floor(normalizedPosition * steps) % steps;
        colorGroups[currentBodyIndex] = groupIdx;

        const color = (255 << 24) | (b << 16) | (g << 8) | r;
        slabs.colors[currentBodyIndex] = color;

        if (interleavedBuffer) {
          const baseByte = currentBodyIndex * BYTES_PER_VERTEX;
          const baseFloat = baseByte >> 2;

          interleavedFloat32[baseFloat] = x;
          interleavedFloat32[baseFloat + 1] = y;
          interleavedFloat32[baseFloat + 2] = 0;
          interleavedFloat32[baseFloat + 3] = finalRadiusPixels;
          interleavedUint8[baseByte + 16] = color & 0xff;
          interleavedUint8[baseByte + 17] = (color >> 8) & 0xff;
          interleavedUint8[baseByte + 18] = (color >> 16) & 0xff;
          interleavedUint8[baseByte + 19] = (color >> 24) & 0xff;
        }

        currentBodyIndex++;
      }
    }
    if (currentBodyIndex >= bodyCount) break;
  }

  bodyCount = rigidBodies.length;

  if (gl && interleavedVbo) {
    if (
      !interleavedSlice ||
      interleavedSlice.length !== bodyCount * BYTES_PER_VERTEX
    ) {
      interleavedSlice = new Uint8Array(
        interleavedUint8.buffer,
        0,
        bodyCount * BYTES_PER_VERTEX,
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, interleavedSlice);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}

function update(currentTime: number) {
  const frameStart = performance.now();
  let simEnd = frameStart; // will update later

  if (!isRunning || !canvas) return;

  if (isPaused) {
    requestAnimationFrame(update);
    return;
  }

  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(update);
    return;
  }

  const frameTime = (currentTime - lastTime) / 1000.0;
  lastTime = currentTime;
  accumulator += Math.min(frameTime, 0.2);
  const MAX_ACCUMULATED_STEPS = 5;
  if (accumulator > dt * MAX_ACCUMULATED_STEPS) {
    accumulator = dt * MAX_ACCUMULATED_STEPS;
  }

  frameCount++;

  const settings = activeSettings;
  const centerXMeters = centerX * INV_PIXELS_PER_METER;
  const centerYMeters = centerY * INV_PIXELS_PER_METER;

  const normalizedScroll = Math.tanh(scrollForce * 0.005);
  const scrollInfluence =
    normalizedScroll * settings.interactions.scroll.forceMultiplier;
  if (Math.abs(scrollInfluence) > 0.05) {
    const impulseStrength = scrollInfluence * 2.5;

    for (const body of rigidBodies) {
      const vel = body.linvel();
      tmpLinvel.x = vel.x;
      tmpLinvel.y = vel.y + impulseStrength;
      body.setLinvel(tmpLinvel, true);
    }
  }

  scrollForce *= settings.interactions.scroll.velocityDamping ?? 0.98;

  let stepCount = 0;
  const simStart = performance.now();
  while (accumulator >= dt && stepCount < 5) {
    // --------------------------------------------------------------------
    // COLOR-BASED GROUPING FORCE (single pass O(N))
    // --------------------------------------------------------------------
    const steps = settings.rendering.colorSteps ?? 1024;
    if (
      !sumSin ||
      sumSin.length !== steps ||
      !sumCos ||
      !groupCounts ||
      groupCounts.length !== steps
    ) {
      sumSin = new Float32Array(steps);
      sumCos = new Float32Array(steps);
      groupCounts = new Uint32Array(steps);
    }

    sumSin.fill(0);
    sumCos.fill(0);
    groupCounts.fill(0);

    // Aggregate angle sines and cosines.
    for (let i = 0; i < bodyCount; i++) {
      const body = rigidBodies[i];
      if (!body) continue;
      const pos = body.translation();
      const dx = pos.x - centerXMeters;
      const dy = pos.y - centerYMeters;
      const angle = Math.atan2(dy, dx);
      const gIdx = colorGroups[i];
      sumSin[gIdx] += Math.sin(angle);
      sumCos[gIdx] += Math.cos(angle);
      groupCounts[gIdx] += 1;
    }

    // Compute mean angle per group.
    if (ANGULAR_CLUSTER_FORCE > 0) {
      for (let i = 0; i < bodyCount; i++) {
        const body = rigidBodies[i];
        if (!body) continue;
        const gIdx = colorGroups[i];
        const cnt = groupCounts[gIdx];
        if (cnt <= 1) continue;

        // Mean angle of group.
        const meanAng = Math.atan2(sumSin[gIdx], sumCos[gIdx]);

        const pos = body.translation();
        const dx = pos.x - centerXMeters;
        const dy = pos.y - centerYMeters;
        let ang = Math.atan2(dy, dx);

        // Smallest angle difference in [-π, π].
        let diffAng = meanAng - ang;
        if (diffAng > Math.PI) diffAng -= Math.PI * 2;
        if (diffAng < -Math.PI) diffAng += Math.PI * 2;

        const radius = Math.sqrt(dx * dx + dy * dy);
        if (radius < 1e-3) continue;

        // Tangential direction (perpendicular to radial).
        const tanX = -dy / radius;
        const tanY = dx / radius;

        // Force magnitude scales with angular difference and radius.
        const mass = body.mass();
        const F = diffAng * ANGULAR_CLUSTER_FORCE * mass * 0.5;
        scratchForce.x = tanX * F;
        scratchForce.y = tanY * F;
        body.addForce(scratchForce, true);
      }
    }

    const planetRadiusPixels =
      settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);
    const planetRadiusMeters = planetRadiusPixels * INV_PIXELS_PER_METER;

    const gravityCoeff = settings.simulation.gravity;

    for (const body of rigidBodies) {
      const mass = body.mass();
      if (mass === 0) continue;

      const pos = body.translation();
      scratchDir.x = centerXMeters - pos.x;
      scratchDir.y = centerYMeters - pos.y;
      const distSq = scratchDir.x * scratchDir.x + scratchDir.y * scratchDir.y;

      if (distSq < 1e-6) continue;

      const invDist = 1 / Math.sqrt(distSq);
      const dist = 1 / invDist;
      // Scale gravity so it is zero at the planet surface, eliminating infinite
      // potential-energy build-up when bodies are resting against the planet.
      const radialDist = dist - planetRadiusMeters;
      if (radialDist > 0) {
        const pullScale = Math.min(radialDist / planetRadiusMeters, 1);
        const easeExp = (settings.simulation as any).gravityEase ?? 1;
        const scaledPull =
          easeExp === 1 ? pullScale : Math.pow(pullScale, easeExp);
        const F_gravity = gravityCoeff * mass * scaledPull;

        const coeff = invDist * F_gravity;
        scratchForce.x = scratchDir.x * coeff;
        scratchForce.y = scratchDir.y * coeff;

        body.addForce(scratchForce, true);

        const vel = body.linvel();
        const radialVel =
          (vel.x * scratchDir.x + vel.y * scratchDir.y) * invDist;
        const tangVelX = vel.x - radialVel * scratchDir.x * invDist;
        const tangVelY = vel.y - radialVel * scratchDir.y * invDist;
        const tangentialDamping = settings.simulation.tangentialDamping ?? 1.0;
        const tangDragX = -tangentialDamping * tangVelX * mass;
        const tangDragY = -tangentialDamping * tangVelY * mass;
        body.addForce({ x: tangDragX, y: tangDragY }, true);

        const radialDamping = settings.simulation.radialDamping ?? 0.06;
        const radialDrag = -radialDamping * radialVel * mass;
        const radialDragX = radialDrag * scratchDir.x * invDist;
        const radialDragY = radialDrag * scratchDir.y * invDist;
        body.addForce({ x: radialDragX, y: radialDragY }, true);
      }
    }
    world.step();
    // Clamp linear speed to prevent excessive energy build-up.
    const maxSpeedCfg = (activeSettings?.simulation as any).maxSpeed;
    if (typeof maxSpeedCfg === "number" && maxSpeedCfg > 0) {
      const maxSpeedSq = maxSpeedCfg * maxSpeedCfg;
      for (const body of rigidBodies) {
        const v = body.linvel();
        const speedSq = v.x * v.x + v.y * v.y;
        if (speedSq > maxSpeedSq) {
          const scale = maxSpeedCfg / Math.sqrt(speedSq);
          body.setLinvel({ x: v.x * scale, y: v.y * scale }, true);
        }
      }
    }
    accumulator -= dt;
    stepCount++;
  }
  simEnd = performance.now();

  for (let i = 0; i < bodyCount; i++) {
    const body = rigidBodies[i];
    if (!body) continue;
    const pos = body.translation();
    const rot = body.rotation();
    slabs.positions[i * 2] = pos.x * PIXELS_PER_METER;
    slabs.positions[i * 2 + 1] = pos.y * PIXELS_PER_METER;
    slabs.angles[i] = rot;

    const baseByte = i * BYTES_PER_VERTEX;
    const baseFloat = baseByte >> 2;
    interleavedFloat32[baseFloat] = slabs.positions[i * 2];
    interleavedFloat32[baseFloat + 1] = slabs.positions[i * 2 + 1];
    interleavedFloat32[baseFloat + 2] = rot;

    interleavedUint8[baseByte + 19] = 255;
  }

  if (gl && interleavedVbo) {
    if (
      !interleavedSlice ||
      interleavedSlice.length !== bodyCount * BYTES_PER_VERTEX
    ) {
      interleavedSlice = new Uint8Array(
        interleavedUint8.buffer,
        0,
        bodyCount * BYTES_PER_VERTEX,
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, interleavedSlice);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  const drawStart = performance.now();
  if (gl && program && vao) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, bodyCount);

    gl.bindVertexArray(null);
  }

  const drawEnd = performance.now();

  const simulationTime = simEnd - simStart; // ms
  const renderTime = drawEnd - drawStart; // ms
  const totalTime = drawEnd - frameStart; // ms
  const fpsCalc = frameTime > 0 ? 1 / frameTime : 0;
  const calcsPerSec = frameTime > 0 ? (bodyCount * stepCount) / frameTime : 0;

  self.postMessage({
    type: "METRICS",
    simulationTime,
    renderTime,
    totalTime,
    fps: fpsCalc,
    calcsPerSec,
  });

  requestAnimationFrame(update);
}

function handleShockwave(
  msg: Extract<MainToWorkerMessage, { type: "SHOCKWAVE" }>,
) {
  if (!canvas) return;

  const settingsSW = activeSettings;
  const shockConfig = settingsSW.interactions.shockwave;
  const strengthMul = msg.strength ?? 1;
  const shockRadiusPixels =
    shockConfig.radius * Math.min(canvas.width, canvas.height);
  const shockRadiusMeters = shockRadiusPixels * INV_PIXELS_PER_METER;

  const msgXMeters = msg.x * INV_PIXELS_PER_METER;
  const msgYMeters = msg.y * INV_PIXELS_PER_METER;

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
      const baseImpulse = shockConfig.force * falloff * strengthMul;
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

    let settingsInit = getSettings(msg.isMobile);
    if (typeof msg.colorLevel === "number") {
      settingsInit = {
        ...settingsInit,
        rendering: {
          ...settingsInit.rendering,
          colorLevel: msg.colorLevel,
        },
      } as PhysicsSettings;
    }
    activeSettings = settingsInit;
    let dtCfg = settingsInit.simulation.timeStep ?? 60;
    if (dtCfg > 1) {
      dtCfg /= 1000;
    }
    dt = Math.min(Math.max(dtCfg, 0.001), 0.1);

    world.integrationParameters.dt = dt;
    const ip = world.integrationParameters as any;
    ip.allowedLinearError = 0.05;
    ip.maxPenetrationCorrection = 0.05;
    ip.maxPositionIterations = 8;
    ip.maxVelocityIterations = 8;

    setupWebgl();

    handleResize({ type: "RESIZE", width: msg.width, height: msg.height });

    createBodies(settingsInit);

    isRunning = true;
    requestAnimationFrame(update);
    self.postMessage({ type: "INITIALIZED" });
  } catch (e) {
    handleTerminate();
  }
}

function handleResize(msg: Extract<MainToWorkerMessage, { type: "RESIZE" }>) {
  if (!canvas || !gl || !program || !rapier) return;

  canvasWidth = msg.width;
  canvasHeight = msg.height;
  centerX = canvasWidth / 2;
  centerY = canvasHeight / 2;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  gl.viewport(0, 0, canvasWidth, canvasHeight);

  const nextSettings = getSettings(msg.width < 768);
  activeSettings = {
    ...nextSettings,
    rendering: {
      ...nextSettings.rendering,
      colorLevel:
        activeSettings?.rendering.colorLevel ??
        nextSettings.rendering.colorLevel,
    },
  } as PhysicsSettings;
  const settings = activeSettings;
  const centerXMeters = centerX * INV_PIXELS_PER_METER;
  const centerYMeters = centerY * INV_PIXELS_PER_METER;

  if (planetBody && planetCollider) {
    const planetRadiusPixels =
      settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);
    const planetRadiusMeters = planetRadiusPixels * INV_PIXELS_PER_METER;

    planetBody.setTranslation({ x: centerXMeters, y: centerYMeters }, true);
    planetCollider.setRadius(planetRadiusMeters);

    const planetRadiusMetersSq = planetRadiusMeters * planetRadiusMeters;

    for (const body of rigidBodies) {
      const pos = body.translation();
      const dx = pos.x - centerXMeters;
      const dy = pos.y - centerYMeters;
      const distSq = dx * dx + dy * dy;

      if (distSq < planetRadiusMetersSq) {
        const dist = Math.sqrt(distSq);
        if (dist < 1e-6) {
          body.setTranslation(
            { x: centerXMeters + planetRadiusMeters + 0.01, y: centerYMeters },
            true,
          );
        } else {
          const overlap = planetRadiusMeters - dist;
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

  for (const handle of wallColliderHandles) {
    const collider = world.getCollider(handle);
    if (collider) {
      world.removeCollider(collider, false);
    }
  }
  wallColliderHandles = [];

  const wallThicknessPx = (settings.world as any).wallThickness ?? 100.0;
  const wallThicknessMeters = wallThicknessPx * INV_PIXELS_PER_METER;
  const widthMeters = canvasWidth * INV_PIXELS_PER_METER;
  const heightMeters = canvasHeight * INV_PIXELS_PER_METER;

  const wallOffset = (settings.world as any).wallOffset ?? 0;
  const offsetXMeters = widthMeters * wallOffset;
  const offsetYMeters = heightMeters * wallOffset;

  const leftX = 0 + offsetXMeters;
  const rightX = widthMeters - offsetXMeters;
  const bottomY = 0 + offsetYMeters;
  const topY = heightMeters - offsetYMeters;

  const halfSpanX = (rightX - leftX) / 2 + wallThicknessMeters;
  const halfSpanY = (topY - bottomY) / 2 + wallThicknessMeters;

  let wallDesc = rapier.ColliderDesc.cuboid(halfSpanX, wallThicknessMeters / 2)
    .setTranslation((leftX + rightX) / 2, topY + wallThicknessMeters / 2)
    .setFriction(0.1)
    .setSensor(false)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  wallDesc = rapier.ColliderDesc.cuboid(halfSpanX, wallThicknessMeters / 2)
    .setTranslation((leftX + rightX) / 2, bottomY - wallThicknessMeters / 2)
    .setFriction(0.1)
    .setSensor(false)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  wallDesc = rapier.ColliderDesc.cuboid(wallThicknessMeters / 2, halfSpanY)
    .setTranslation(leftX - wallThicknessMeters / 2, (bottomY + topY) / 2)
    .setFriction(0.1)
    .setSensor(false)
    .setRestitution(0.0);
  wallColliderHandles.push(world.createCollider(wallDesc).handle);

  wallDesc = rapier.ColliderDesc.cuboid(wallThicknessMeters / 2, halfSpanY)
    .setTranslation(rightX + wallThicknessMeters / 2, (bottomY + topY) / 2)
    .setFriction(0.1)
    .setSensor(false)
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
  if (shapeSidesUniform) {
    gl.uniform1i(shapeSidesUniform, settings.rendering.shapeSides ?? 0);
  }
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
        break;
      case "SET_PAUSED":
        isPaused = msg.paused;
        if (!isPaused) {
          lastTime = 0;
          requestAnimationFrame(update);
        }
        break;
    }
  } catch (e) {}
};
