import { createIsrRevalidateRoute } from "@chasecee/sanity-kit/astro";
import { getSanityClient } from "@/sanity/preview";

export const prerender = false;

const publishedClient = getSanityClient(false, "published");

async function isClientProjectSlug(slug: string): Promise<boolean> {
  const project = await publishedClient.fetch<{ type?: "personal" | "client" } | null>(
    `*[_type == "project" && slug.current == $slug][0]{ type }`,
    { slug },
  );
  return project?.type === "client";
}

export const POST = createIsrRevalidateRoute({
  siteUrl: "https://chasecee.com",
  async resolvePaths(body) {
    const docType = body._type as string | undefined;
    const slug = (body.slug as { current?: string } | undefined)?.current;
    const paths: string[] = [];

    if (docType === "page" && slug) {
      paths.push(slug === "home" ? "/" : `/${slug}`);
      if (slug === "home") {
        paths.push("/api/og/home.png");
      }
      if (slug === "about") {
        paths.push("/api/og/about.png");
      }
    } else if (docType === "project" && slug) {
      const isClientProject = await isClientProjectSlug(slug);
      if (isClientProject) {
        paths.push("/");
      } else {
        paths.push(`/projects/${slug}`, "/");
        paths.push(`/api/og/project/${slug}.png`);
      }
    } else if (docType === "music" && slug) {
      paths.push(`/music/${slug}`, "/music");
    }

    if (paths.length > 0) {
      paths.push("/sitemap.xml");
    }

    return paths;
  },
});
