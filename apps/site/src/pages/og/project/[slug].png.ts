import type { APIRoute } from "astro";
import { generateOGImagePng } from "@/lib/og-satori";
import sanityClient from "@/sanity/sanityClient";

export const prerender = false;

const PROJECT_OG_QUERY = `*[_type == "project" && slug.current == $slug][0]{name}`;

export const GET: APIRoute = async ({ params }) => {
  const slug = typeof params.slug === "string" ? params.slug : "";
  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const project = await sanityClient.fetch<{ name?: string | null } | null>(
    PROJECT_OG_QUERY,
    { slug },
  );

  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const png = await generateOGImagePng({
    template: "project",
    title: project.name ?? slug,
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
