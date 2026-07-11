import type { APIRoute } from "astro";
import { generateOGImagePng } from "@/lib/og-satori";

export const prerender = true;

export const GET: APIRoute = async () => {
  const png = await generateOGImagePng({ template: "home" });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
