import { initRapier } from "./rapier-init";
import { MainToWorkerMessage } from "./messages";
import * as WebGL from "./gl";
import { makeSlabs, PhysicsSlabs, MAX_BODIES } from "./struct";
import config from "./physics.config.json";
import type RAPIER_API from "@dimforge/rapier2d";
import { keyColorLevels } from "./palette";
import { parseHsla, hslToRgb, lerpColor } from "../../../utils/color";

const BYTES_PER_COLOR = 3;
const RESIZE_JITTER = 80;

// Per-instance stride (bytes)
const DYNAMIC_BYTES = 12; // vec2 position (8) + float angle (4)
const STATIC_BYTES = 8; // float radius (4) + u8 vec4 color (4)
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
let interleavedBuffer: ArrayBuffer; // dynamic buffer
let interleavedFloat32: Float32Array;
let interleavedUint8: Uint8Array;
let interleavedSlice: Uint8Array | null = null;

let staticVbo: WebGLBuffer | null = null;
let staticBuffer: ArrayBuffer;
let staticFloat32: Float32Array;
let staticUint8: Uint8Array;
let staticSlice: Uint8Array | null = null;

let isRunning = false;
let isPaused = false;
let bodyCount = 0;

let canvasWidth = 0;
let canvasHeight = 0;
let centerX = 0;
let centerY = 0;
let devicePixelRatio = 1;

let frameCount = 0;
const scratchDir = { x: 0, y: 0 };
const scratchForce = { x: 0, y: 0 };
const tmpLinvel = { x: 0, y: 0 };

