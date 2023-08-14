import { getPage } from "@/sanity/sanity-utils";
import Container from "../components/Container";
import { PortableText } from "@portabletext/react";
import Skills from "../components/Skills";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import Draggable from "react-draggable";

type SkillBlock = {
  _type: string;
};

type TextBlock = {
  _type: string;
  // add any other properties that exist on your blocks
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

export default async function Page({ params }: Props) {
  try {
    const page: PageProps = await getPage(params.slug);

    if (!page) {
      // Handle the case where page data could not be fetched
      // This could be a redirect or a "Page not found" component
      return <div>Page not found</div>;
    }

    return (
      <div>
        <Container>
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
                        width={711} // adjust these values according to your needs
                        height={711}
                        className="w-full rounded-xl"
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
      </div>
    );
  } catch (err) {
    // Add a basic error handling for any exceptions
    console.error(err);
    return <div>An error occurred while loading the page.</div>;
  }
}
