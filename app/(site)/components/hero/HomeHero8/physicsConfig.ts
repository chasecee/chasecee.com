export interface PhysicsConfig {
  gravity: number;
  timeStep: number;
  damping: number;
  friction: number;
  restitution: number;
  numBodies: number;
  bodySize: number;
  bodySizeVariance: number;
  bodiesStartSpread: number;
  bodiesStartRadius: number;
  colorLevel: number;
  gridGapSize: number;
  shockwaveForce: number;
  shockwaveRadius: number;
  shockwaveDecay: number;
  shockwaveDirectionality: number;
  centerCircleRadius: number;
  initialClockwiseVelocity: number;
  scrollForceMultiplier: number;
  scrollVelocityDamping: number;
  scrollInertiaDecay: number;
  scrollDirectionInfluence: number;
}

const DESKTOP_CONFIG: PhysicsConfig = {
  gravity: 80,
  timeStep: 1,
  damping: 0,
  friction: 0,
  restitution: 0,
  numBodies: 500,
  bodySize: 0.55,
  bodySizeVariance: 5,
  bodiesStartSpread: 0.7,
  bodiesStartRadius: 0.6,
  colorLevel: 4,
  gridGapSize: 5,
  shockwaveForce: 1000,
  shockwaveRadius: 0.3,
  shockwaveDecay: 0.8,
  shockwaveDirectionality: 0.2,
  centerCircleRadius: 0.3,
  initialClockwiseVelocity: 2,
  scrollForceMultiplier: 0.5,
  scrollVelocityDamping: 0.95,
  scrollInertiaDecay: 0.92,
  scrollDirectionInfluence: 1.0,
};

const MOBILE_CONFIG: PhysicsConfig = {
  gravity: 40,
  timeStep: 1,
  damping: 0,
  friction: 0.5,
  restitution: 0.1,
  numBodies: 350,
  bodySize: 0.38,
  bodySizeVariance: 0.5,
  bodiesStartRadius: 0.8,
  bodiesStartSpread: 0.4,
  colorLevel: 4,
  gridGapSize: 8,
  shockwaveForce: 1000,
  shockwaveRadius: 0.4,
  shockwaveDecay: 0.9,
  shockwaveDirectionality: 0.3,
  centerCircleRadius: 0.4,
  initialClockwiseVelocity: 5,
  scrollForceMultiplier: 1.5,
  scrollVelocityDamping: 0.88,
  scrollInertiaDecay: 0.85,
  scrollDirectionInfluence: 1.2,
};

export const getPhysicsConfig = (isMobile: boolean): PhysicsConfig => {
  return isMobile ? MOBILE_CONFIG : DESKTOP_CONFIG;
};

export { DESKTOP_CONFIG, MOBILE_CONFIG };
