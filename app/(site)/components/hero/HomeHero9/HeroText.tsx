import Link from "next/link";

const buttonBase =
  "flex-grow rounded-lg px-6 py-2.5 text-center text-sm max-w-[200px] font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-95";
const containerBase =
  "relative mx-auto flex mt-[10svh] select-none flex-col items-center justify-center gap-5 py-10 text-center lg:max-w-2xl";

const HeroText = () => {
  return (
    <div className={containerBase}>
      <h1 className="text-5xl font-semibold text-pretty text-gray-900 md:text-6xl dark:text-white">
        Let&apos;s build.
      </h1>
      <div className="container flex flex-col gap-8">
        <p className="text-lg font-light text-pretty text-gray-600 md:text-xl dark:text-gray-400">
          I&apos;m Chase, a developer obsessed with
          <br className="hidden sm:block" />
          &nbsp;crafting excellent experiences.
        </p>
        <div className="pointer-events-auto flex flex-col flex-wrap items-center justify-center gap-3 md:flex-row">
          <Link
            href="/about"
            className={`${buttonBase} inline-block bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100`}
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroText;
