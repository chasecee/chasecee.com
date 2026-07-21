import type { APIRoute } from "astro";
import { generateOGImagePng, OG_CACHE_CONTROL } from "@/lib/og-satori";

export const prerender = false;

export const GET: APIRoute = async () => {
  const png = await generateOGImagePng({ template: "home" });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": OG_CACHE_CONTROL,
    },
  });
};
