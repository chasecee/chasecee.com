"use client";
import "./HomeHero7.css"; // Import the CSS file
import React from "react";

const HomeHero7 = () => {
  return (
    <div className="center-container intro relative mb-20 mt-24 flex aspect-square max-h-[80vh] flex-col items-center justify-center overflow-hidden rounded-xl [clip-path:inset(0)] lg:aspect-16/7">
      <div className="blobs-container fade-in-up overflow-hidden rounded-xl">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="blob-wrapper origin-[50%]">
            <div id={`blob${index + 1}`} className="blob"></div>
          </div>
        ))}
      </div>
      <div id="noiseLayer" className="hidden dark:block"></div>
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
      <div className="prose max-w-full">
        <h1 className="title relative z-1 text-center text-[clamp(20px,7vw,60px)] text-black dark:text-white">
          Making websites sing.
        </h1>
      </div>
    </div>
  );
};

export default HomeHero7;
