import { getPage } from "@/sanity/sanity-utils";
import Container from "../components/Container";
import { PortableText } from "@portabletext/react";
import Skills from "../components/Skills";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import Draggable from "react-draggable";
import NotFound from "./not-found";
import { Metadata, ResolvingMetadata } from "next";
import type { Page } from "@/types/Page";

type SkillBlock = { _type: string };

type TextBlock = { _type: string };

type ImageBlock = { _type: string; imageUrl: string; alt: string };

type PageProps = Page & { content: (SkillBlock | TextBlock | ImageBlock)[] };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Update generateMetadata signature
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const page: Page = await getPage(slug);
  return { title: `${page.title} - Chase Cee`, description: page.subtitle };
}

export default async function DynamicPage({ params }: Props) {
  try {
    const { slug } = await params;
    const page = await getPage(slug);

    if (!page) {
      return <NotFound />;
    }

    return (
      <Container className="pt-24" showCTA={true}>
        <div className="prose dark:prose-invert mx-auto">
          <header>
            <h1>{page.subtitle ?? page.title}</h1>
          </header>
          <div>
            {page.content.map((block, index) => {
              switch (block._type) {
                case "skills":
                  return <Skills key={index} />;
                case "block":
                  return (
                    <PortableText key={index} value={[block]} components={{}} />
                  );
                case "image":
                  const imageBlock = block as ImageBlock;
                  return (
                    <div key={index} className="rounded-xl">
                      <Image
                        src={urlFor(imageBlock.imageUrl)
                          .width(711)
                          .height(711)
                          .dpr(2)
                          .url()}
                        alt={imageBlock.alt}
                        width={711}
                        height={711}
                        className="rounded-xl"
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </Container>
    );
  } catch (error) {
    console.error("Page error:", error);
    return <NotFound />;
  }
}