let lastTime = 0;
let dt = 1 / 60;
let accumulator = 0;

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

  // Dynamic instance buffer
  interleavedBuffer = new ArrayBuffer(MAX_BODIES * DYNAMIC_BYTES);
  interleavedFloat32 = new Float32Array(interleavedBuffer);
  interleavedUint8 = new Uint8Array(interleavedBuffer);
  interleavedVbo = WebGL.createVbo(gl, interleavedBuffer, gl.STREAM_DRAW);

  // Static instance buffer (radius + color)
  staticBuffer = new ArrayBuffer(MAX_BODIES * STATIC_BYTES);
  staticFloat32 = new Float32Array(staticBuffer);
  staticUint8 = new Uint8Array(staticBuffer);
  staticVbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, staticVbo);
  gl.bufferData(gl.ARRAY_BUFFER, staticBuffer, gl.STATIC_DRAW);

  // Corner quad buffer
  const cornerData = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
  cornerVbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerVbo);
  gl.bufferData(gl.ARRAY_BUFFER, cornerData, gl.STATIC_DRAW);

  // Vertex array object
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Corner attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerVbo);
  const cornerLoc = gl.getAttribLocation(program, "a_corner");
  gl.enableVertexAttribArray(cornerLoc);
  gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);

  // Static attributes (radius, color)
  gl.bindBuffer(gl.ARRAY_BUFFER, staticVbo);
  const radiusLoc = gl.getAttribLocation(program, "a_radius");
  const colorLoc = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(radiusLoc);
  gl.vertexAttribPointer(radiusLoc, 1, gl.FLOAT, false, STATIC_BYTES, 0);
  gl.vertexAttribDivisor(radiusLoc, 1);

  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, STATIC_BYTES, 4);
  gl.vertexAttribDivisor(colorLoc, 1);

  // Dynamic attributes (position, angle)
  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);
  const positionLoc = gl.getAttribLocation(program, "a_position");
  const angleLoc = gl.getAttribLocation(program, "a_angle");

  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, DYNAMIC_BYTES, 0);
  gl.vertexAttribDivisor(positionLoc, 1);

  gl.enableVertexAttribArray(angleLoc);
  gl.vertexAttribPointer(angleLoc, 1, gl.FLOAT, false, DYNAMIC_BYTES, 8);
  gl.vertexAttribDivisor(angleLoc, 1);

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
      .setRestitution(0.1);
    planetCollider = world.createCollider(planetColliderDesc, planetBody);
  }

  rigidBodies.length = 0;

  const startRadiusPixels =
    settings.bodies.startRadius * Math.min(canvasWidth, canvasHeight);

  const wallOffset = (settings.world as any).wallOffset ?? 0;
  const offsetX = canvasWidth * wallOffset;
  const offsetY = canvasHeight * wallOffset;

  const usableWidth = Math.max(0, canvasWidth - 2 * offsetX);
  const usableHeight = Math.max(0, canvasHeight - 2 * offsetY);

  const canvasArea = usableWidth * usableHeight;
  const circleArea = Math.PI * Math.pow(startRadiusPixels, 2);
  const usableArea = Math.max(0, canvasArea - circleArea);

  const targetDensity = bodyCount / usableArea;

  const totalPointsInCanvas = Math.ceil(targetDensity * canvasArea);
  const spacing = Math.sqrt(canvasArea / totalPointsInCanvas);
  const cols = Math.floor(usableWidth / spacing);
  const rows = Math.floor(usableHeight / spacing);

  let currentBodyIndex = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (currentBodyIndex >= bodyCount) break;

      const x = offsetX + (col + 0.5) * spacing;
      const y = offsetY + (row + 0.5) * spacing;

      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq > startRadiusPixels * startRadiusPixels) {
        const angle = Math.atan2(dy, dx) + Math.PI;
        const normalizedPosition = (angle / (Math.PI * 2)) % 1;

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
        const shapeSides = settings.rendering.shapeSides ?? 0;
        let colliderDesc: import("@dimforge/rapier2d").ColliderDesc;
        const radiusMeters = finalRadiusPixels / PIXELS_PER_METER;

        if (shapeSides >= 3) {
          const verts = new Float32Array(shapeSides * 2);
          for (let s = 0; s < shapeSides; s++) {
            const ang = (s * Math.PI * 2) / shapeSides;
            verts[s * 2] = Math.cos(ang) * radiusMeters;
            verts[s * 2 + 1] = Math.sin(ang) * radiusMeters;
          }
          const maybeHull = rapier.ColliderDesc.convexHull(verts);
          colliderDesc = maybeHull ?? rapier.ColliderDesc.ball(radiusMeters);
        } else {
          colliderDesc = rapier.ColliderDesc.ball(radiusMeters);
        }

        colliderDesc = colliderDesc
          .setRestitution(settings.bodies.restitution)
          .setFriction(settings.bodies.friction);

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

        const color = (255 << 24) | (b << 16) | (g << 8) | r;
        slabs.colors[currentBodyIndex] = color;

        if (interleavedBuffer) {
          const dynByte = currentBodyIndex * DYNAMIC_BYTES;
          const dynFloat = dynByte >> 2;
          interleavedFloat32[dynFloat] = x;
          interleavedFloat32[dynFloat + 1] = y;
          interleavedFloat32[dynFloat + 2] = 0;

          const statByte = currentBodyIndex * STATIC_BYTES;
          const statFloat = statByte >> 2;
          staticFloat32[statFloat] = finalRadiusPixels;
          staticUint8[statByte + 4] = color & 0xff;
          staticUint8[statByte + 5] = (color >> 8) & 0xff;
          staticUint8[statByte + 6] = (color >> 16) & 0xff;
          staticUint8[statByte + 7] = (color >> 24) & 0xff;
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
      interleavedSlice.length !== bodyCount * DYNAMIC_BYTES
    ) {
      interleavedSlice = new Uint8Array(
        interleavedUint8.buffer,
        0,
        bodyCount * DYNAMIC_BYTES,
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, interleavedSlice);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  if (gl && staticVbo) {
    if (!staticSlice || staticSlice.length !== bodyCount * STATIC_BYTES) {
      staticSlice = new Uint8Array(
        staticUint8.buffer,
        0,
        bodyCount * STATIC_BYTES,
      );
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, staticVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, staticSlice);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}

function update(currentTime: number) {
  const frameStart = performance.now();
  let simEnd = frameStart;

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
  const MAX_ACCUMULATED_STEPS = 1;
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
  while (accumulator >= dt && stepCount < 1) {
    const planetRadiusPixels =
      settings.world.centerCircleRadius * Math.min(canvasWidth, canvasHeight);
    const planetRadiusMeters = planetRadiusPixels * INV_PIXELS_PER_METER;

    const gravityCoeff = settings.simulation.gravity;

    for (let i = 0; i < bodyCount; i++) {
      const body = rigidBodies[i];
      if (!body) continue;

      const mass = body.mass();
      if (mass !== 0) {
        const pos = body.translation();
        scratchDir.x = centerXMeters - pos.x;
        scratchDir.y = centerYMeters - pos.y;
        const distSq =
          scratchDir.x * scratchDir.x + scratchDir.y * scratchDir.y;
        if (distSq >= 1e-6) {
          const invDist = 1 / Math.sqrt(distSq);
          const dist = 1 / invDist;
          const radialDist = dist - planetRadiusMeters;
          if (radialDist > 0) {
            const pullNorm = Math.min(radialDist / planetRadiusMeters, 1);
            let smoothPull = pullNorm * pullNorm * (3 - 2 * pullNorm);
            const easeExp = (settings.simulation as any).gravityEase ?? 1;
            if (easeExp !== 1) smoothPull = Math.pow(smoothPull, easeExp);
            const scaledPull = smoothPull;
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

            const tangentialDamping =
              settings.simulation.tangentialDamping ?? 1.0;
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
      }
    }
    world.step();
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

    const baseByte = i * DYNAMIC_BYTES;
    const baseFloat = baseByte >> 2;
    interleavedFloat32[baseFloat] = slabs.positions[i * 2];
    interleavedFloat32[baseFloat + 1] = slabs.positions[i * 2 + 1];
    interleavedFloat32[baseFloat + 2] = rot;
  }

  if (gl && interleavedVbo) {
    if (
      !interleavedSlice ||
      interleavedSlice.length !== bodyCount * DYNAMIC_BYTES
    ) {
      interleavedSlice = new Uint8Array(
        interleavedUint8.buffer,
        0,
        bodyCount * DYNAMIC_BYTES,
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, interleavedSlice);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  const drawStart = performance.now();
  if (gl && program && vao) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, bodyCount);
  }

  const drawEnd = performance.now();

  const simulationTime = simEnd - simStart;
  const renderTime = drawEnd - drawStart;
  const totalTime = drawEnd - frameStart;
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
    shockConfig.radius * Math.min(canvasWidth, canvasHeight);
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

    handleResize({
      type: "RESIZE",
      width: msg.width,
      height: msg.height,
      devicePixelRatio: msg.devicePixelRatio,
    });

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

  if (
    msg.width === canvasWidth &&
    Math.abs(msg.height - canvasHeight) < RESIZE_JITTER
  ) {
    canvasWidth = msg.width;
    canvasHeight = msg.height;
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;

    const bufferWidth = Math.floor(canvasWidth * msg.devicePixelRatio);
    const bufferHeight = Math.floor(canvasHeight * msg.devicePixelRatio);
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
    gl.viewport(0, 0, bufferWidth, bufferHeight);

    if (program && projectionMatrix) {
      const l = 0,
        r = canvasWidth,
        b = 0,
        t = canvasHeight;
      const m = [
        2 / (r - l),
        0,
        0,
        0,
        0,
        2 / (t - b),
        0,
        0,
        0,
        0,
        -1,
        0,
        -((r + l) / (r - l)),
        -((t + b) / (t - b)),
        0,
        1,
      ];
      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionMatrix, false, m);
    }

    return;
  }

  canvasWidth = msg.width;
  canvasHeight = msg.height;
  centerX = canvasWidth / 2;
  centerY = canvasHeight / 2;
  devicePixelRatio = msg.devicePixelRatio;

  const bufferWidth = Math.floor(canvasWidth * devicePixelRatio);
  const bufferHeight = Math.floor(canvasHeight * devicePixelRatio);

  canvas.width = bufferWidth;
  canvas.height = bufferHeight;

  gl.viewport(0, 0, bufferWidth, bufferHeight);

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

  const wallThicknessPx = (settings.world as any).wallThickness ?? 50.0;
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
  if (vao) {
    gl.bindVertexArray(vao);
  }
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
