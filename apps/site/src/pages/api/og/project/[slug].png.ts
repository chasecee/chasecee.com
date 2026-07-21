import type { APIRoute } from "astro";
import { getSanityClient } from "@/sanity/preview";
import { generateOGImagePng, OG_CACHE_CONTROL } from "@/lib/og-satori";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = typeof params.slug === "string" ? params.slug : "";
  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const client = getSanityClient(false, "published");
  const project = await client.fetch<{ name?: string } | null>(
    `*[_type == "project" && slug.current == $slug][0]{ name }`,
    { slug },
  );

  const title = project?.name?.trim();
  if (!title) {
    return new Response("Not found", { status: 404 });
  }

  const png = await generateOGImagePng({
    template: "project",
    title,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": OG_CACHE_CONTROL,
    },
  });
};
