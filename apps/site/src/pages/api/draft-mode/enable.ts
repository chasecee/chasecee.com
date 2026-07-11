export const prerender = false;
import { createEnableDraftModeRoute } from "@chasecee/sanity-kit/astro";
import "@/sanity/preview";

export const GET = createEnableDraftModeRoute({ siteUrl: "https://chasecee.com" });
