import { createClient } from "@sanity/client";
import config from "./config/client-config";

export const SANITY_PREVIEW_COOKIE = "sanity-preview";

const STUDIO_URL = import.meta.env.DEV
  ? "http://localhost:3333"
  : process.env.SANITY_STUDIO_URL || "https://studio.chasecee.com";

export function isPreviewRequest(request?: Request): boolean {
  if (!request) return false;
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes(`${SANITY_PREVIEW_COOKIE}=true`);
}

export function getSanityClient(preview = false) {
  if (!preview) {
    return createClient(config);
  }

  const token =
    import.meta.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_READ_TOKEN;
  if (!token) {
    throw new Error(
      "SANITY_API_READ_TOKEN is required for draft mode / visual editing.",
    );
  }

  return createClient({
    ...config,
    useCdn: false,
    token,
    perspective: "drafts",
    stega: {
      enabled: true,
      studioUrl: STUDIO_URL,
    },
  });
}
