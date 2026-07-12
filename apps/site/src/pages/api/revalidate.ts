import { createIsrRevalidateRoute } from "@chasecee/sanity-kit/astro";

export const prerender = false;

export const POST = createIsrRevalidateRoute({
  siteUrl: "https://chasecee.com",
  resolvePaths(body) {
    const docType = body._type as string | undefined;
    const slug = (body.slug as { current?: string } | undefined)?.current;
    const paths: string[] = [];

    if (docType === "page" && slug) {
      paths.push(slug === "home" ? "/" : `/${slug}`);
    } else if (docType === "project" && slug) {
      paths.push(`/projects/${slug}`, "/");
    } else if (docType === "music" && slug) {
      paths.push(`/music/${slug}`, "/music");
    }

    return paths;
  },
});
