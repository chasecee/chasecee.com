const HeroText = () => {
  return (
    <div className="relative mx-auto flex select-none flex-col items-center justify-center gap-4 md:gap-6 text-center lg:max-w-2xl">
      <h1 className="text-4xl font-medium text-pretty text-gray-900 md:text-5xl lg:font-semibold dark:text-white">
        Let&apos;s build.
      </h1>
      <div className="container flex flex-col gap-8">
        <p className="mx-auto w-[80%] text-base font-light text-balance text-gray-600 md:w-[60%] md:text-xl dark:text-gray-400">
          I&apos;m Chase, an opinionated designer, tinkering developer, and endlessly curious fella.
        </p>
      </div>
    </div>
  );
};

export default HeroText;
