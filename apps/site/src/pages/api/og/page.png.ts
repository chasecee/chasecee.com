import type { APIRoute } from "astro";
import { generateOGImagePng, OG_CACHE_CONTROL } from "@/lib/og-satori";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get("title")?.trim();
  const template = url.searchParams.get("template");
  if (!title || (template !== "page" && template !== "project")) {
    return new Response("Not found", { status: 404 });
  }

  const png = await generateOGImagePng({ template, title });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": OG_CACHE_CONTROL,
    },
  });
};
