import { FaArrowRight, FaChevronRight, FaGithub } from "react-icons/fa";
import Button from "../../Button";

const buttonBase =
  "flex-grow rounded px-6 py-2.5 text-center text-sm max-w-[200px] font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-95";
const containerBase =
  "relative mx-auto flex mt-[10svh] select-none flex-col items-center justify-center gap-5 py-10 text-center lg:max-w-2xl";

const HeroText = () => {
  return (
    <div className={containerBase}>
      <h1 className="text-4xl font-medium text-pretty text-gray-900 md:text-5xl lg:font-semibold dark:text-white">
        Let&apos;s build.
      </h1>
      <div className="container flex flex-col gap-8">
        <p className="mx-auto w-[90%] text-base font-light text-pretty text-gray-600 md:w-auto md:text-xl dark:text-gray-400">
          I&apos;m Chase, a developer obsessed with
          <br className="hidden sm:block" />
          &nbsp;crafting excellent experiences.
        </p>
        <div className="pointer-events-auto flex flex-col flex-wrap items-center justify-center gap-3 md:flex-row">
          <Button className="group" href="/about">
            About Me
            <FaChevronRight
              className="transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1"
              size={12}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroText;
