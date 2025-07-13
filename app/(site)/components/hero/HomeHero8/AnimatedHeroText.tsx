import Link from "next/link";

const AnimatedHeroText = () => {
  return (
    <div className="pointer-events-none relative z-10 mx-auto flex w-full touch-none flex-col items-center justify-center gap-5 py-10 text-center select-none lg:max-w-2/3">
      <h1 className="text-5xl font-semibold text-pretty text-gray-900 md:text-6xl dark:text-white">
        Let&apos;s build.
      </h1>
      <div className="container flex flex-col gap-8">
        <p className="text-lg font-light text-pretty text-gray-600 md:text-xl dark:text-gray-400">
          I&apos;m Chase, a developer obsessed with
          <br className="hidden sm:block" />
          &nbsp;crafting excellent experiences.
        </p>
        <div className="pointer-events-auto flex-col flex-wrap items-center justify-center gap-3 md:flex-row">
          <Link
            href="/contact"
            className="pointer-events-auto flex-grow rounded-lg bg-black px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="pointer-events-auto flex-grow rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnimatedHeroText;
