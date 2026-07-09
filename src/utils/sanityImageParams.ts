import { stegaClean } from "@sanity/client/stega";

type ParamValue = string | number;

export function withSanityImageParams(
  url: string | undefined,
  params: Record<string, ParamValue>,
): string | undefined {
  if (!url) return undefined;
  const cleanedUrl = stegaClean(url).trim();
  if (!cleanedUrl) return undefined;
  if (!cleanedUrl.includes("cdn.sanity.io/images/")) return cleanedUrl;

  try {
    const parsed = new URL(cleanedUrl);
    Object.entries(params).forEach(([key, value]) => {
      parsed.searchParams.set(key, String(value));
    });
    return stegaClean(parsed.toString());
  } catch {
    return cleanedUrl;
  }
}
