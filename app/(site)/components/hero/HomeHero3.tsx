import Link from "next/link";
import DynamicVideo from "./DynamicVideo";
import HeroSpline from "../splines/HeroSpline";
interface HomeHeroProps {
  text: string;
  textB: string;
  paragraphCTA: string;
  className?: string;
}

export default function HomeHero({
  text,
  textB,
  paragraphCTA,
  className,
}: HomeHeroProps) {
  return (
    <div
      className={`-mx-[1.5rem] mb-10 flex flex-col justify-center from-neutral-100 to-neutral-200 px-6 py-20 dark:from-neutral-800 dark:to-neutral-900 sm:overflow-hidden md:mx-0 md:mt-24 md:rounded-xl md:bg-gradient-radial md:px-6 md:py-24 lg:h-screen lg:max-h-[75dvh] lg:min-h-[31rem] lg:py-0 xl:mb-20 ${className}`}
    >
      <div
        className="absolute inset-0 hidden rounded-xl bg-fixed bg-repeat opacity-20 md:block"
        style={{
          backgroundImage: `url('/noise1.webp')`,
          backgroundSize: "200px",
        }}
      ></div>
      {/* <video
        className="absolute left-0 right-0 z-0 opacity-50"
        loop
        autoPlay={true}
        muted
        playsInline
        poster="/v/poster.jpg"
      >
        <source src="/v/Stripe2_VP9.webm" type="video/webm" />
        <source src="/v/Stripe2_H.264.mp4" type="video/mp4" />
      </video> */}
      {/* <DynamicVideo /> */}
      <HeroSpline />
      <div className="blur-in-off prose relative mx-auto max-w-none dark:prose-invert lg:max-w-[61rem]">
        <p className="text-xl">{text}</p>
        <h1 className=" pl:mb-[2rem] mb-0 leading-tight tracking-tight  sm:text-[4rem] lg:text-[5rem]">
          {/* <span className="hidden">{textB}</span> */}
          <span className="text-neutral-800 dark:text-neutral-300">
            <span className="">
              <span className="font-semibold">Making websites</span>{" "}
              <span className="font-black">sing.</span>
            </span>
          </span>
        </h1>
        <div className="fade-in-up a-delay-2000ms hidden max-w-[65ch]">
          <p className="text-xl">
            <Link href="/about" className="py-4 underline underline-offset-2">
              {paragraphCTA} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
