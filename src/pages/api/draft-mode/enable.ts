import type { APIRoute } from "astro";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import { getSanityClient } from "@/sanity/preview";

export const prerender = false;

function normalizeRedirectPath(rawUrl: string | undefined): string {
  if (!rawUrl) return "/";
  try {
    const parsed = rawUrl.startsWith("http")
      ? new URL(rawUrl)
      : new URL(rawUrl, "https://chasecee.com");
    const value = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return value.startsWith("/") ? value : "/";
  } catch {
    return "/";
  }
}

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const previewClient = getSanityClient(true);
  const validation = await validatePreviewUrl(previewClient, request.url);

  if (!validation.isValid) {
    return new Response("Invalid preview URL", { status: 401 });
  }

  const url = new URL(request.url);
  const target = normalizeRedirectPath(validation.redirectTo);
  const secure = url.protocol === "https:";
  const sameSite = secure ? "none" : "lax";
  const perspective = validation.studioPreviewPerspective || "drafts";
  const perspectiveValue =
    typeof perspective === "string" ? perspective : JSON.stringify(perspective);

  cookies.set(perspectiveCookieName, perspectiveValue, {
    path: "/",
    httpOnly: false,
    sameSite,
    secure,
  });

  return redirect(target, 302);
};
