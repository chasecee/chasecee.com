/// <reference lib="webworker" />

import type { World, Body, Vec2 } from "planck";

let planck: any = null;

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

interface PhysicsSettings {
  gravity: number;
  timeStep: number;
  damping: number;
  friction: number;
  restitution: number;
  bodySize: number;
  bodySizeVariance: number;
  centerCircleRadius: number;
  gridGapSize: number;
  bodiesStartRadius: number;
  bodiesStartSpread: number;
  shockwaveForce: number;
  shockwaveRadius: number;
  shockwaveDecay: number;
  shockwaveDirectionality: number;
  initialClockwiseVelocity: number;
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
  private settings: PhysicsSettings = {} as PhysicsSettings;

  private tempVec1: Vec2 | null = null;
  private tempVec2: Vec2 | null = null;
  private tempVec3: Vec2 | null = null;
  private tempVec4: Vec2 | null = null;
  private centerVec: Vec2 | null = null;

  private lastBodyData: PhysicsBodyData[] = [];
  private skipUpdateFrames = 0;
  private maxSkipFrames = 2;

  async initialize() {
    if (!planck) {
      planck = await import("planck");
    }

    this.tempVec1 = planck.Vec2(0, 0);
    this.tempVec2 = planck.Vec2(0, 0);
    this.tempVec3 = planck.Vec2(0, 0);
    this.tempVec4 = planck.Vec2(0, 0);
    this.centerVec = planck.Vec2(this.center.x, this.center.y);

    this.world = planck.World({
      gravity: planck.Vec2(0, 0),
      allowSleep: true,
      velocityIterations: 6,
      positionIterations: 2,
    });

    this.setupCollisionHandlers();
    this.createBoundaries();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  private setupCollisionHandlers() {
    if (!this.world || !planck) return;

    this.world.on("begin-contact", (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();

      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();

      const userDataA = fixtureA.getUserData() as { type?: string } | null;
      const userDataB = fixtureB.getUserData() as { type?: string } | null;

      const wallFixture =
        userDataA?.type === "one-way-wall"
          ? fixtureA
          : userDataB?.type === "one-way-wall"
            ? fixtureB
            : null;

      if (!wallFixture) return;

      const dynamicBody = bodyA.isDynamic()
        ? bodyA
        : bodyB.isDynamic()
          ? bodyB
          : null;
      if (!dynamicBody) return;

      const pos = dynamicBody.getPosition();
      const vel = dynamicBody.getLinearVelocity();

      const directionFromCenter = {
        x: pos.x - this.center.x,
        y: pos.y - this.center.y,
      };

      const dotProduct =
        vel.x * directionFromCenter.x + vel.y * directionFromCenter.y;

      if (dotProduct > 0) {
        const forceStrength = 2000;
        const forceDirection = {
          x: -directionFromCenter.x,
          y: -directionFromCenter.y,
        };

        const magnitude = Math.sqrt(
          forceDirection.x * forceDirection.x +
            forceDirection.y * forceDirection.y,
        );
        if (magnitude > 0) {
          forceDirection.x = (forceDirection.x / magnitude) * forceStrength;
          forceDirection.y = (forceDirection.y / magnitude) * forceStrength;

          this.tempVec1!.x = forceDirection.x;
          this.tempVec1!.y = forceDirection.y;
          dynamicBody.applyForceToCenter(this.tempVec1!);
        }
      }
    });
  }

  private createBoundaries() {
    if (!this.world || !planck) return;

    if (this.groundBody) {
      this.world.destroyBody(this.groundBody);
    }

    const groundBody = this.world.createBody();
    this.groundBody = groundBody;
    const wallThickness = 20;
    const { width, height } = this.dimensions;

    const walls = [
      {
        x: width / 2,
        y: -wallThickness / 2,
        w: width / 2,
        h: wallThickness / 2,
      },
      {
        x: width / 2,
        y: height + wallThickness / 2,
        w: width / 2,
        h: wallThickness / 2,
      },
      {
        x: -wallThickness / 2,
        y: height / 2,
        w: wallThickness / 2,
        h: height / 2,
      },
      {
        x: width + wallThickness / 2,
        y: height / 2,
        w: wallThickness / 2,
        h: height / 2,
      },
    ];

    walls.forEach((wall) => {
      groundBody.createFixture({
        shape: planck.Box(wall.w, wall.h, planck.Vec2(wall.x, wall.y), 0),
        isSensor: true,
        userData: { type: "one-way-wall" },
      });
    });

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
      const angle = (i * 2 * Math.PI) / numBlocks;
      const baseRadius =
        Math.min(this.dimensions.width, this.dimensions.height) *
        this.settings.bodiesStartRadius;
      const radiusVariation =
        numBlocks > 50
          ? Math.random() * this.settings.bodiesStartSpread -
            this.settings.bodiesStartSpread / 2
          : 0;
      const radius = baseRadius * (1 + radiusVariation);
      const x = this.center.x + Math.cos(angle) * radius;
      const y = this.center.y + Math.sin(angle) * radius;

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

      this.tempVec1!.x = x;
      this.tempVec1!.y = y;

      const body = this.world.createBody({
        type: "dynamic",
        position: this.tempVec1!,
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
      this.tempVec2!.x = -clockwiseSpeed * Math.sin(angle);
      this.tempVec2!.y = clockwiseSpeed * Math.cos(angle);
      body.setLinearVelocity(this.tempVec2!);

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
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;
    const maxAccumulator = this.fixedTimeStep * 4;
    this.accumulator = Math.min(this.accumulator, maxAccumulator);

    while (this.accumulator >= this.fixedTimeStep) {
      this.stepPhysics();
      this.accumulator -= this.fixedTimeStep;
    }

    this.sendBodyUpdates();

    requestAnimationFrame(() => this.animate());
  }

  private stepPhysics() {
    if (!this.world || !planck) return;

    const attractorStrength = this.settings.gravity * 8;

    this.bodies.forEach(({ body }) => {
      const pos = body.getPosition();

      this.tempVec1!.x = this.center.x - pos.x;
      this.tempVec1!.y = this.center.y - pos.y;

      const distanceSquared =
        this.tempVec1!.x * this.tempVec1!.x +
        this.tempVec1!.y * this.tempVec1!.y;

      if (distanceSquared > 1) {
        const distance = Math.sqrt(distanceSquared);
        this.tempVec2!.x = (this.tempVec1!.x / distance) * attractorStrength;
        this.tempVec2!.y = (this.tempVec1!.y / distance) * attractorStrength;
        body.applyForceToCenter(this.tempVec2!);
      }
    });

    const physicsTimeStep = this.fixedTimeStep * this.settings.timeStep;
    this.world.step(physicsTimeStep);
  }

  private sendBodyUpdates() {
    const bodyData = this.bodies.map((physicsBody) => {
      const pos = physicsBody.body.getPosition();
      const angle = physicsBody.body.getAngle();
      const rotation = (angle * 180) / Math.PI;
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
      self.postMessage({
        type: "BODY_UPDATE",
        payload: bodyData,
      });
      this.lastBodyData = bodyData;
      this.skipUpdateFrames = 0;
    } else {
      const significantChanges = this.findSignificantChanges(bodyData);
      if (significantChanges.length > 0) {
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
    const threshold = 0.5;
    const changes: PhysicsBodyData[] = [];

    for (let i = 0; i < newData.length; i++) {
      const newBody = newData[i];
      const oldBody = this.lastBodyData[i];

      if (
        !oldBody ||
        Math.abs(newBody.x - oldBody.x) > threshold ||
        Math.abs(newBody.y - oldBody.y) > threshold ||
        Math.abs(newBody.rotation - oldBody.rotation) > 1 ||
        newBody.isDragged !== oldBody.isDragged
      ) {
        changes.push(newBody);
      }
    }

    return changes;
  }

  updateSettings(newSettings: Partial<PhysicsSettings>) {
    const oldBodySize = this.settings.bodySize;
    const oldBodySizeVariance = this.settings.bodySizeVariance;
    const oldCenterCircleRadius = this.settings.centerCircleRadius;
    const oldBodiesStartRadius = this.settings.bodiesStartRadius;
    const oldBodiesStartSpread = this.settings.bodiesStartSpread;
    this.settings = { ...this.settings, ...newSettings };

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
        this.tempVec1!.x = currentPositions[index].x;
        this.tempVec1!.y = currentPositions[index].y;
        physicsBody.body.setPosition(this.tempVec1!);
      }
    });
  }

  private repositionBodies() {
    this.bodies.forEach((physicsBody, index) => {
      const angle = (index * 2 * Math.PI) / this.bodies.length;

      const baseRadius =
        Math.min(this.dimensions.width, this.dimensions.height) *
        this.settings.bodiesStartRadius;
      const radiusVariation =
        this.bodies.length > 50
          ? Math.random() * this.settings.bodiesStartSpread -
            this.settings.bodiesStartSpread / 2
          : 0;
      const radius = baseRadius * (1 + radiusVariation);

      const x = this.center.x + Math.cos(angle) * radius;
      const y = this.center.y + Math.sin(angle) * radius;

      this.tempVec1!.x = x;
      this.tempVec1!.y = y;
      physicsBody.body.setPosition(this.tempVec1!);

      const clockwiseSpeed = this.settings.initialClockwiseVelocity;
      this.tempVec2!.x = -clockwiseSpeed * Math.sin(angle);
      this.tempVec2!.y = clockwiseSpeed * Math.cos(angle);
      physicsBody.body.setLinearVelocity(this.tempVec2!);
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

    const biasLength = Math.sqrt(
      biasDirection.x * biasDirection.x + biasDirection.y * biasDirection.y,
    );
    if (biasLength > 0) {
      biasDirection.x /= biasLength;
      biasDirection.y /= biasLength;
    }

    this.bodies.forEach(({ body }) => {
      const pos = body.getPosition();

      this.tempVec1!.x = pos.x - shockwaveCenter.x;
      this.tempVec1!.y = pos.y - shockwaveCenter.y;

      const distance = Math.sqrt(
        this.tempVec1!.x * this.tempVec1!.x +
          this.tempVec1!.y * this.tempVec1!.y,
      );

      if (distance > maxDistance || distance < 1) return;

      const direction = {
        x: this.tempVec1!.x / distance,
        y: this.tempVec1!.y / distance,
      };

      const finalDirection = {
        x:
          direction.x * (1 - directionality) + biasDirection.x * directionality,
        y:
          direction.y * (1 - directionality) + biasDirection.y * directionality,
      };

      const finalLength = Math.sqrt(
        finalDirection.x * finalDirection.x +
          finalDirection.y * finalDirection.y,
      );
      if (finalLength > 0) {
        finalDirection.x /= finalLength;
        finalDirection.y /= finalLength;
      }

      const normalizedDistance = distance / maxDistance;
      const decayMultiplier = Math.pow(1 - normalizedDistance, decayFactor);
      const forceMultiplier = baseForce * decayMultiplier;

      const biasAlignment =
        finalDirection.x * biasDirection.x + finalDirection.y * biasDirection.y;
      const biasBoost = 1 + biasAlignment * 0.3;

      const finalForce = forceMultiplier * biasBoost;

      const impulseStrength = finalForce * 0.1;
      this.tempVec2!.x = finalDirection.x * impulseStrength;
      this.tempVec2!.y = finalDirection.y * impulseStrength;

      const currentVel = body.getLinearVelocity();
      this.tempVec3!.x = currentVel.x + this.tempVec2!.x;
      this.tempVec3!.y = currentVel.y + this.tempVec2!.y;
      body.setLinearVelocity(this.tempVec3!);

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

    const biasLength = Math.sqrt(
      biasDirection.x * biasDirection.x + biasDirection.y * biasDirection.y,
    );
    if (biasLength > 0) {
      biasDirection.x /= biasLength;
      biasDirection.y /= biasLength;
    }

    this.bodies.forEach(({ body }) => {
      const pos = body.getPosition();

      this.tempVec1!.x = pos.x - shockwaveCenter.x;
      this.tempVec1!.y = pos.y - shockwaveCenter.y;

      const distance = Math.sqrt(
        this.tempVec1!.x * this.tempVec1!.x +
          this.tempVec1!.y * this.tempVec1!.y,
      );

      if (distance > maxDistance || distance < 1) return;

      const direction = {
        x: this.tempVec1!.x / distance,
        y: this.tempVec1!.y / distance,
      };

      const finalDirection = {
        x:
          direction.x * (1 - directionality) + biasDirection.x * directionality,
        y:
          direction.y * (1 - directionality) + biasDirection.y * directionality,
      };

      const finalLength = Math.sqrt(
        finalDirection.x * finalDirection.x +
          finalDirection.y * finalDirection.y,
      );
      if (finalLength > 0) {
        finalDirection.x /= finalLength;
        finalDirection.y /= finalLength;
      }

      const normalizedDistance = distance / maxDistance;
      const decayMultiplier = Math.pow(1 - normalizedDistance, decayFactor);

      const biasAlignment =
        finalDirection.x * biasDirection.x + finalDirection.y * biasDirection.y;
      const biasBoost = 1 + biasAlignment * 0.15;

      const finalForce = baseForce * decayMultiplier * biasBoost;

      const impulseStrength = finalForce * 0.1;
      this.tempVec2!.x = finalDirection.x * impulseStrength;
      this.tempVec2!.y = finalDirection.y * impulseStrength;

      const currentVel = body.getLinearVelocity();
      this.tempVec3!.x = currentVel.x + this.tempVec2!.x;
      this.tempVec3!.y = currentVel.y + this.tempVec2!.y;
      body.setLinearVelocity(this.tempVec3!);

      body.setAwake(true);
      const angularImpulse = (Math.random() - 0.5) * impulseStrength * 0.02;
      body.applyAngularImpulse(angularImpulse);
    });
  }

  destroy() {
    this.isRunning = false;

    if (this.world) {
      for (let b = this.world.getBodyList(); b; b = b.getNext()) {
        this.world.destroyBody(b);
      }
    }
    this.world = null;
    this.bodies = [];
    this.groundBody = null;
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

    case "DESTROY":
      simulation?.destroy();
      simulation = null;
      break;
  }
};
