type ParamValue = string | number;

export function withSanityImageParams(
  url: string | undefined,
  params: Record<string, ParamValue>,
): string | undefined {
  if (!url) return undefined;
  if (!url.includes("cdn.sanity.io/images/")) return url;

  try {
    const parsed = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      parsed.searchParams.set(key, String(value));
    });
    return parsed.toString();
  } catch {
    return url;
  }
}
