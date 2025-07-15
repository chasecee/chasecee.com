export function createContext(
  canvas: OffscreenCanvas,
): WebGL2RenderingContext | null {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!gl) {
    console.error("WebGL2 not supported");
  }
  return gl;
}

export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }
  console.error("Error linking program:", gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

export function createVbo(
  gl: WebGL2RenderingContext,
  data: ArrayBuffer,
  usage: number = gl.DYNAMIC_DRAW,
): WebGLBuffer | null {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return vbo;
}

export const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 a_position;    // Instanced: body position
in float a_angle;      // Instanced: body angle
in float a_radius;     // Instanced: body radius
in vec4 a_color;       // Instanced: body color

uniform mat4 u_projection;

out vec4 v_color;
out float v_radius;

void main() {
  gl_Position = u_projection * vec4(a_position, 0, 1);
  gl_PointSize = a_radius * 2.0;
  v_color = a_color;
  // Use a_angle in a no-op calculation to prevent the compiler from optimizing it out.
  v_radius = a_radius + a_angle * 0.0;
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec4 v_color;
in float v_radius;

out vec4 out_color;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float distance = length(coord);

  // Smooth the edge of the circle instead of a hard cut-off.
  // fwidth() gives an estimate of the width of one pixel,
  // allowing us to create a smooth, anti-aliased edge.
  float smooth_width = fwidth(distance);
  float alpha = 1.0 - smoothstep(0.5 - smooth_width, 0.5, distance);

  if (alpha < 0.01) {
    discard;
  }

  out_color = vec4(v_color.rgb, v_color.a * alpha);
}
`;
