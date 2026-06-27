import { createClient } from "@sanity/client";
import config from "./config/client-config";

export const SANITY_PREVIEW_COOKIE = "sanity-preview";

export function isPreviewRequest(request?: Request): boolean {
  if (!request) return false;
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes(`${SANITY_PREVIEW_COOKIE}=true`);
}

export function getSanityClient(preview = false) {
  if (!preview) {
    return createClient(config);
  }

  const token = process.env.SANITY_API_READ_TOKEN;
  if (!token) {
    return createClient(config);
  }

  return createClient({
    ...config,
    useCdn: false,
    token,
    perspective: "drafts",
  });
}
