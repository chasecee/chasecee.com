"use client";

import { useEffect, useRef, useState } from "react";
import ProfilePicDevControls, {
  type ProfilePicDevParams,
} from "./ProfilePicDevControls";

const alt = "Portrait of Chase Cee";
const IS_DEV = import.meta.env.DEV;
const MIN_CELLS = 1;
const MAX_CELLS = 24;
const DEFAULT_PARAMS: ProfilePicDevParams = {
  cells: 14,
  strength: 2.2,
  radius: 0.32,
  easeMs: 72,
  lineOpacity: 0.4,
  showGrid: true,
};

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_focus;
uniform float u_strength;
uniform float u_radius;
uniform float u_cells;
uniform float u_line_opacity;

const int MAX_GRID_CELLS = 24;

float remapAxis(float pos, float focus, float cells, float strength, float radius) {
  float weights[MAX_GRID_CELLS];
  float total = 0.0;

  for (int i = 0; i < MAX_GRID_CELLS; i++) {
    if (float(i) >= cells) {
      break;
    }
    float center = (float(i) + 0.5) / cells;
    float dist = abs(center - focus);
    float influence = 1.0 - smoothstep(0.0, max(radius, 0.0001), dist);
    float weight = 1.0 + strength * influence;
    weights[i] = weight;
    total += weight;
  }

  float startEdge = 0.0;
  for (int i = 0; i < MAX_GRID_CELLS; i++) {
    if (float(i) >= cells) {
      break;
    }
    float endEdge = startEdge + (weights[i] / max(total, 0.0001));
    if (pos <= endEdge || float(i) >= cells - 1.0) {
      float local = (pos - startEdge) / max(endEdge - startEdge, 0.00001);
      return (float(i) + clamp(local, 0.0, 1.0)) / cells;
    }
    startEdge = endEdge;
  }

  return pos;
}

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  float cells = clamp(floor(u_cells + 0.5), 1.0, float(MAX_GRID_CELLS));

  vec2 sourceUv = vec2(
    remapAxis(uv.x, clamp(u_focus.x, 0.0, 1.0), cells, max(u_strength, 0.0), u_radius),
    remapAxis(uv.y, clamp(u_focus.y, 0.0, 1.0), cells, max(u_strength, 0.0), u_radius)
  );

  vec4 color = texture2D(u_texture, clamp(sourceUv, 0.0, 1.0));
  vec2 grid = abs(fract(sourceUv * cells) - 0.5);
  float line = 1.0 - smoothstep(0.49, 0.5, max(grid.x, grid.y));
  color.rgb = mix(color.rgb, vec3(0.0), clamp(u_line_opacity, 0.0, 1.0) * line);

  gl_FragColor = color;
}
`;

type XY = {
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function ProfilePic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<ProfilePicDevParams>(DEFAULT_PARAMS);
  const [controls, setControls] = useState<ProfilePicDevParams>(DEFAULT_PARAMS);
  const [isMounted, setIsMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const updateControls = (next: ProfilePicDevParams) => {
    const sanitized: ProfilePicDevParams = {
      cells: Math.round(clamp(next.cells, MIN_CELLS, MAX_CELLS)),
      strength: clamp(next.strength, 0, 4),
      radius: clamp(next.radius, 0.05, 1.25),
      easeMs: clamp(next.easeMs, 16, 260),
      lineOpacity: clamp(next.lineOpacity, 0, 1),
      showGrid: next.showGrid,
    };
    paramsRef.current = sanitized;
    if (IS_DEV) {
      setControls(sanitized);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setIsTouch(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    if (positionLocation < 0) return;

    const textureLocation = gl.getUniformLocation(program, "u_texture");
    const focusLocation = gl.getUniformLocation(program, "u_focus");
    const strengthLocation = gl.getUniformLocation(program, "u_strength");
    const radiusLocation = gl.getUniformLocation(program, "u_radius");
    const cellsLocation = gl.getUniformLocation(program, "u_cells");
    const lineOpacityLocation = gl.getUniformLocation(program, "u_line_opacity");
    if (
      !textureLocation ||
      !focusLocation ||
      !strengthLocation ||
      !radiusLocation ||
      !cellsLocation ||
      !lineOpacityLocation
    ) {
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    if (!texture) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(textureLocation, 0);

    const currentFocus: XY = { x: 0.5, y: 0.5 };
    const targetFocus: XY = { x: 0.5, y: 0.5 };
    let currentStrength = 0;
    let targetStrength = 0;
    let isHovering = false;
    let isPointerDown = false;
    let rafId = 0;
    let lastTimestamp = 0;

    const applyPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      targetFocus.x = x;
      targetFocus.y = 1 - y;
      const { strength } = paramsRef.current;
      targetStrength = isPointerDown ? strength * 1.08 : strength;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const draw = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = Math.min(64, timestamp - lastTimestamp);
      lastTimestamp = timestamp;

      const { easeMs, radius, cells, lineOpacity, showGrid } = paramsRef.current;
      const easing = 1 - Math.exp(-delta / Math.max(16, easeMs));
      currentFocus.x += (targetFocus.x - currentFocus.x) * easing;
      currentFocus.y += (targetFocus.y - currentFocus.y) * easing;
      currentStrength += (targetStrength - currentStrength) * easing;

      gl.uniform2f(focusLocation, currentFocus.x, currentFocus.y);
      gl.uniform1f(strengthLocation, currentStrength);
      gl.uniform1f(radiusLocation, radius);
      gl.uniform1f(cellsLocation, cells);
      gl.uniform1f(lineOpacityLocation, IS_DEV && showGrid ? lineOpacity : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = window.requestAnimationFrame(draw);
    };

    const onPointerEnter = () => {
      isHovering = true;
      targetStrength = Math.max(targetStrength, paramsRef.current.strength * 0.6);
    };
    const onPointerDown = (event: PointerEvent) => {
      isPointerDown = true;
      canvas.setPointerCapture(event.pointerId);
      applyPointer(event.clientX, event.clientY);
    };
    const onWindowPointerMove = (event: PointerEvent) => {
      if (!isHovering && !isPointerDown) return;
      applyPointer(event.clientX, event.clientY);
    };
    const releasePointer = () => {
      isPointerDown = false;
      if (!isHovering) {
        targetFocus.x = 0.5;
        targetFocus.y = 0.5;
        targetStrength = 0;
      } else {
        targetStrength = paramsRef.current.strength * 0.65;
      }
    };
    const onPointerLeave = () => {
      isHovering = false;
      isPointerDown = false;
      targetFocus.x = 0.5;
      targetFocus.y = 0.5;
      targetStrength = 0;
    };

    if (!isTouch) {
      canvas.addEventListener("pointerenter", onPointerEnter);
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointerup", releasePointer);
      canvas.addEventListener("pointercancel", releasePointer);
      canvas.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("pointermove", onWindowPointerMove);
    }

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    const image = new Image();
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      rafId = window.requestAnimationFrame(draw);
    };
    image.decoding = "async";
    image.onload = start;
    image.src = "/me.webp";
    if (image.complete && image.naturalWidth > 0) {
      start();
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", releasePointer);
      canvas.removeEventListener("pointercancel", releasePointer);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointermove", onWindowPointerMove);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [reducedMotion, isTouch]);

  if (reducedMotion) {
    return (
      <img
        src="/me.webp"
        alt={alt}
        width={1200}
        height={1200}
        className="m-0 block aspect-square w-full object-cover select-none [-webkit-touch-callout:none]"
        draggable={false}
      />
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className={`m-0 block aspect-square w-full select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] ${
          isTouch ? "pointer-events-none" : "touch-none"
        }`}
      />
      {IS_DEV && isMounted ? (
        <ProfilePicDevControls values={controls} onChange={updateControls} />
      ) : null}
    </>
  );
}
