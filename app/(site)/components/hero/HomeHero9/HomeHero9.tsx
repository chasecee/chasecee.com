"use client";
import { PhysicsCanvas } from "./PhysicsCanvas";
import HeroText from "./HeroText";

const HomeHero9 = () => {
  return (
    <>
      <div className="relative inset-0 z-[1] -mx-6">
        <div className="relative h-[80svh] min-h-[30rem] w-full lg:h-[90svh]">
          <div className="absolute top-0 left-0 h-[calc(100%+10svh)] w-full">
            <PhysicsCanvas />
          </div>

          <div className="pointer-events-none absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center">
            <HeroText />
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeHero9;
