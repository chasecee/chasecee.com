import { getPage } from "@/sanity/sanity-utils";
import Container from "../components/Container";
import { PortableText } from "@portabletext/react";
import Skills from "../components/Skills";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import Draggable from "react-draggable";
import NotFound from "./not-found";
import { Metadata } from "next";
import { Page } from "@/types/Page";

type SkillBlock = {
  _type: string;
};

type TextBlock = {
  _type: string;
};

type ImageBlock = {
  _type: string;
  imageUrl: string;
  alt: string;
};

type PageProps = {
  title: string;
  subtitle?: string;
  content: (SkillBlock | TextBlock | ImageBlock)[];
};

type Props = {
  params: { slug: string };
};
// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page: Page = await getPage(params.slug);

  return {
    title: `${page.title} - Chase Cee`,
    description: page.subtitle,
  };
}
export default async function GenPage({ params }: Props) {
  try {
    const page: PageProps = await getPage(params.slug);

    if (!page) {
      return <NotFound />;
    }
    return (
      <>
        <Container className="pt-24" showCTA={true}>
          <div className="prose mx-auto dark:prose-invert">
            <header>
              <h1>{page.subtitle ? page.subtitle : page.title}</h1>
            </header>
            <div>
              {page.content.map((block, index) => {
                if (block._type === "skills") {
                  return <Skills key={index} />;
                }

                if (block._type === "block") {
                  return (
                    <PortableText
                      key={index}
                      value={[block]}
                      components={
                        {
                          // Define other custom types if needed
                        }
                      }
                    />
                  );
                }

                if (block._type === "image") {
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
                        className=" rounded-xl"
                      />
                    </div>
                  );
                }
                // Handle unrecognized block types
                return null;
              })}
            </div>
          </div>
        </Container>
      </>
    );
  } catch (err) {
    // Add a basic error handling for any exceptions
    console.error(err);
    return <div>An error occurred while loading the page.</div>;
  }
}
