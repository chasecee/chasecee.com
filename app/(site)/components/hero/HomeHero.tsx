import Link from "next/link";
interface HomeHeroProps {
  text: string;
  textB: string;
  paragraph: string;
  paragraphCTA: string;
}

export default function HomeHero({
  text,
  textB,
  paragraph,
  paragraphCTA,
}: HomeHeroProps) {
  return (
    <div className="mx-auto my-20 md:my-24 lg:mx-[7vw]">
      <div className="prose max-w-none dark:prose-invert">
        <h1 className="lg:text-[6rem] sm:text-[4rem]">
          <span className="fade-in opacity-0 block">{text}</span>
          <span className="fade-in opacity-0 block xl:inline">{textB}</span>
        </h1>
        <div className="fade-in-up max-w-[65ch] opacity-0">
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
