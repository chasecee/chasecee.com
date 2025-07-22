export const GLSL_FLOAT_PRECISION = "lowp";

export function createContext(
  canvas: OffscreenCanvas,
): WebGL2RenderingContext | null {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!gl) {
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
  console.error("Shader compile error:", gl.getShaderInfoLog(shader));
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
  console.error("Program link error:", gl.getProgramInfoLog(program));
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
precision ${GLSL_FLOAT_PRECISION} float;

in vec2 a_position;
in float a_angle;
in float a_radius;
in vec4 a_color;

uniform mat4 u_projection;

out vec4 v_color;
out float v_radius;

void main() {
  gl_Position = u_projection * vec4(a_position, 0, 1);
  gl_PointSize = a_radius * 2.0;
  v_color = a_color;
  v_radius = a_radius + a_angle * 0.0;
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision ${GLSL_FLOAT_PRECISION} float;

in vec4 v_color;
in float v_radius;

out vec4 out_color;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float distance = length(coord);

  float smooth_width = fwidth(distance);
  float alpha = 1.0 - smoothstep(0.5 - smooth_width, 0.5, distance);

  if (alpha < 0.01) {
    discard;
  }

  out_color = vec4(v_color.rgb, v_color.a * alpha);
}
`;

export const QUAD_VERTEX_SHADER_SOURCE = `#version 300 es
precision ${GLSL_FLOAT_PRECISION} float;

in vec2 a_corner;
in vec2 a_position;
in float a_angle;
in float a_radius;
in vec4 a_color;

uniform mat4 u_projection;

out vec2 v_corner;
out vec4 v_color;

void main() {
  vec2 rotatedCorner = vec2(
    a_corner.x * cos(a_angle) - a_corner.y * sin(a_angle),
    a_corner.x * sin(a_angle) + a_corner.y * cos(a_angle)
  );
  vec2 worldPos = a_position + rotatedCorner * a_radius;
  gl_Position = u_projection * vec4(worldPos, 0.0, 1.0);
  v_corner = a_corner;
  v_color = a_color;
}`;

export const QUAD_FRAGMENT_SHADER_SOURCE = `#version 300 es
precision ${GLSL_FLOAT_PRECISION} float;

in vec2 v_corner;
in vec4 v_color;

uniform int u_sides;

out vec4 out_color;

void main() {
  float dist;
  if (u_sides <= 0) {
    dist = length(v_corner);
  } else {
    const float PI = 3.141592653589793;
    const float TAU = 6.283185307179586;
    float sides = float(u_sides);
    vec2 p = v_corner;
    float angle = atan(p.y, p.x) + PI;
    float r = length(p);
    float sector = TAU / sides;
    float d = cos(sector * 0.5) / cos(mod(angle, sector) - sector * 0.5);
    dist = r / d;
  }

  float smooth_width = fwidth(dist);
  float alpha = 1.0 - smoothstep(1.0 - smooth_width, 1.0, dist);
  if (alpha < 0.01) discard;
  out_color = vec4(v_color.rgb, alpha);
}`;
