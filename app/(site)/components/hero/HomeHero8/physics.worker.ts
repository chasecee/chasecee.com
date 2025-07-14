/// <reference lib="webworker" />

import type { World, Body, Vec2 } from "planck";
import type { PhysicsConfig } from "./physicsConfig";
import {
  radiansToDegrees,
  angleBetweenPoints,
  pointOnCircle,
  circularPosition,
  circularVelocity,
  magnitude,
  normalize,
  decayFunction,
} from "../../../utils/mathUtils";

let planck: any = null;

class Vec2Pool {
  private pool: Vec2[] = [];
  private index = 0;
  private static instance: Vec2Pool;

  static getInstance(): Vec2Pool {
    if (!Vec2Pool.instance) {
      Vec2Pool.instance = new Vec2Pool();
    }
    return Vec2Pool.instance;
  }

  initialize(planckInstance: any, poolSize: number = 50) {
    this.pool = [];
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(planckInstance.Vec2(0, 0));
    }
    this.index = 0;
  }

  get(x: number = 0, y: number = 0): Vec2 {
    const vec = this.pool[this.index];
    vec.x = x;
    vec.y = y;
    this.index = (this.index + 1) % this.pool.length;
    return vec;
  }

  reset() {
    this.index = 0;
  }
}

class TransferableBuffer {
  private static instance: TransferableBuffer;
  private buffer: ArrayBuffer | null = null;
  private floatView: Float32Array | null = null;
  private capacity = 0;

  static getInstance(): TransferableBuffer {
    if (!TransferableBuffer.instance) {
      TransferableBuffer.instance = new TransferableBuffer();
    }
    return TransferableBuffer.instance;
  }

  initialize(maxBodies: number) {
    const floatsPerBody = 8; // id, x, y, rotation, isDragged, width, height, colorIndex
    this.capacity = maxBodies * floatsPerBody;
    this.buffer = new ArrayBuffer(this.capacity * 4);
    this.floatView = new Float32Array(this.buffer);
  }

  packBodies(
    bodies: {
      id: string;
      x: number;
      y: number;
      rotation: number;
      isDragged: boolean;
      width: number;
      height: number;
      colorIndex: number;
    }[],
  ): ArrayBuffer | null {
    if (!this.floatView || !this.buffer) return null;

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const offset = i * 8;

      this.floatView[offset] = parseInt(body.id.split("-")[1]) || i; // Extract numeric ID
      this.floatView[offset + 1] = body.x;
      this.floatView[offset + 2] = body.y;
      this.floatView[offset + 3] = body.rotation;
      this.floatView[offset + 4] = body.isDragged ? 1 : 0;
      this.floatView[offset + 5] = body.width;
      this.floatView[offset + 6] = body.height;
      this.floatView[offset + 7] = body.colorIndex;
    }

    const result = this.buffer.slice(0, bodies.length * 8 * 4);
    this.buffer = new ArrayBuffer(this.capacity * 4);
    this.floatView = new Float32Array(this.buffer);
    return result;
  }
}

interface PhysicsBody {
  id: string;
  body: Body;
  width: number;
  height: number;
  label: string;
  colorIndex: number;
  x: number;
  y: number;
  rotation: number;
  isDragged: boolean;
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

interface WorkerMessage {
  type: string;
  payload?: any;
}

class PhysicsSimulation {
  private world: World | null = null;
  private bodies: PhysicsBody[] = [];
  private groundBody: Body | null = null;
  private dimensions = { width: 800, height: 600 };
  private center = { x: 400, y: 300 };
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private fixedTimeStep = 1 / 60;
  private maxFPS = 60;
  private frameInterval = 1000 / 60;
  private lastFrameTime = 0;
  private animationId: number | null = null;
  private settings: PhysicsConfig = {} as PhysicsConfig;
  private settingsInitialized = false;
  private boundariesCreated = false;

  private vec2Pool: Vec2Pool;
  private transferBuffer: TransferableBuffer;
  private centerVec: Vec2 | null = null;

  private lastBodyData: PhysicsBodyData[] = [];
  private skipUpdateFrames = 0;
  private maxSkipFrames = 2;

  private scrollForce = 0;
  private scrollDirection = 0;

