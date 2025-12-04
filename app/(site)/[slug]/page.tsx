import { getPage, getPages } from "@/sanity/sanity-utils";
import { PortableText } from "@portabletext/react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "../components/Container";
import { Body } from "../components/Body";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${page.title} - Chase Cee`,
    description: page.subtitle || `Learn more about ${page.title}`,
    openGraph: {
      title: `${page.title} - Chase Cee`,
      description: page.subtitle || `Learn more about ${page.title}`,
      type: "website",
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <Container className="pt-24" showCTA={true}>
      <div className="prose dark:prose-invert mx-auto">
        <header>
          <h1>{page.subtitle ?? page.title}</h1>
        </header>
        <div className="content">
          <Body value={page.content} />
        </div>
      </div>
    </Container>
  );
}
