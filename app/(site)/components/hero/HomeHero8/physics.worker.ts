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
}

class PhysicsSimulation {
  private world: World | null = null;
  private bodies: PhysicsBody[] = [];
  private groundBody: Body | null = null;
  private mouseJoint: any = null;
  private draggedBody: Body | null = null;
  private dimensions = { width: 800, height: 600 };
  private center = { x: 400, y: 300 };
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private fixedTimeStep = 1 / 60;
  private settings: PhysicsSettings = {} as PhysicsSettings;

  private isGridMode = false;
  private gridTargets: { x: number; y: number }[] = [];

  private tempVec1: Vec2 | null = null;
  private tempVec2: Vec2 | null = null;
  private tempVec3: Vec2 | null = null;
  private tempVec4: Vec2 | null = null;
  private centerVec: Vec2 | null = null;

  private frameCount = 0;
  private physicsTime = 0;
  private messageTime = 0;
  private lastFpsReport = 0;

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

    this.createBoundaries();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
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
      groundBody.createFixture(
        planck.Box(wall.w, wall.h, planck.Vec2(wall.x, wall.y), 0),
      );
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

      this.tempVec2!.x = 0;
      this.tempVec2!.y = 0;
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

    const physicsStartTime = performance.now();

    if (this.isGridMode) {
      let appliedForces = 0;
      this.bodies.forEach(({ body }, index) => {
        if (body === this.draggedBody || !this.gridTargets[index]) return;

        const pos = body.getPosition();
        const target = this.gridTargets[index];

        this.tempVec1!.x = target.x - pos.x;
        this.tempVec1!.y = target.y - pos.y;

        const distanceSquared =
          this.tempVec1!.x * this.tempVec1!.x +
          this.tempVec1!.y * this.tempVec1!.y;
        const distance = Math.sqrt(distanceSquared);

        if (distance > 1) {
          const normalizedDistance = Math.min(distance / 200, 1);
          const easeCurve = 1 - Math.pow(1 - normalizedDistance, 3);
          const baseMagneticStrength = 3500;
          const magneticStrength =
            baseMagneticStrength * (0.3 + easeCurve * 0.7);

          this.tempVec2!.x = this.tempVec1!.x * magneticStrength;
          this.tempVec2!.y = this.tempVec1!.y * magneticStrength;
          body.applyForceToCenter(this.tempVec2!);

          const velocity = body.getLinearVelocity();
          const dampingStrength = 15 + (1 - normalizedDistance) * 25;
          this.tempVec3!.x = -velocity.x * dampingStrength;
          this.tempVec3!.y = -velocity.y * dampingStrength;
          body.applyForceToCenter(this.tempVec3!);

          appliedForces++;
        } else {
          const velocity = body.getLinearVelocity();
          const velMagnitude = Math.sqrt(
            velocity.x * velocity.x + velocity.y * velocity.y,
          );

          if (velMagnitude < 5) {
            this.tempVec1!.x = target.x;
            this.tempVec1!.y = target.y;
            body.setPosition(this.tempVec1!);
            this.tempVec2!.x = 0;
            this.tempVec2!.y = 0;
            body.setLinearVelocity(this.tempVec2!);
            body.setAngle(0);
            body.setAngularVelocity(0);
          } else {
            this.tempVec3!.x = -velocity.x * 50;
            this.tempVec3!.y = -velocity.y * 50;
            body.applyForceToCenter(this.tempVec3!);
          }
        }
      });
    } else {
      const attractorStrength = this.settings.gravity * 8;

      this.bodies.forEach(({ body }) => {
        if (body === this.draggedBody) return;

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
    }

    const physicsTimeStep = this.fixedTimeStep * this.settings.timeStep;
    this.world.step(physicsTimeStep);

    this.physicsTime += performance.now() - physicsStartTime;
  }

  private sendBodyUpdates() {
    const messageStartTime = performance.now();

    const bodyData = this.bodies.map((physicsBody) => {
      const pos = physicsBody.body.getPosition();
      const angle = physicsBody.body.getAngle();
      const rotation = (angle * 180) / Math.PI;
      const isDragged = physicsBody.body === this.draggedBody;

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
      this.lastBodyData.length === 0 ||
      this.draggedBody !== null;

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

    this.messageTime += performance.now() - messageStartTime;
    this.frameCount++;

    if (performance.now() - this.lastFpsReport > 2000) {
      const fps = this.frameCount / 2;
      const avgPhysicsTime = this.physicsTime / this.frameCount;
      const avgMessageTime = this.messageTime / this.frameCount;

      console.log(
        `🚀 Physics Performance: ${fps.toFixed(1)}fps | Physics: ${avgPhysicsTime.toFixed(2)}ms | Messages: ${avgMessageTime.toFixed(2)}ms`,
      );

      this.frameCount = 0;
      this.physicsTime = 0;
      this.messageTime = 0;
      this.lastFpsReport = performance.now();
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

      this.tempVec2!.x = 0;
      this.tempVec2!.y = 0;
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

  startDrag(x: number, y: number) {
    if (!this.world || !planck) return;

    this.tempVec1!.x = x;
    this.tempVec1!.y = y;

    this.tempVec2!.x = x - 0.1;
    this.tempVec2!.y = y - 0.1;
    const aabbMin = this.tempVec2!;

    this.tempVec3!.x = x + 0.1;
    this.tempVec3!.y = y + 0.1;
    const aabbMax = this.tempVec3!;

    let hitBody: Body | null = null;
    this.world.queryAABB(planck.AABB(aabbMin, aabbMax), (fixture: any) => {
      const body = fixture.getBody() as Body;
      if (body.isDynamic() && fixture.testPoint(this.tempVec1!)) {
        hitBody = body;
        return false;
      }
      return true;
    });

    if (hitBody) {
      (hitBody as Body).setAwake(true);

      this.tempVec1!.x = x;
      this.tempVec1!.y = y;

      const joint = planck.MouseJoint({
        bodyA: this.groundBody!,
        bodyB: hitBody,
        target: this.tempVec1!,
        maxForce: 1000 * (hitBody as Body).getMass(),
      });
      this.mouseJoint = this.world.createJoint(joint);
      this.draggedBody = hitBody;

      self.postMessage({
        type: "DRAG_START",
        payload: true,
      });
    }
  }

  updateDrag(x: number, y: number) {
    if (this.mouseJoint && planck) {
      this.tempVec4!.x = x;
      this.tempVec4!.y = y;
      this.mouseJoint.setTarget(this.tempVec4!);
    }
  }

  endDrag() {
    if (this.mouseJoint && this.world) {
      this.world.destroyJoint(this.mouseJoint);
      this.mouseJoint = null;
    }
    if (this.draggedBody) {
      this.draggedBody = null;
      self.postMessage({
        type: "DRAG_END",
        payload: false,
      });
    }
  }

  reset() {
    if (!this.world || !planck) return;

    this.isGridMode = false;
    this.gridTargets = [];

    this.bodies.forEach(({ body }) => {
      const fixture = body.getFixtureList();
      if (fixture) {
        fixture.setSensor(false);
      }
    });
    console.log("🔄 Reset: Collisions RE-ENABLED - normal physics restored");

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

      this.tempVec2!.x = 0;
      this.tempVec2!.y = 0;
      physicsBody.body.setLinearVelocity(this.tempVec2!);

      physicsBody.body.setAngularVelocity(0);
      physicsBody.body.setAngle(0);
      physicsBody.body.setAwake(true);
    });
  }

  solve() {
    if (!this.world || !planck) return;

    this.isGridMode = false;
    this.gridTargets = [];

    this.bodies.forEach(({ body }) => {
      const fixture = body.getFixtureList();
      if (fixture) {
        fixture.setSensor(false);
      }
    });
    console.log("🔄 Solve: Collisions RE-ENABLED - normal physics restored");

    const formationRadius =
      Math.min(this.dimensions.width, this.dimensions.height) *
      (this.settings.bodiesStartRadius * 0.4);
    const angleStep = (2 * Math.PI) / this.bodies.length;

    this.bodies.forEach((bodyItem, index) => {
      const angle = index * angleStep;
      const targetX = this.center.x + Math.cos(angle) * formationRadius;
      const targetY = this.center.y + Math.sin(angle) * formationRadius;

      const body = bodyItem.body;
      const currentPos = body.getPosition();

      this.tempVec1!.x = targetX - currentPos.x;
      this.tempVec1!.y = targetY - currentPos.y;
      this.tempVec1!.x *= 3.0;
      this.tempVec1!.y *= 3.0;

      body.setLinearVelocity(this.tempVec1!);
      body.setAngularVelocity(0);
      body.setAwake(true);
    });
  }

  solveGrid() {
    if (!this.world || !planck) return;

    console.log("🎯 SOLVE GRID CALLED - Starting grid layout");

    const numBodies = this.bodies.length;
    const cols = Math.ceil(Math.sqrt(numBodies));
    const rows = Math.ceil(numBodies / cols);

    console.log(`📊 Grid Layout: ${cols}x${rows} for ${numBodies} bodies`);

    const blockSize = this.bodies[0]?.width || 60;

    const gapSize = blockSize * this.settings.gridGapSize;
    const cellWidth = blockSize + gapSize;
    const cellHeight = blockSize + gapSize;

    const totalGridWidth = cols * cellWidth - gapSize;
    const totalGridHeight = rows * cellHeight - gapSize;

    const maxWidth = this.dimensions.width * 0.7;
    const maxHeight = this.dimensions.height * 0.7;

    const scaleX = totalGridWidth > maxWidth ? maxWidth / totalGridWidth : 1;
    const scaleY =
      totalGridHeight > maxHeight ? maxHeight / totalGridHeight : 1;
    const scale = Math.min(scaleX, scaleY);

    const finalCellWidth = cellWidth * scale;
    const finalCellHeight = cellHeight * scale;
    const finalGridWidth = totalGridWidth * scale;
    const finalGridHeight = totalGridHeight * scale;

    const startX = this.center.x - finalGridWidth / 2 + finalCellWidth / 2;
    const startY = this.center.y - finalGridHeight / 2 + finalCellHeight / 2;

    console.log(
      `🎯 Grid positioned at: start(${startX.toFixed(1)}, ${startY.toFixed(1)}), cell(${finalCellWidth.toFixed(1)}, ${finalCellHeight.toFixed(1)})`,
    );

    const sortedBodies = [...this.bodies].sort(
      (a, b) => a.colorIndex - b.colorIndex,
    );

    this.gridTargets = new Array(this.bodies.length);

    sortedBodies.forEach((bodyItem, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const targetX = startX + col * finalCellWidth;
      const targetY = startY + row * finalCellHeight;

      const bodyIndex = this.bodies.findIndex((b) => b.id === bodyItem.id);
      if (bodyIndex !== -1) {
        this.gridTargets[bodyIndex] = { x: targetX, y: targetY };
      }

      bodyItem.body.setAwake(true);
    });

    this.bodies.forEach(({ body }) => {
      const fixture = body.getFixtureList();
      if (fixture) {
        fixture.setSensor(true);
      }
    });

    this.isGridMode = true;
    console.log(
      "🧲 Grid mode ENABLED - Magnetic forces active, collisions DISABLED",
    );
  }

  shockwave(x: number, y: number) {
    if (!this.world || !planck) return;

    console.log(`🌊 SHOCKWAVE triggered at (${x.toFixed(1)}, ${y.toFixed(1)})`);

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

    console.log(
      `🎯 Shockwave bias direction: (${biasDirection.x.toFixed(2)}, ${biasDirection.y.toFixed(2)})`,
    );

    let affectedBodies = 0;

    this.bodies.forEach(({ body }) => {
      if (body === this.draggedBody) return;

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

      affectedBodies++;
    });

    console.log(
      `🌊 Shockwave affected ${affectedBodies} bodies with impulse-based explosion`,
    );
  }

  destroy() {
    this.isRunning = false;
    this.isGridMode = false;
    this.gridTargets = [];

    if (this.world) {
      for (let b = this.world.getBodyList(); b; b = b.getNext()) {
        this.world.destroyBody(b);
      }
    }
    this.world = null;
    this.bodies = [];
    this.groundBody = null;
    this.mouseJoint = null;
    this.draggedBody = null;
  }
}

// Global simulation instance
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

    case "START_DRAG":
      simulation?.startDrag(payload.x, payload.y);
      break;

    case "UPDATE_DRAG":
      simulation?.updateDrag(payload.x, payload.y);
      break;

    case "END_DRAG":
      simulation?.endDrag();
      break;

    case "RESET":
      simulation?.reset();
      break;

    case "SOLVE":
      simulation?.solve();
      break;

    case "SOLVE_GRID":
      simulation?.solveGrid();
      break;

    case "SHOCKWAVE":
      simulation?.shockwave(payload.x, payload.y);
      break;

    case "DESTROY":
      simulation?.destroy();
      simulation = null;
      break;
  }
};
