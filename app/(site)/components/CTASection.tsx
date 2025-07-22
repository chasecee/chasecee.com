import { FaArrowRight } from "react-icons/fa";
import Button from "./Button";
import { UI } from "../constants";

interface CTASectionProps {
  outerClass?: string;
  title: string;
  subtitle: string;
  primaryLink: string;
  secondaryLink: string;
}

const CTASection: React.FC<CTASectionProps> = ({
  outerClass = "",
  title,
  subtitle,
  primaryLink,
  secondaryLink,
}) => {
  return (
    <div
      className={`bg-gradient-radial relative my-20 overflow-hidden rounded-xl from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 ${outerClass}`}
    >
      <div
        className="absolute inset-0 rounded-xl bg-fixed bg-repeat opacity-20"
        style={{
          backgroundImage: `url('/noise1.webp')`,
          backgroundSize: `${UI.NOISE_SIZE}px`,
        }}
      />
      <div className="relative px-4 py-16">
        <div className="prose dark:prose-invert mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 opacity-90">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button
              href={primaryLink}
              target="_self"
              className="border-indigo-300 bg-indigo-600"
            >
              Get Started
            </Button>
            <Button
              href={secondaryLink}
              target="_self"
              className="border-0 hover:bg-white/30"
            >
              About Me <FaArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
