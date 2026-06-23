const containerBase =
  "relative mx-auto mt-[11svh] flex select-none flex-col items-center justify-center gap-5 py-10 text-center lg:max-w-2xl";

const HeroText = () => {
  return (
    <div className={containerBase}>
      <h1 className="text-4xl font-medium text-pretty text-gray-900 md:text-5xl lg:font-semibold dark:text-white">
        Let&apos;s build.
      </h1>
      <div className="container flex flex-col gap-8">
        <p className="mx-auto w-[80%] text-base font-light text-balance text-gray-600 md:w-[60%] md:text-xl dark:text-gray-400">
          I&apos;m Chase, a developer obsessed with crafting excellent
          experiences.
        </p>
      </div>
    </div>
  );
};

export default HeroText;
