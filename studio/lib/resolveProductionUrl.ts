export const SITE_URL = "https://chasecee.com";
export const LOCAL_SITE_URL = "http://localhost:4321";

export function getSiteBaseUrl() {
  const fromEnv = process.env.SANITY_STUDIO_PREVIEW_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (
    typeof location !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ) {
    return LOCAL_SITE_URL;
  }

  return SITE_URL;
}

export function resolveDocumentUrl(
  baseUrl: string,
  previousUrl: string | undefined,
  context: {
    document?: { slug?: { current?: string }; _type?: string };
    schemaType?: string;
  },
) {
  const base = baseUrl.replace(/\/$/, "");
  const slug = context.document?.slug?.current;
  const type = context.schemaType || context.document?._type;

  if (type === "project" && slug) {
    return `${base}/projects/${slug}`;
  }

  if (type === "music" && slug) {
    return `${base}/music/${slug}`;
  }

  if (type === "page" && slug) {
    return slug === "home" ? base : `${base}/${slug}`;
  }

  return previousUrl || base;
}

export function resolveProductionUrl(
  previousUrl: string | undefined,
  context: {
    document?: { slug?: { current?: string }; _type?: string };
    schemaType?: string;
  },
) {
  return resolveDocumentUrl(SITE_URL, previousUrl, context);
}

export async function resolveProductionUrlAsync(
  previousUrl: string | undefined,
  context: {
    document?: { slug?: { current?: string }; _type?: string };
    schemaType?: string;
  },
) {
  return resolveProductionUrl(previousUrl, context);
}
