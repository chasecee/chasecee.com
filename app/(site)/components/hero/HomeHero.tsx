import Link from "next/link";
interface HomeHeroProps {
  text: string;
  textB: string;
  paragraph: string;
  paragraphCTA: string;
}

export default function HomeHero({ text, textB, paragraph, paragraphCTA }: HomeHeroProps) {
  return (
    <div className="mx-auto my-20 md:my-24 lg:m-32">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="lg:text-[4.1rem]">
          <span className="fade-in opacity-0">{text}</span>
          <span className="fade-in opacity-0 a-delay-1000ms">{textB}</span>
        </h1>
        <div className="max-w-[65ch] fade-in-up opacity-0 a-delay-3000ms">
          <p className="md:text-[1.23rem]">
            {paragraph}&nbsp;
            <Link href="/about" className="underline underline-offset-2">{paragraphCTA}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
