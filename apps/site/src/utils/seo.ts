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

export function siteJsonLd({
  canonical,
  title,
  description,
  pathname,
}: {
  canonical: string;
  title: string;
  description: string;
  pathname: string;
}) {
  const origin = new URL(canonical).origin;
  const personId = `${origin}/#person`;
  const websiteId = `${origin}/#website`;
  const pageType = pathname === "/about" ? "ProfilePage" : "WebPage";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: origin,
        name: "Chase Cee",
        publisher: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Chase Cee",
        alternateName: "Chase Christensen",
        url: origin,
        jobTitle: "Designer and Developer",
        image: `${origin}/me.webp`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Salt Lake City",
          addressRegion: "UT",
          addressCountry: "US",
        },
        sameAs: [
          "https://github.com/chasecee/",
          "https://www.linkedin.com/in/chasechristensen-1/",
        ],
      },
      {
        "@type": pageType,
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
      },
    ],
  };
}
