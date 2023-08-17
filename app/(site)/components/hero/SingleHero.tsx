interface HomeHeroProps {
  text: string;
  paragraph: string;
}

export default function HomeHero({ text, paragraph }: HomeHeroProps) {
  return (
    <div className="prose dark:prose-invert mx-auto my-20 md:my-24">
      <div>
        <h1 className="md:text-center">{text}</h1>
        <p>{paragraph}</p>
      </div>
    </div>
  );
}