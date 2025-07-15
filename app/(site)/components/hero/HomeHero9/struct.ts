export const MAX_BODIES = 1024;

// Each body has: x, y, angle, radius, vx, vy, color
// (2 + 1 + 1 + 2) floats = 6 floats * 4 bytes/float = 24 bytes
// 1 uint32 for color = 4 bytes
// Total = 28 bytes per body. Let's align to 32 for performance.

const FLOATS_PER_BODY = 7; // x, y, angle, radius, vx, vy, (padding)
const BYTES_PER_FLOAT = 4;
const UINTS_PER_BODY = 1; // color
const BYTES_PER_UINT = 4;

// We'll use a single buffer with different views, but keep slots aligned.
// A slot will be 32 bytes:
// - 0-15: pos (x,y), size(radius), angle
// - 16-27: vel (vx, vy)
// - 28-31: color (uint32)
// This is not ideal because of mixed types.
// A better approach is separate buffers for each attribute (Structure of Arrays).
// But the prompt implies a single buffer with `makeSlabs(buf)`.
// "returns Float32 arrays for pos/angle/size/vel plus Uint32 color"
// This suggests a single buffer is not ideal. I will use a structure of arrays instead.
// I will create a single ArrayBuffer and then create views for each attribute.
// Let's reconsider. "typed-array slab layout" and "makeSlabs(buf)"
// This suggests one large buffer.
// Let's use interleaved layout for better cache locality for position data.

// Stride: how many array elements to skip to get to the next body's same attribute.
// For Structure of Arrays (SoA):
// pos: [x1, y1, x2, y2, ...]
// angle: [a1, a2, ...]
// SoA is better for the instanced drawing this project is moving to.

// Let's define the structure for SoA.
export const BYTES_PER_BODY = {
  positions: 2 * BYTES_PER_FLOAT, // x, y
  angles: 1 * BYTES_PER_FLOAT,
  radii: 1 * BYTES_PER_FLOAT,
  velocities: 2 * BYTES_PER_FLOAT, // vx, vy
  colors: 1 * BYTES_PER_UINT,
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
