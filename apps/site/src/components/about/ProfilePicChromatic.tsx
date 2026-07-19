"use client";

import { useEffect, useRef, useState } from "react";

const alt = "Portrait of Chase Cee";
const EFFECT_MULTIPLIER = 2.5;
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
uniform vec2 u_resolution;
uniform vec2 u_offset;
uniform float u_strength;
uniform float u_noise;
uniform float u_time;

float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec2 shift = (u_offset / max(u_resolution, vec2(1.0))) * u_strength;
  float grain = (rand(uv * 1200.0 + vec2(u_time * 0.15, u_time * 0.07)) - 0.5) * u_noise;
  vec2 grainVec = vec2(grain, -grain);

  float r = texture2D(u_texture, clamp(uv + shift + grainVec, 0.0, 1.0)).r;
  float g = texture2D(u_texture, clamp(uv + grainVec * 0.5, 0.0, 1.0)).g;
  float b = texture2D(u_texture, clamp(uv - shift - grainVec, 0.0, 1.0)).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

type XY = { x: number; y: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function ProfilePicChromatic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

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
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const offsetLocation = gl.getUniformLocation(program, "u_offset");
    const strengthLocation = gl.getUniformLocation(program, "u_strength");
    const noiseLocation = gl.getUniformLocation(program, "u_noise");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const textureLocation = gl.getUniformLocation(program, "u_texture");
    if (
      positionLocation < 0 ||
      !resolutionLocation ||
      !offsetLocation ||
      !strengthLocation ||
      !noiseLocation ||
      !timeLocation ||
      !textureLocation
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

    const currentOffset: XY = { x: 0, y: 0 };
    const targetOffset: XY = { x: 0, y: 0 };
    let currentStrength = 0;
    let targetStrength = 0;
    let isHovering = false;
    let isPointerDown = false;
    let rafId = 0;
    let lastTimestamp = 0;

    const applyPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      const x = (clientX / viewportWidth) * 2 - 1;
      const y = (clientY / viewportHeight) * 2 - 1;
      const maxShift = Math.min(rect.width, rect.height) * 0.022 * EFFECT_MULTIPLIER;
      targetOffset.x = clamp(x, -1, 1) * maxShift;
      targetOffset.y = clamp(-y, -1, 1) * maxShift;
      targetStrength = isPointerDown ? 1 : 0.72;
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

      const easing = 1 - Math.exp(-delta / 70);
      currentOffset.x += (targetOffset.x - currentOffset.x) * easing;
      currentOffset.y += (targetOffset.y - currentOffset.y) * easing;
      currentStrength += (targetStrength - currentStrength) * easing;

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(offsetLocation, currentOffset.x, currentOffset.y);
      gl.uniform1f(strengthLocation, currentStrength);
      gl.uniform1f(
        noiseLocation,
        0.01 * EFFECT_MULTIPLIER * (0.35 + currentStrength * 0.65),
      );
      gl.uniform1f(timeLocation, timestamp * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = window.requestAnimationFrame(draw);
    };

    const onPointerEnter = () => {
      isHovering = true;
      targetStrength = Math.max(targetStrength, 0.35);
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
        targetOffset.x = 0;
        targetOffset.y = 0;
        targetStrength = 0;
      } else {
        targetStrength = 0.32;
      }
    };
    const onPointerLeave = () => {
      isHovering = false;
      isPointerDown = false;
      targetOffset.x = 0;
      targetOffset.y = 0;
      targetStrength = 0;
    };

    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointercancel", releasePointer);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointermove", onWindowPointerMove);

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    const image = new Image();
    image.src = "/me.webp";
    image.decoding = "async";
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      rafId = window.requestAnimationFrame(draw);
    };

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
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <img
        src="/me.webp"
        alt={alt}
        width={1200}
        height={1200}
        className="m-0 block aspect-square w-full object-cover"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className="m-0 block aspect-square w-full touch-none"
    />
  );
}
