const MAX_LENGTH = 160;

export function metaDescription(
  ...parts: (string | undefined | null)[]
): string {
  const text = parts
    .filter((p): p is string => Boolean(p?.trim()))
    .map((p) => p.trim().replace(/\.?$/, "."))
    .join(" ");

  if (text.length <= MAX_LENGTH) return text;

  const cut = text.slice(0, MAX_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
