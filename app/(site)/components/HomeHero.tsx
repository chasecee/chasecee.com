interface HomeHeroProps {
    text: string;
    paragraph: string;
  }
  
  export default function HomeHero({ text, paragraph }: HomeHeroProps) {
    return (
      <div className="prose dark:prose-invert mx-auto my-10">
        <h1 className="text-center">{text}</h1>
        <p>{paragraph}</p>
      </div>
    );
  }