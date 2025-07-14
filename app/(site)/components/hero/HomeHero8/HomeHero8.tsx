"use client";
import PhysicsSVGClient from "./PhysicsSVGClient";
import HeroText from "./HeroText";

const HomeHero8 = () => {
  return (
    <>
      <div
        id="hero-sentinel"
        className="pointer-events-none absolute top-0 left-0 z-[-1] h-[50svh] w-full"
      />

      <div className="relative inset-0 z-[1] -mx-6">
        <div className="relative h-[80svh] w-full lg:h-[90svh]">
          <div className="absolute top-0 left-0 h-[calc(100%+10svh)] w-full">
            <PhysicsSVGClient />
          </div>

          <div className="pointer-events-none absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center">
            <HeroText />
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeHero8;