  constructor() {
    this.vec2Pool = Vec2Pool.getInstance();
    this.transferBuffer = TransferableBuffer.getInstance();
  }

  getBoundariesCreated(): boolean {
    return this.boundariesCreated;
  }

  createBoundariesOnce() {
    if (!this.boundariesCreated && this.settingsInitialized) {
      this.createBoundaries();
      this.boundariesCreated = true;
    }
  }

  async initialize() {
    if (!planck) {
      planck = await import("planck");
    }

    this.vec2Pool.initialize(planck, 50);
    this.transferBuffer.initialize(1000);
    this.centerVec = planck.Vec2(this.center.x, this.center.y);

    this.world = planck.World({
      gravity: planck.Vec2(0, 0),
      allowSleep: true,
      velocityIterations: 6,
      positionIterations: 2,
    });

    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFrameTime = performance.now();
    this.animate();
  }

  private createBoundaries() {
    if (!this.world || !planck || !this.settingsInitialized) return;

    if (this.groundBody) {
      this.world.destroyBody(this.groundBody);
    }

    const groundBody = this.world.createBody();
    this.groundBody = groundBody;
    const { width, height } = this.dimensions;

    const centerRadius =
      Math.min(width, height) * this.settings.centerCircleRadius;
    const centerX = width / 2;
    const centerY = height / 2;
    const segments = 64;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * 2 * Math.PI;
      const angle2 = ((i + 1) / segments) * 2 * Math.PI;

      const x1 = centerX + Math.cos(angle1) * centerRadius;
      const y1 = centerY + Math.sin(angle1) * centerRadius;
      const x2 = centerX + Math.cos(angle2) * centerRadius;
      const y2 = centerY + Math.sin(angle2) * centerRadius;

      groundBody.createFixture({
        shape: planck.Edge(planck.Vec2(x1, y1), planck.Vec2(x2, y2)),
        friction: 0.3,
        restitution: 0.15,
      });
    }
  }

  private createBodies(numBlocks: number = 20) {
    if (!this.world || !planck) return;

    const scale = Math.min(
      this.dimensions.width / 800,
      this.dimensions.height / 600,
    );
    const baseSize = Math.max(40, 80 * scale * (20 / numBlocks));
    const blockSize = baseSize * this.settings.bodySize;

    this.bodies = [];

    for (let i = 0; i < numBlocks; i++) {
      const baseRadius =
        Math.min(this.dimensions.width, this.dimensions.height) *
        this.settings.bodiesStartRadius;
      const radiusVariation =
        numBlocks > 50
          ? Math.random() * this.settings.bodiesStartSpread -
            this.settings.bodiesStartSpread / 2
          : 0;
      const radius = baseRadius * (1 + radiusVariation);
      const position = circularPosition(
        i,
        numBlocks,
        radius,
        this.center.x,
        this.center.y,
      );
      const x = position.x;
      const y = position.y;

      const variance = this.settings.bodySizeVariance;
      let sizeMultiplier = 1.0;

      if (variance > 0) {
        const random = Math.random();

        if (random < 0.8) {
          const minSize = 0.3 + (1 - variance) * 0.5;
          const maxSize = 0.8;
          sizeMultiplier = minSize + (maxSize - minSize) * Math.random();
        } else {
          sizeMultiplier = 0.8 + 0.6 * Math.random();
        }
      }

      const finalBlockSize = blockSize * sizeMultiplier;

      const vec1 = this.vec2Pool.get(x, y);

      const body = this.world.createBody({
        type: "dynamic",
        position: vec1,
        linearDamping: this.settings.damping,
        angularDamping: this.settings.damping,
      });

      body.createFixture({
        shape: planck.Box(finalBlockSize / 2, finalBlockSize / 2),
        density: 0.05,
        friction: this.settings.friction,
        restitution: this.settings.restitution,
      });

      const clockwiseSpeed = this.settings.initialClockwiseVelocity;
      const velocity = circularVelocity(i, numBlocks, clockwiseSpeed);
      const vec2 = this.vec2Pool.get(velocity.x, velocity.y);
      body.setLinearVelocity(vec2);

      const physicsBody: PhysicsBody = {
        id: `body-${i}`,
        body,
        width: finalBlockSize,
        height: finalBlockSize,
        label: `Block ${i + 1}`,
        colorIndex: i,
        x,
        y,
        rotation: 0,
        isDragged: false,
      };

      this.bodies.push(physicsBody);
    }
  }

