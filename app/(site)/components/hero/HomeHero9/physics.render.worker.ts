import { initRapier } from "./rapier-init";
import { MainToWorkerMessage } from "./messages";
import * as WebGL from "./gl";
import { MAX_BODIES } from "./struct";
import config from "./physics.config.json";
import type RAPIER_API from "@dimforge/rapier2d";
import { keyColorLevels } from "./palette";
import { parseHsla, hslToRgb, lerpColor } from "../../../utils/color";

const BYTES_PER_COLOR = 3;
const RESIZE_JITTER = 80;

const COLOR_BUCKETS = 12;
let sampleFrameCounter = 0;
const FRAME_SKIP = 2;
let frameSkipCounter = 0;
const SMOOTH_ALPHA = 0.3;
let prevColorsF: Float32Array | null = null;
let prevPostedHash = "";

let isMobileDevice = false;

// Preallocate buffers to avoid per-frame allocations
const bucketSumR = new Uint32Array(COLOR_BUCKETS);
const bucketSumG = new Uint32Array(COLOR_BUCKETS);
const bucketSumB = new Uint32Array(COLOR_BUCKETS);
const bucketCounts = new Uint32Array(COLOR_BUCKETS);

const colorsBuf = new Uint8Array(COLOR_BUCKETS * 3);
const flippedBuf = new Uint8Array(COLOR_BUCKETS * 3);
const rotatedBuf = new Uint8Array(COLOR_BUCKETS * 3);
const smoothUintBuf = new Uint8Array(COLOR_BUCKETS * 3);

const DYNAMIC_BYTES = 20;

// Upload helper using buffer mapping to avoid an extra CPU→GPU copy per frame
function uploadInterleavedData(byteCount: number) {
  if (!gl || !interleavedVbo) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);

  // Map the range we are about to overwrite. If mapping fails, fall back.
  const MAP_WRITE_BIT = 0x0002;
  const MAP_INVALIDATE_RANGE_BIT = 0x0004;

  const mapped = (gl as any).mapBufferRange?.(
    gl.ARRAY_BUFFER,
    0,
    byteCount,
    MAP_WRITE_BIT | MAP_INVALIDATE_RANGE_BIT,
  ) as ArrayBuffer | null;

  if (mapped) {
    new Uint8Array(mapped).set(interleavedUint8.subarray(0, byteCount));
    (gl as any).unmapBuffer?.(gl.ARRAY_BUFFER);
  } else {
    // Fallback path for older browsers
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, interleavedUint8, 0, byteCount);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

let activeSettings: PhysicsSettings;

const paletteCache = new Map<string, Uint8Array>();
const PALETTE_CACHE_LIMIT = 32;
let paletteLut: Uint8Array;
let paletteSteps = 0;

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
  if (paletteCache.size >= PALETTE_CACHE_LIMIT) {
    const oldestKey = paletteCache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) paletteCache.delete(oldestKey);
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

  interleavedBuffer = new ArrayBuffer(MAX_BODIES * DYNAMIC_BYTES);
  interleavedFloat32 = new Float32Array(interleavedBuffer);
  interleavedUint8 = new Uint8Array(interleavedBuffer);

  // Allocate GPU storage without initial data; we'll map it on demand.
  interleavedVbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedVbo);
  gl.bufferData(gl.ARRAY_BUFFER, interleavedBuffer.byteLength, gl.STREAM_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

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
  const radiusLoc = gl.getAttribLocation(program, "a_radius");
  const colorLoc = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(radiusLoc);
  gl.vertexAttribPointer(radiusLoc, 1, gl.FLOAT, false, DYNAMIC_BYTES, 12);
  gl.vertexAttribDivisor(radiusLoc, 1);

  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(
    colorLoc,
    4,
    gl.UNSIGNED_BYTE,
    true,
    DYNAMIC_BYTES,
    16,
  );
  gl.vertexAttribDivisor(colorLoc, 1);

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
  for (const body of rigidBodies) {
    world.removeRigidBody(body);
  }
  rigidBodies.length = 0;

  if (planetBody) {
    world.removeRigidBody(planetBody);
    planetBody = null;
    planetCollider = null;
  }

  bodyCount = Math.min(settings.bodies.count, MAX_BODIES);
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
      .setFriction(0)
      .setRestitution(0.5);
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

        const instByte = currentBodyIndex * DYNAMIC_BYTES;
        const instFloat = instByte >> 2;
        interleavedFloat32[instFloat] = x;
        interleavedFloat32[instFloat + 1] = y;
        interleavedFloat32[instFloat + 2] = 0;
        interleavedFloat32[instFloat + 3] = finalRadiusPixels;
        const idxColor =
          Math.floor(normalizedPosition * paletteSteps) * BYTES_PER_COLOR;
        const r = paletteLut[idxColor];
        const g = paletteLut[idxColor + 1];
        const b = paletteLut[idxColor + 2];

        const color = (255 << 24) | (b << 16) | (g << 8) | r;
        interleavedUint8[currentBodyIndex * DYNAMIC_BYTES + 16] = color & 0xff;
        interleavedUint8[currentBodyIndex * DYNAMIC_BYTES + 17] =
          (color >> 8) & 0xff;
        interleavedUint8[currentBodyIndex * DYNAMIC_BYTES + 18] =
          (color >> 16) & 0xff;
        interleavedUint8[currentBodyIndex * DYNAMIC_BYTES + 19] =
          (color >> 24) & 0xff;

        currentBodyIndex++;
      }
    }
    if (currentBodyIndex >= bodyCount) break;
  }

  bodyCount = rigidBodies.length;

  if (gl && interleavedVbo) {
    uploadInterleavedData(bodyCount * DYNAMIC_BYTES);
  }
}

