"use client";
import React from "react";
import HomeHero2 from "./hero/HomeHero2";

const RenderDiamond = React.memo(({ position, delay }) => (
  <div
    className={`absolute h-[35rem] w-[35rem] origin-center rotate-45 rounded-3xl bg-gradient-to-bl from-emerald-500/50  to-transparent dark:from-fuchsia-900/30 dark:via-transparent
  left-[${position}%] hue-rotate-animation top-1/2 -translate-x-1/2 -translate-y-1/2`}
    style={{
      animationDelay: `${delay}ms`,
    }}
  />
));

RenderDiamond.displayName = "RenderDiamond";

const HueRotateComponent = () => {
  return (
    <div className="relative flex h-auto flex-col justify-center overflow-hidden pt-32 md:h-[80dvh] md:pt-[10rem] lg:h-[95dvh] lg:min-h-[30rem] lg:pt-[5rem]">
      <div
        className={`absolute inset-0 mix-blend-multiply`}
        style={{
          backgroundImage: `url('/noise1.png')`, // Path to the noise image in the /public folder
          backgroundRepeat: "repeat",
          backgroundSize: "150px",
        }}
      />
      <div className="absolute inset-0 w-full opacity-40 dark:opacity-100">
        {Array.from({ length: 6 }, (_, i) => (
          <RenderDiamond key={i} position={i * 20} delay={i * 100} />
        ))}
      </div>
      <div className="container relative z-10 px-6 pt-0">
        {/* <HomeHero
          text="Polishing pixels. "
          textB="Shipping solutions."
          paragraph="Hi, I'm Chase. I've been a coder and designer for over a decade. I have a passion for building with effective design. "
          paragraphCTA="Learn more about me and my skillset."
          className="relative"
        /> */}
        <HomeHero2
          text="Hi I'm Chase."
          textB="Crafting digital experiences through effective design."
          paragraphCTA="Explore my skills and discover what I can create for you."
          className="relative"
        />
      </div>

      <div className="absolute -bottom-px left-0 right-0 z-0 h-[30rem] bg-gradient-to-b from-transparent to-neutral-100 dark:to-neutral-900"></div>
    </div>
  );
};

export default HueRotateComponent;
