import type { APIRoute } from "astro";
import { getProjects, getPages } from "@/sanity/sanity-utils";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const [projects, pages] = await Promise.all([getProjects(), getPages()]);

  const paths = [
    "/",
    "/about",
    ...pages.map((p) => `/${p.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
  ];

  const urls = paths
    .map((path) => `<url><loc>${new URL(path, site).href}</loc></url>`)
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
