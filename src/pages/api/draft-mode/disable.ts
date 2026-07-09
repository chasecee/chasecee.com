import type { APIRoute } from "astro";
import {
  perspectiveCookieName,
  urlSearchParamPreviewPathname,
} from "@sanity/preview-url-secret/constants";
import { SANITY_PREVIEW_COOKIE } from "@/sanity/preview";

export const prerender = false;

function normalizeRedirectPath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const pathFromQuery =
    url.searchParams.get(urlSearchParamPreviewPathname) ||
    url.searchParams.get("redirect");
  const target = normalizeRedirectPath(pathFromQuery);

  cookies.delete(SANITY_PREVIEW_COOKIE, { path: "/" });
  cookies.delete(perspectiveCookieName, { path: "/" });

  return redirect(target, 302);
};
