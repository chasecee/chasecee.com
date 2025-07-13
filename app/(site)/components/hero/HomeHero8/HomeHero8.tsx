import PhysicsSVGClient from "./PhysicsSVGClient";
import AnimatedHeroText from "./AnimatedHeroText";

const HomeHero8 = () => {
  return (
    <>
      {/* Sentinel element for scroll tracking */}
      <div
        id="hero-sentinel"
        className="pointer-events-none absolute top-0 left-0 h-[50svh] w-full"
        style={{ position: "absolute", zIndex: -1 }}
      />

      <div className="relative inset-0 z-[1] -mx-6">
        <div className="relative flex h-[80svh] flex-row items-center gap-12 lg:h-[90svh] lg:gap-16">
          <AnimatedHeroText />

          <div className="bottom-[-10svh]z-0 absolute inset-0 w-full flex-1">
            <PhysicsSVGClient />
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeHero8;
