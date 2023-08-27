import Link from "next/link";
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
      className={`mb-10 flex flex-col justify-center overflow-hidden from-neutral-100 to-neutral-200 py-20 dark:from-neutral-800 dark:to-neutral-900 md:mt-24 md:rounded-xl md:bg-gradient-radial md:px-4 md:py-24 lg:h-screen lg:max-h-[75dvh] lg:min-h-[31rem] lg:py-0 xl:mb-20 ${className}`}
    >
      <div
        className="absolute inset-0 hidden rounded-xl bg-fixed bg-repeat opacity-20 md:block"
        style={{
          backgroundImage: `url('/noise1.webp')`,
          backgroundSize: "200px",
        }}
      ></div>
      <video
        className="absolute left-0 right-0 z-0 opacity-50"
        loop
        autoPlay
        muted
      >
        <source src="/Stripe2.webm" type="video/webm" />
        <source src="/Stripe2.mp4" type="video/mp4" />
      </video>
      <div className="blur-in prose relative mx-auto max-w-none dark:prose-invert lg:max-w-[61rem]">
        <p className="text-xl">{text}</p>
        <h1 className=" mb-[2rem] leading-tight tracking-tight sm:text-[4rem] lg:text-[4.6rem]">
          <span className=" block xl:inline">{textB}</span>
        </h1>
        <div className="fade-in-up a-delay-2000ms max-w-[65ch]">
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
