"use client";

import React, { useState } from "react";
import HomeHero from "./hero/HomeHero";
import Diamond from "./svg/Diamond";

const HueRotateComponent = () => {
  const [hue, setHue] = useState(0);

  const handleMouseMove = (e) => {
    const xRatio = e.clientX / window.innerWidth;
    const yRatio = e.clientY / window.innerHeight;
    const newHue = (xRatio + yRatio) * 180; // Adjust the multiplier as needed
    setHue(newHue.toFixed(1));
  };

  return (
    <div
      className="relative h-[100dvh] transition-all duration-0 hover:duration-0"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 w-full opacity-20">
        <Diamond
          className="absolute -top-10 left-0"
          style={{ filter: `hue-rotate(${hue}deg)` }}
        />
        <Diamond
          className="absolute left-[50%] top-0 z-10 -translate-x-1/2"
          style={{ filter: `hue-rotate(${hue}deg)` }}
        />
        <Diamond
          className="absolute right-0 top-10"
          style={{ filter: `hue-rotate(${hue}deg)` }}
        />
      </div>
      <div className="container">
        <HomeHero
          text="Shaping pixels. "
          textB="Shipping solutions."
          paragraph="Hi, I'm Chase. I've been a coder and designer for over a decade. I have a passion for building with effective design. "
          paragraphCTA="Learn more about me and my skillset."
          className="relative z-10"
        />
      </div>
    </div>
  );
};

export default HueRotateComponent;
