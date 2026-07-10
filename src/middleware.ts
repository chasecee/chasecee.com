import { defineMiddleware } from "astro:middleware";
import { getPerspectiveCookie, isPreviewRequest } from "@/sanity/preview";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    context.locals.draftMode = false;
    context.locals.perspective = undefined;
    return next();
  }

  const draftMode = isPreviewRequest(context.request);
  context.locals.draftMode = draftMode;
  context.locals.perspective = draftMode
    ? getPerspectiveCookie(context.cookies)
    : undefined;

  const response = await next();

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    response.headers.set(
      "Cache-Control",
      draftMode
        ? "private, no-store"
        : "public, s-maxage=60, stale-while-revalidate=86400",
    );
  }

  return response;
});