function update(currentTime: number) {
  const frameStart = performance.now();
  let simEnd = frameStart;

  if (!isRunning || !canvas) return;

  if (isPaused) {
    return;
  }

  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(update);
    return;
  }

  const frameTime = (currentTime - lastTime) / 1000.0;
  lastTime = currentTime;
  accumulator += frameTime;
  const MAX_ACCUM = dt * 4;
  if (accumulator > MAX_ACCUM) accumulator = MAX_ACCUM;
  const simStart = performance.now();
  let didStep = false;
  const settings = activeSettings;
  const centerXMeters = centerX * INV_PIXELS_PER_METER;
  const centerYMeters = centerY * INV_PIXELS_PER_METER;

  if (accumulator >= dt) {
    accumulator -= dt;
    didStep = true;

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
            const F_gravity = gravityCoeff * mass * smoothPull;

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
            body.addForce(
              {
                x: -tangentialDamping * tangVelX * mass,
                y: -tangentialDamping * tangVelY * mass,
              },
              true,
            );

            const radialDamping = settings.simulation.radialDamping ?? 0.06;
            const radialDrag = -radialDamping * radialVel * mass;
            body.addForce(
              {
                x: radialDrag * scratchDir.x * invDist,
                y: radialDrag * scratchDir.y * invDist,
              },
              true,
            );
          }
        }
      }
    }

    world.integrationParameters.dt = dt;
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
  }
  simEnd = performance.now();

  for (let i = 0; i < bodyCount; i++) {
    const body = rigidBodies[i];
    if (!body) continue;
    const pos = body.translation();
    const rot = body.rotation();
    const baseByte = i * DYNAMIC_BYTES;
    const baseFloat = baseByte >> 2;
    interleavedFloat32[baseFloat] = pos.x * PIXELS_PER_METER;
    interleavedFloat32[baseFloat + 1] = pos.y * PIXELS_PER_METER;
    interleavedFloat32[baseFloat + 2] = rot;
  }

  if (gl && interleavedVbo) {
    uploadInterleavedData(bodyCount * DYNAMIC_BYTES);
  }

  const drawStart = performance.now();
  if (gl && program && vao) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, bodyCount);
  }

  const drawEnd = performance.now();

  if (frameSkipCounter++ % FRAME_SKIP === 0 && rigidBodies.length) {
    const planetRadiusPixels =
      activeSettings.world.centerCircleRadius *
      Math.min(canvasWidth, canvasHeight);
    const bodyRadius = activeSettings.bodies.radius;
    const minDist = planetRadiusPixels - bodyRadius * 2;
    const maxDist = planetRadiusPixels + bodyRadius * 2;
    const minDistSq = minDist * minDist;
    const maxDistSq = maxDist * maxDist;

    bucketSumR.fill(0);
    bucketSumG.fill(0);
    bucketSumB.fill(0);
    bucketCounts.fill(0);

    for (let i = 0; i < bodyCount; i++) {
      const pos = rigidBodies[i].translation();
      const dx = pos.x * PIXELS_PER_METER - centerX;
      const dy = pos.y * PIXELS_PER_METER - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq || distSq > maxDistSq) continue;

      let ang = Math.atan2(dy, dx);
      if (ang < 0) ang += Math.PI * 2;
      const bucket =
        Math.floor((ang / (Math.PI * 2)) * COLOR_BUCKETS) % COLOR_BUCKETS;

      const colorIndex = i * DYNAMIC_BYTES + 16;
      const r = interleavedUint8[colorIndex];
      const g = interleavedUint8[colorIndex + 1];
      const b = interleavedUint8[colorIndex + 2];

      bucketSumR[bucket] += r;
      bucketSumG[bucket] += g;
      bucketSumB[bucket] += b;
      bucketCounts[bucket]++;
    }

    for (let b = 0; b < COLOR_BUCKETS; b++) {
      if (bucketCounts[b] === 0) {
        colorsBuf[b * 3] = 0;
        colorsBuf[b * 3 + 1] = 0;
        colorsBuf[b * 3 + 2] = 0;
      } else {
        colorsBuf[b * 3] = Math.round(bucketSumR[b] / bucketCounts[b]);
        colorsBuf[b * 3 + 1] = Math.round(bucketSumG[b] / bucketCounts[b]);
        colorsBuf[b * 3 + 2] = Math.round(bucketSumB[b] / bucketCounts[b]);
      }
    }

    for (let b = 0; b < COLOR_BUCKETS; b++) {
      const src = b * 3;
      const destBucket = (COLOR_BUCKETS - b) % COLOR_BUCKETS;
      const dest = destBucket * 3;
      flippedBuf[dest] = colorsBuf[src];
      flippedBuf[dest + 1] = colorsBuf[src + 1];
      flippedBuf[dest + 2] = colorsBuf[src + 2];
    }

    const ROT = COLOR_BUCKETS / 4;
    for (let b = 0; b < COLOR_BUCKETS; b++) {
      const src = b * 3;
      const dest = ((b + ROT) % COLOR_BUCKETS) * 3;
      rotatedBuf[dest] = flippedBuf[src];
      rotatedBuf[dest + 1] = flippedBuf[src + 1];
      rotatedBuf[dest + 2] = flippedBuf[src + 2];
    }

    if (!prevColorsF) {
      prevColorsF = new Float32Array(rotatedBuf.length);
      for (let i = 0; i < rotatedBuf.length; i++)
        prevColorsF[i] = rotatedBuf[i];
    } else {
      for (let i = 0; i < rotatedBuf.length; i++) {
        const alpha = isMobileDevice ? 1 : SMOOTH_ALPHA;
        prevColorsF[i] = prevColorsF[i] * (1 - alpha) + rotatedBuf[i] * alpha;
      }
    }

    for (let i = 0; i < rotatedBuf.length; i++)
      smoothUintBuf[i] = Math.round(prevColorsF![i]);

    let hash = "";
    for (let i = 0; i < COLOR_BUCKETS; i++) {
      hash += String.fromCharCode(smoothUintBuf[i * 3]);
    }
    if (hash !== prevPostedHash) {
      prevPostedHash = hash;
      self.postMessage({ type: "FRAME_COLORS", colors: smoothUintBuf });

      let totalR = 0,
        totalG = 0,
        totalB = 0,
        totalCount = 0;
      for (let i = 0; i < COLOR_BUCKETS; i++) {
        const idx = i * 3;
        totalR += smoothUintBuf[idx];
        totalG += smoothUintBuf[idx + 1];
        totalB += smoothUintBuf[idx + 2];
        totalCount++;
      }
      if (totalCount > 0) {
        self.postMessage({
          type: "AVG_COLOR",
          r: Math.round(totalR / totalCount),
          g: Math.round(totalG / totalCount),
          b: Math.round(totalB / totalCount),
        });
      }
    }
  }

  const simulationTime = simEnd - simStart;
  const renderTime = drawEnd - drawStart;
  const totalTime = drawEnd - frameStart;
  const fpsCalc = frameTime > 0 ? 1 / frameTime : 0;
  const calcsPerSec = frameTime > 0 && didStep ? bodyCount / frameTime : 0;

  const IS_DEV = process.env.NODE_ENV !== "production";
  if (IS_DEV) {
    self.postMessage({
      type: "METRICS",
      simulationTime,
      renderTime,
      totalTime,
      fps: fpsCalc,
      calcsPerSec,
    });
  }

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
    // Persist device type so we don't re-evaluate on every resize
    isMobileDevice = msg.isMobile;
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
    paletteSteps = settingsInit.rendering.colorSteps ?? 1024;
    paletteLut = buildPalette(settingsInit.rendering.colorLevel, paletteSteps);
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
    Math.abs(msg.width - canvasWidth) < RESIZE_JITTER &&
    Math.abs(msg.height - canvasHeight) < RESIZE_JITTER
  ) {
    return;
  }

  const nextBufferW = Math.floor(msg.width * msg.devicePixelRatio);
  const nextBufferH = Math.floor(msg.height * msg.devicePixelRatio);
  if (canvas && canvas.width === nextBufferW && canvas.height === nextBufferH) {
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

  const nextSettings = getSettings(isMobileDevice);
  activeSettings = {
    ...nextSettings,
    rendering: {
      ...nextSettings.rendering,
      colorLevel:
        activeSettings?.rendering.colorLevel ??
        nextSettings.rendering.colorLevel,
    },
  } as PhysicsSettings;
  paletteSteps = activeSettings.rendering.colorSteps ?? 1024;
  paletteLut = buildPalette(activeSettings.rendering.colorLevel, paletteSteps);
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
  try {
    if (world) world.free();
    if (gl) {
      if (interleavedVbo) gl.deleteBuffer(interleavedVbo);
      if (cornerVbo) gl.deleteBuffer(cornerVbo);
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {}
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
      case "SHOCKWAVE":
        if (!isPaused) handleShockwave(msg);
        break;
      case "SCROLL_FORCE":
        if (!isPaused) scrollForce = msg.force;
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
