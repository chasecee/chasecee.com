"use client";
import "./HomeHero7.css"; // Import the CSS file
import React, { useEffect, useRef, useCallback } from "react";

const HomeHero7 = () => {
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);
  const blob4Ref = useRef(null); // Added blob4Ref
  const requestRef = useRef(null);
  const containerRef = useRef(null);
  const mouseMoveRef = useRef({ clientX: 0, clientY: 0 });

  const FACTOR = -0.05;
  const FACTOR1 = -0.2;

  const handleMouseMove = useCallback((event) => {
    mouseMoveRef.current = { clientX: event.clientX, clientY: event.clientY };

    // Add fade-in class to blobs
    if (blob1Ref.current) blob1Ref.current.classList.add("fade-in");
    if (blob2Ref.current) blob2Ref.current.classList.add("fade-in");
    if (blob3Ref.current) blob3Ref.current.classList.add("fade-in");
    if (blob4Ref.current) blob4Ref.current.classList.add("fade-in"); // Added blob4 fade-in
  }, []);

  const animate = useCallback(() => {
    if (!containerRef.current) return;
    const { clientX, clientY } = mouseMoveRef.current;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const offsetX = clientX - centerX;
    const offsetY = clientY - centerY;

    if (blob1Ref.current)
      blob1Ref.current.style.transform = `translate(${offsetX * FACTOR}px, ${offsetY * FACTOR}px)`;
    if (blob2Ref.current)
      blob2Ref.current.style.transform = `translate(${offsetX * FACTOR1}px, ${offsetY * FACTOR1}px)`;
    if (blob3Ref.current)
      blob3Ref.current.style.transform = `translate(${offsetX * FACTOR}px, ${offsetY * FACTOR}px)`;
    if (blob4Ref.current)
      blob4Ref.current.style.transform = `translate(${offsetX * FACTOR}px, ${offsetY * FACTOR}px)`; // Added blob4 animation

    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [animate, handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className="center-container intro relative mb-20 mt-24 flex aspect-[16/6] flex-col items-center justify-center overflow-hidden rounded-xl [clip-path:inset(0)]"
    >
      <div className="blob-wrapper origin-[33%]">
        <div id="blob1" className="blob" ref={blob1Ref}></div>
      </div>
      <div className="blob-wrapper origin-[50%]">
        <div id="blob2" className="blob" ref={blob2Ref}></div>
      </div>
      <div className="blob-wrapper origin-[66%]">
        <div id="blob3" className="blob" ref={blob3Ref}></div>
      </div>
      <div className="blob-wrapper origin-[66%]">
        {" "}
        {/* Added blob4 wrapper */}
        <div id="blob4" className="blob" ref={blob4Ref}></div>
      </div>
      <div id="noiseLayer"></div>
      <svg
        viewBox="0 0 500 500"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "none" }}
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".6"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feDiffuseLighting in="noise" lighting-color="black" surfaceScale="2">
            <feDistantLight azimuth="45" elevation="600" />
          </feDiffuseLighting>
        </filter>
      </svg>
      <h1 className="title relative z-[1] text-[40px]">
        <span className="block text-[2em] font-medium">
          Making websites <span className="font-extrabold">sing.</span>
        </span>
      </h1>
    </div>
  );
};

export default HomeHero7;
