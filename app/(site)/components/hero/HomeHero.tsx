import Link from "next/link";
interface HomeHeroProps {
  text: string;
  textB: string;
  paragraph: string;
  paragraphCTA: string;
  className?: string;
}

export default function HomeHero({
  text,
  textB,
  paragraph,
  paragraphCTA,
  className,
}: HomeHeroProps) {
  return (
    <div className={`mx-auto lg:mx-[7vw] ${className}`}>
      <div className="prose max-w-none dark:prose-invert">
        <h1 className="mb-[2rem] sm:text-[4rem] lg:text-[6rem]">
          <span className="block opacity-0">{text}</span>
          <span className=" block opacity-0 xl:inline">{textB}</span>
        </h1>
        <div className="max-w-[65ch] opacity-0">
          <p className="md:text-[1.2rem]">
            {paragraph}&nbsp;
            <Link href="/about" className="underline underline-offset-2">
              {paragraphCTA}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
