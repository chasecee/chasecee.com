"use client";
import React, { useState, useMemo, useEffect } from "react";
import { throttle } from "lodash"; // Import throttle from Lodash
import HomeHero from "./hero/HomeHero";
import Diamond from "./svg/Diamond2";

const tailwindString =
  "left-[0%] left-[100%] left-[20%] left-[40%] left-[60%] left-[80%] hidden delay-[50ms] delay-[100ms] delay-[150ms] delay-[200ms] delay-[250ms]";

const RenderDiamond = React.memo(({ position, delay, hue }) => (
  <div
    className={`absolute h-[35rem] w-[35rem] origin-center rotate-45 rounded-3xl bg-gradient-to-bl from-emerald-300/50 to-transparent dark:from-fuchsia-900/50
    left-[${position}%] top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[filter] delay-[${delay}ms] duration-100`}
    style={{
      filter: `hue-rotate(${hue}deg)`,
    }}
  />
));

RenderDiamond.displayName = "RenderDiamond";

const HueRotateComponent = () => {
  const [hue, setHue] = useState(0);

  const handleMouseMove = (e) => {
    const xRatio = e.clientX / window.innerWidth;
    const yRatio = e.clientY / window.innerHeight;
    const newHue = (xRatio + yRatio) * 270; // Adjust the multiplier as needed
    setHue(newHue.toFixed(0));
  };

  const throttledMouseMove = useMemo(() => throttle(handleMouseMove, 10), []);

  useEffect(() => {
    // Return a cleanup function to remove the event listener
    return () => {
      throttledMouseMove.cancel(); // Cancel any pending execution
    };
  }, [throttledMouseMove]);

  return (
    <div
      className="relative flex h-auto flex-col justify-center overflow-hidden pt-32 md:h-[80dvh] md:pt-[10rem] lg:h-[95dvh] lg:min-h-[30rem] lg:pt-[5rem]"
      onMouseMove={throttledMouseMove}
    >
      <div
        className="absolute inset-0 w-full opacity-40 dark:opacity-100"
        style={{}}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <RenderDiamond key={i} position={i * 20} delay={i * 50} hue={hue} />
        ))}
      </div>
      <div className="container relative z-10">
        <HomeHero
          text="Shaping pixels. "
          textB="Shipping solutions."
          paragraph="Hi, I'm Chase. I've been a coder and designer for over a decade. I have a passion for building with effective design. "
          paragraphCTA="Learn more about me and my skillset."
          className="relative"
        />
      </div>

      <div className="absolute -bottom-px left-0 right-0 z-0 h-[30rem] bg-gradient-to-b from-transparent to-neutral-100 dark:to-neutral-900"></div>
    </div>
  );
};

export default HueRotateComponent;