  private animate() {
    if (!this.isRunning || !this.world) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime >= this.frameInterval) {
      this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

      const physicsTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.accumulator += physicsTime;
      const maxAccumulator = this.fixedTimeStep * 4;
      this.accumulator = Math.min(this.accumulator, maxAccumulator);

      while (this.accumulator >= this.fixedTimeStep) {
        this.stepPhysics();
        this.accumulator -= this.fixedTimeStep;
      }

      this.sendBodyUpdates();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private stepPhysics() {
    if (!this.world || !planck) return;

    this.vec2Pool.reset();

    const attractorStrength = this.settings.gravity * 8;
    const scrollInfluence =
      this.scrollForce * this.settings.scrollForceMultiplier;

    if (Math.abs(scrollInfluence) > 1.0) {
      this.bodies.forEach(({ body }) => {
        const pos = body.getPosition();
        body.setAwake(true);

        const vel = body.getLinearVelocity();
        const impulseStrength = scrollInfluence * 0.5;

        const angle = angleBetweenPoints(
          this.center.x,
          this.center.y,
          pos.x,
          pos.y,
        );
        const radialImpulse = impulseStrength * 0.3;

        let radialX, radialY;
        if (this.scrollDirection > 0) {
          radialX = Math.cos(angle + Math.PI / 2) * radialImpulse;
          radialY = Math.sin(angle + Math.PI / 2) * radialImpulse;
        } else {
          radialX = Math.cos(angle - Math.PI / 2) * radialImpulse;
          radialY = Math.sin(angle - Math.PI / 2) * radialImpulse;
        }

        const verticalImpulse = impulseStrength * 0.8;
        radialY += verticalImpulse;

        const horizontalImpulse = impulseStrength * 0.3 * (Math.random() - 0.5);
        radialX += horizontalImpulse;

        const newVel = this.vec2Pool.get(vel.x + radialX, vel.y + radialY);
        body.setLinearVelocity(newVel);
      });
    }

    this.bodies.forEach(({ body }) => {
      const pos = body.getPosition();

      const vec1 = this.vec2Pool.get(
        this.center.x - pos.x,
        this.center.y - pos.y,
      );

      const distanceSquared = vec1.x * vec1.x + vec1.y * vec1.y;

      if (distanceSquared > 1) {
        const distance = magnitude(vec1.x, vec1.y);
        const baseForce = attractorStrength;

        const vec2 = this.vec2Pool.get(
          (vec1.x / distance) * baseForce,
          (vec1.y / distance) * baseForce,
        );
        body.applyForceToCenter(vec2);
      }
    });

    this.scrollForce *= 0.88;

    const physicsTimeStep = this.fixedTimeStep * this.settings.timeStep;
    this.world.step(physicsTimeStep);
  }

  private sendBodyUpdates() {
    const bodyData = this.bodies.map((physicsBody) => {
      const pos = physicsBody.body.getPosition();
      const angle = physicsBody.body.getAngle();
      const rotation = radiansToDegrees(angle);
      const isDragged = false;

      physicsBody.x = pos.x;
      physicsBody.y = pos.y;
      physicsBody.rotation = rotation;
      physicsBody.isDragged = isDragged;

      return {
        id: physicsBody.id,
        x: pos.x,
        y: pos.y,
        rotation,
        isDragged,
        width: physicsBody.width,
        height: physicsBody.height,
        colorIndex: physicsBody.colorIndex,
      };
    });

    const shouldSendFullUpdate =
      this.skipUpdateFrames >= this.maxSkipFrames ||
      this.lastBodyData.length === 0;

    if (shouldSendFullUpdate) {
      const buffer = this.transferBuffer.packBodies(bodyData);
      if (buffer) {
        self.postMessage(
          {
            type: "BODY_UPDATE_BUFFER",
            payload: { buffer, count: bodyData.length },
          },
          [buffer],
        );
      } else {
        // Fallback to structured clone
        self.postMessage({
          type: "BODY_UPDATE",
          payload: bodyData,
        });
      }
      this.lastBodyData = bodyData;
      this.skipUpdateFrames = 0;
    } else {
      const significantChanges = this.findSignificantChanges(bodyData);
      if (significantChanges.length > 0) {
        // Use structured clone for delta updates (usually smaller)
        self.postMessage({
          type: "BODY_UPDATE_DELTA",
          payload: significantChanges,
        });
      }
      this.skipUpdateFrames++;
    }
  }

  private findSignificantChanges(
    newData: PhysicsBodyData[],
  ): PhysicsBodyData[] {
    const threshold = 0.8;
    const rotationThreshold = 2;
    const changes: PhysicsBodyData[] = [];

    for (let i = 0; i < newData.length; i++) {
      const newBody = newData[i];
      const oldBody = this.lastBodyData[i];

      if (
        !oldBody ||
        Math.abs(newBody.x - oldBody.x) > threshold ||
        Math.abs(newBody.y - oldBody.y) > threshold ||
        Math.abs(newBody.rotation - oldBody.rotation) > rotationThreshold ||
        newBody.isDragged !== oldBody.isDragged
      ) {
        changes.push(newBody);
      }
    }

    return changes;
  }

  updateSettings(newSettings: Partial<PhysicsConfig>) {
    const oldBodySize = this.settings.bodySize;
    const oldBodySizeVariance = this.settings.bodySizeVariance;
    const oldCenterCircleRadius = this.settings.centerCircleRadius;
    const oldBodiesStartRadius = this.settings.bodiesStartRadius;
    const oldBodiesStartSpread = this.settings.bodiesStartSpread;
    this.settings = { ...this.settings, ...newSettings };

    this.settingsInitialized = true;

    this.bodies.forEach(({ body }) => {
      const fixture = body.getFixtureList();
      if (fixture) {
        fixture.setFriction(this.settings.friction);
        fixture.setRestitution(this.settings.restitution);
      }
      body.setLinearDamping(this.settings.damping);
      body.setAngularDamping(this.settings.damping);
    });

    if (
      (newSettings.bodySize !== undefined &&
        newSettings.bodySize !== oldBodySize) ||
      (newSettings.bodySizeVariance !== undefined &&
        newSettings.bodySizeVariance !== oldBodySizeVariance)
    ) {
      this.recreateBodiesWithNewSize();
    }

    if (
      newSettings.centerCircleRadius !== undefined &&
      newSettings.centerCircleRadius !== oldCenterCircleRadius
    ) {
      this.createBoundaries();
    }

    if (
      (newSettings.bodiesStartRadius !== undefined &&
        newSettings.bodiesStartRadius !== oldBodiesStartRadius) ||
      (newSettings.bodiesStartSpread !== undefined &&
        newSettings.bodiesStartSpread !== oldBodiesStartSpread)
    ) {
      this.repositionBodies();
    }
  }

  private recreateBodiesWithNewSize() {
    const numBodies = this.bodies.length;
    if (numBodies === 0) return;

    const currentPositions = this.bodies.map(({ body }) => {
      const pos = body.getPosition();
      return { x: pos.x, y: pos.y };
    });

    this.bodies.forEach(({ body }) => {
      if (this.world && body) {
        this.world.destroyBody(body);
      }
    });
    this.bodies = [];

    this.createBodies(numBodies);

    this.bodies.forEach((physicsBody, index) => {
      if (currentPositions[index]) {
        const vec1 = this.vec2Pool.get(
          currentPositions[index].x,
          currentPositions[index].y,
        );
        physicsBody.body.setPosition(vec1);
      }
    });
  }

  private repositionBodies() {
    this.bodies.forEach((physicsBody, index) => {
      const baseRadius =
        Math.min(this.dimensions.width, this.dimensions.height) *
        this.settings.bodiesStartRadius;
      const radiusVariation =
        this.bodies.length > 50
          ? Math.random() * this.settings.bodiesStartSpread -
            this.settings.bodiesStartSpread / 2
          : 0;
      const radius = baseRadius * (1 + radiusVariation);

      const position = circularPosition(
        index,
        this.bodies.length,
        radius,
        this.center.x,
        this.center.y,
      );
      const x = position.x;
      const y = position.y;

      const vec1 = this.vec2Pool.get(x, y);
      physicsBody.body.setPosition(vec1);

      const clockwiseSpeed = this.settings.initialClockwiseVelocity;
      const velocity = circularVelocity(
        index,
        this.bodies.length,
        clockwiseSpeed,
      );
      const vec2 = this.vec2Pool.get(velocity.x, velocity.y);
      physicsBody.body.setLinearVelocity(vec2);
      physicsBody.body.setAngularVelocity(0);
      physicsBody.body.setAngle(0);
      physicsBody.body.setAwake(true);
    });
  }

  updateDimensions(width: number, height: number, numBodies: number = 20) {
    this.dimensions = { width, height };
    this.center = { x: width / 2, y: height / 2 };

    if (this.centerVec) {
      this.centerVec.x = width / 2;
      this.centerVec.y = height / 2;
    }

    this.createBoundaries();

    if (this.bodies.length === 0 || this.bodies.length !== numBodies) {
      this.bodies.forEach(({ body }) => {
        if (this.world && body) {
          this.world.destroyBody(body);
        }
      });
      this.bodies = [];

      this.createBodies(numBodies);
      this.sendBodyUpdates();
    }
  }

  shockwave(x: number, y: number) {
    if (!this.world || !planck) return;

    const shockwaveCenter = { x, y };
    const maxDistance =
      Math.min(this.dimensions.width, this.dimensions.height) *
      this.settings.shockwaveRadius;
    const baseForce = this.settings.shockwaveForce;
    const decayFactor = this.settings.shockwaveDecay;
    const directionality = this.settings.shockwaveDirectionality;

    const canvasCenter = {
      x: this.dimensions.width / 2,
      y: this.dimensions.height / 2,
    };
    const biasDirection = {
      x: (x - canvasCenter.x) / (this.dimensions.width / 2),
      y: (y - canvasCenter.y) / (this.dimensions.height / 2),
    };

    const biasLength = magnitude(biasDirection.x, biasDirection.y);
    if (biasLength > 0) {
      const normalizedBias = normalize(biasDirection.x, biasDirection.y);
      biasDirection.x = normalizedBias.x;
      biasDirection.y = normalizedBias.y;
    }

    this.bodies.forEach(({ body }) => {
      const pos = body.getPosition();

      const vec1 = this.vec2Pool.get(
        pos.x - shockwaveCenter.x,
        pos.y - shockwaveCenter.y,
      );

      const distance = magnitude(vec1.x, vec1.y);

      if (distance > maxDistance || distance < 1) return;

      const direction = normalize(vec1.x, vec1.y);

      const finalDirection = {
        x:
          direction.x * (1 - directionality) + biasDirection.x * directionality,
        y:
          direction.y * (1 - directionality) + biasDirection.y * directionality,
      };

      const finalLength = magnitude(finalDirection.x, finalDirection.y);
      if (finalLength > 0) {
        const normalizedFinal = normalize(finalDirection.x, finalDirection.y);
        finalDirection.x = normalizedFinal.x;
        finalDirection.y = normalizedFinal.y;
      }

      const normalizedDistance = distance / maxDistance;
      const decayMultiplier = decayFunction(normalizedDistance, decayFactor);
      const forceMultiplier = baseForce * decayMultiplier;

      const biasAlignment =
        finalDirection.x * biasDirection.x + finalDirection.y * biasDirection.y;
      const biasBoost = 1 + biasAlignment * 0.3;

      const finalForce = forceMultiplier * biasBoost;

      const impulseStrength = finalForce * 0.1;
      const vec2 = this.vec2Pool.get(
        finalDirection.x * impulseStrength,
        finalDirection.y * impulseStrength,
      );

      const currentVel = body.getLinearVelocity();
      const vec3 = this.vec2Pool.get(
        currentVel.x + vec2.x,
        currentVel.y + vec2.y,
      );
      body.setLinearVelocity(vec3);

      body.setAwake(true);
      const angularImpulse = (Math.random() - 0.5) * impulseStrength * 0.01;
      body.applyAngularImpulse(angularImpulse);
    });
  }

  centerShockwave(x: number, y: number) {
    if (!this.world || !planck) return;

    const shockwaveCenter = { x, y };
    const maxDistance =
      Math.min(this.dimensions.width, this.dimensions.height) *
      (this.settings.shockwaveRadius * 2.5);
    const baseForce = this.settings.shockwaveForce * 1.5;
    const decayFactor = this.settings.shockwaveDecay * 0.7;
    const directionality = this.settings.shockwaveDirectionality * 0.5;

    const canvasCenter = {
      x: this.dimensions.width / 2,
      y: this.dimensions.height / 2,
    };
    const biasDirection = {
      x: (x - canvasCenter.x) / (this.dimensions.width / 2),
      y: (y - canvasCenter.y) / (this.dimensions.height / 2),
    };

    const biasLength = magnitude(biasDirection.x, biasDirection.y);
    if (biasLength > 0) {
      const normalizedBias = normalize(biasDirection.x, biasDirection.y);
      biasDirection.x = normalizedBias.x;
      biasDirection.y = normalizedBias.y;
    }

    this.bodies.forEach(({ body }) => {
      const pos = body.getPosition();

      const vec1 = this.vec2Pool.get(
        pos.x - shockwaveCenter.x,
        pos.y - shockwaveCenter.y,
      );

      const distance = magnitude(vec1.x, vec1.y);

      if (distance > maxDistance || distance < 1) return;

      const direction = normalize(vec1.x, vec1.y);

      const finalDirection = {
        x:
          direction.x * (1 - directionality) + biasDirection.x * directionality,
        y:
          direction.y * (1 - directionality) + biasDirection.y * directionality,
      };

      const finalLength = magnitude(finalDirection.x, finalDirection.y);
      if (finalLength > 0) {
        const normalizedFinal = normalize(finalDirection.x, finalDirection.y);
        finalDirection.x = normalizedFinal.x;
        finalDirection.y = normalizedFinal.y;
      }

      const normalizedDistance = distance / maxDistance;
      const decayMultiplier = decayFunction(normalizedDistance, decayFactor);

      const biasAlignment =
        finalDirection.x * biasDirection.x + finalDirection.y * biasDirection.y;
      const biasBoost = 1 + biasAlignment * 0.15;

      const finalForce = baseForce * decayMultiplier * biasBoost;

      const impulseStrength = finalForce * 0.1;
      const vec2 = this.vec2Pool.get(
        finalDirection.x * impulseStrength,
        finalDirection.y * impulseStrength,
      );

      const currentVel = body.getLinearVelocity();
      const vec3 = this.vec2Pool.get(
        currentVel.x + vec2.x,
        currentVel.y + vec2.y,
      );
      body.setLinearVelocity(vec3);

      body.setAwake(true);
      const angularImpulse = (Math.random() - 0.5) * impulseStrength * 0.02;
      body.applyAngularImpulse(angularImpulse);
    });
  }

  applyScrollForce(force: number, direction: number) {
    this.scrollForce = force;
    this.scrollDirection = direction;
  }

  destroy() {
    this.cleanup();
  }

  private cleanup() {
    this.isRunning = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.world) {
      for (let b = this.world.getBodyList(); b; b = b.getNext()) {
        this.world.destroyBody(b);
      }
    }
    this.world = null;
    this.bodies = [];
    this.groundBody = null;
    this.centerVec = null;
  }

  terminate() {
    this.cleanup();
    self.close();
  }
}

let simulation: PhysicsSimulation | null = null;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case "INIT":
      simulation = new PhysicsSimulation();
      await simulation.initialize();
      self.postMessage({ type: "INITIALIZED" });
      break;

    case "UPDATE_SETTINGS":
      simulation?.updateSettings(payload);
      if (simulation && !simulation.getBoundariesCreated()) {
        simulation.createBoundariesOnce();
      }
      break;

    case "UPDATE_DIMENSIONS":
      simulation?.updateDimensions(
        payload.width,
        payload.height,
        payload.numBodies,
      );
      break;

    case "SHOCKWAVE":
      simulation?.shockwave(payload.x, payload.y);
      break;

    case "CENTER_SHOCKWAVE":
      simulation?.centerShockwave(payload.x, payload.y);
      break;

    case "SCROLL_FORCE":
      simulation?.applyScrollForce(payload.force, payload.direction);
      break;

    case "DESTROY":
      simulation?.destroy();
      simulation = null;
      break;

    case "TERMINATE":
      simulation?.terminate();
      simulation = null;
      break;
  }
};
