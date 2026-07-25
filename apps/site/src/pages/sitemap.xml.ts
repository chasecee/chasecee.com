import type { APIRoute } from "astro";
import { getPages, getMusic, getPersonalProjects } from "@/sanity/sanity-utils";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [projects, pages, music] = await Promise.all([
    getPersonalProjects(),
    getPages(),
    getMusic(),
  ]);

  const paths = [
    "/",
    "/about",
    "/music",
    ...pages
      .map((p) => p.slug)
      .filter((slug): slug is string => Boolean(slug && slug !== "home"))
      .map((slug) => `/${slug}`),
    ...projects
      .map((p) => p.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/projects/${slug}`),
    ...music
      .map((m) => m.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/music/${slug}`),
  ];

  const urls = paths
    .map((path) => `<url><loc>${new URL(path, site).href}</loc></url>`)
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
