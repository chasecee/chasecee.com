import type { APIRoute } from "astro";
import {
  perspectiveCookieName,
  urlSearchParamPreviewPathname,
} from "@sanity/preview-url-secret/constants";

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

  cookies.delete(perspectiveCookieName, { path: "/" });

  return redirect(target, 302);
};
