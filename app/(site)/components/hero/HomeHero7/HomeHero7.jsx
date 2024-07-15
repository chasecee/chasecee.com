"use client";
import "./HomeHero7.css"; // Import the CSS file
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import TypingText from "../TypingText/TypingText.jsx"; // Import the TypingText component

const HomeHero7 = () => {
  const [scrolled, setScrolled] = useState(false);
  const blobRefs = useRef([
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef(),
  ]);
  const containerRef = useRef(null);
  const blobsContainerRef = useRef(null);
  const requestRef = useRef(null);

  const FACTORS = useMemo(() => [-0.2, -0.1, -0.16, 0.9], []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    setScrolled(true);
    const scrollY = window.scrollY;
    const { top, height } = containerRef.current.getBoundingClientRect();
    const centerY = top + height / 2;

    blobRefs.current.forEach((blobRef, index) => {
      if (blobRef.current) {
        const offsetY = scrollY - centerY;
        blobRef.current.style.transform = `translateY(${offsetY * FACTORS[index]}px)`;
      }
    });
  }, [FACTORS]);

  const debouncedHandleScroll = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    window.addEventListener("scroll", debouncedHandleScroll);
    return () => {
      window.removeEventListener("scroll", debouncedHandleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [debouncedHandleScroll]);

  return (
    <div
      ref={containerRef}
      className="center-container intro relative mb-20 mt-24 flex aspect-square max-h-[80vh] flex-col items-center justify-center overflow-hidden rounded-xl [clip-path:inset(0)] lg:aspect-[16/7]"
    >
      <div
        ref={blobsContainerRef}
        className={`blobs-container ${scrolled ? "fade-in-up" : ""}`}
      >
        {blobRefs.current.map((blobRef, index) => (
          <div key={index} className="blob-wrapper origin-[33%]">
            <div id={`blob${index + 1}`} className="blob" ref={blobRef}></div>
          </div>
        ))}
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
          {/* <feDiffuseLighting in="noise" lighting-color="black" surfaceScale="2">
            <feDistantLight azimuth="45" elevation="600" />
          </feDiffuseLighting> */}
        </filter>
      </svg>
      <h1 className="title relative z-[1] text-center text-[clamp(20px,7vw,100px)]">
        <TypingText text="Making websites sing." />
      </h1>
    </div>
  );
};

export default HomeHero7;
