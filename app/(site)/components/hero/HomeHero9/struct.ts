export const MAX_BODIES = 1024;
export const BYTES_PER_BODY = {
  positions: 2 * 4,
  angles: 1 * 4,
  radii: 1 * 4,
  velocities: 2 * 4,
  colors: 1 * 4,
};

export const TOTAL_BYTES =
  MAX_BODIES *
  (BYTES_PER_BODY.positions +
    BYTES_PER_BODY.angles +
    BYTES_PER_BODY.radii +
    BYTES_PER_BODY.velocities +
    BYTES_PER_BODY.colors);

export type PhysicsSlabs = {
  buffer: ArrayBuffer;
  positions: Float32Array;
  angles: Float32Array;
  radii: Float32Array;
  velocities: Float32Array;
  colors: Uint32Array;
};

export function makeSlabs(buffer?: ArrayBuffer): PhysicsSlabs {
  const buf = buffer || new ArrayBuffer(TOTAL_BYTES);

  let offset = 0;

  const positions = new Float32Array(buf, offset, MAX_BODIES * 2);
  offset += positions.byteLength;

  const angles = new Float32Array(buf, offset, MAX_BODIES * 1);
  offset += angles.byteLength;

  const radii = new Float32Array(buf, offset, MAX_BODIES * 1);
  offset += radii.byteLength;

  const velocities = new Float32Array(buf, offset, MAX_BODIES * 2);
  offset += velocities.byteLength;

  const colors = new Uint32Array(buf, offset, MAX_BODIES * 1);

  return {
    buffer: buf,
    positions,
    angles,
    radii,
    velocities,
    colors,
  };
}
