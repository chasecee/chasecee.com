import type { APIRoute } from "astro";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import {
  perspectiveCookieName,
  urlSearchParamPreviewPerspective,
} from "@sanity/preview-url-secret/constants";
import { getSanityClient, SANITY_PREVIEW_COOKIE } from "@/sanity/preview";

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
  const perspective =
    url.searchParams.get(urlSearchParamPreviewPerspective) || "drafts";
  const redirectPath = normalizeRedirectPath(validation.redirectTo);
  const target = redirectPath.startsWith("/preview")
    ? redirectPath
    : `/preview${redirectPath === "/" ? "" : redirectPath}`;
  const secure = url.protocol === "https:";

  cookies.set(SANITY_PREVIEW_COOKIE, "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
  cookies.set(perspectiveCookieName, perspective, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  });

  return redirect(target, 302);
};
