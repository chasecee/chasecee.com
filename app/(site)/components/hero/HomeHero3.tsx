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
      className={`my-20 flex flex-col justify-center from-neutral-100 to-neutral-200 py-20 dark:from-neutral-800 dark:to-neutral-900 md:rounded-xl md:bg-gradient-radial md:px-4 md:py-24 lg:mt-24 lg:h-screen lg:max-h-[75dvh] lg:min-h-[31rem] lg:py-0 ${className}`}
    >
      <div
        className="absolute inset-0 hidden rounded-xl bg-fixed bg-repeat opacity-20 md:block"
        style={{
          backgroundImage: `url('/noise1.png')`,
          backgroundSize: "200px",
        }}
      ></div>
      <div className="prose relative mx-auto max-w-none dark:prose-invert lg:max-w-[59rem]">
        <p className="text-xl">{text}</p>
        <h1 className="mb-[2rem] leading-tight tracking-tight sm:text-[4rem] lg:text-[4.7rem]">
          <span className=" block xl:inline">{textB}</span>
        </h1>
        <div className="max-w-[65ch]">
          <p className="text-xl">
            <Link href="/about" className="underline underline-offset-2">
              {paragraphCTA} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
