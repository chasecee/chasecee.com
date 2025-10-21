import Button from "../../Button";
import BorderGlow from "./BorderGlow";

const containerBase =
  "relative mx-auto flex mt-[11svh] select-none flex-col items-center justify-center gap-5 py-10 text-center lg:max-w-2xl";

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
        <div className="group inline-block">
          <BorderGlow>
            <Button
              className="pointer-events-auto bg-neutral-100 ring-black/5 dark:bg-neutral-900 dark:ring-white/5"
              href="/about"
            >
              About Me
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
};

export default HeroText;
