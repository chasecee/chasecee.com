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
    <div className={`mx-auto ${className}`}>
      <div className="prose mx-auto max-w-none dark:prose-invert xl:max-w-[59rem]">
        <p className="text-xl">{text}</p>
        <h1 className="mb-[2rem] leading-tight tracking-tight sm:text-[4rem] lg:text-[4.7rem]">
          <span className=" block xl:inline">{textB}</span>
        </h1>
        <div className="max-w-[65ch]">
          <p className="text-xl">
            <Link href="/about" className="underline underline-offset-2">
              {paragraphCTA}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
