const ORIGIN = process.env.SITE ?? "https://chasecee.com";
const TIMEOUT_MS = 15000;
const UA = "cee-app-site-audit/1.0";

type Severity = "error" | "warning";
type Finding = { severity: Severity; url: string; message: string };

const findings: Finding[] = [];

function add(severity: Severity, url: string, message: string) {
  findings.push({ severity, url, message });
}

function attr(html: string, tag: string, attrName: string, attrValue: string) {
  const re = new RegExp(
    `<${tag}\\b[^>]*\\b${attrName}=["']${attrValue}["'][^>]*>`,
    "i",
  );
  const tagMatch = html.match(re);
  if (!tagMatch) return "";
  const content = tagMatch[0].match(/\bcontent=["']([^"']*)["']/i);
  const href = tagMatch[0].match(/\bhref=["']([^"']*)["']/i);
  return (content?.[1] ?? href?.[1] ?? "").trim();
}

function all(html: string, re: RegExp) {
  return [...html.matchAll(re)].map((m) => m[1]?.trim() ?? "").filter(Boolean);
}

async function get(url: string) {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": UA },
  });
  const location = res.headers.get("location");
  const type = res.headers.get("content-type") ?? "";
  const body =
    res.status < 400 && (type.includes("html") || type.includes("xml"))
      ? await res.text()
      : "";
  return { status: res.status, location, body };
}

async function finalStatus(url: string) {
  let current = url;
  for (let i = 0; i < 5; i++) {
    const res = await get(current);
    if (res.status < 300 || res.status >= 400) return res.status;
    if (!res.location) return res.status;
    current = new URL(res.location, current).href;
  }
  return 0;
}

const sitemapRes = await get(`${ORIGIN}/sitemap.xml`);
if (sitemapRes.status !== 200) {
  add("error", `${ORIGIN}/sitemap.xml`, `HTTP ${sitemapRes.status}`);
  printAndExit();
}

const sitemapUrls = all(sitemapRes.body, /<loc>\s*([^<]+)\s*<\/loc>/g).map(
  (loc) => {
    const url = new URL(loc);
    return `${ORIGIN}${url.pathname}`;
  },
);

if (sitemapUrls.length === 0) {
  add("error", `${ORIGIN}/sitemap.xml`, "No <loc> entries");
  printAndExit();
}

const robots = await (await fetch(`${ORIGIN}/robots.txt`, {
  signal: AbortSignal.timeout(TIMEOUT_MS),
  headers: { "user-agent": UA },
})).text();
if (!/^\s*sitemap:\s*https?:\/\/\S+\/sitemap\.xml\s*$/im.test(robots)) {
  add("warning", `${ORIGIN}/robots.txt`, "Missing sitemap directive");
}

const pageHtml = new Map<string, string>();
const internal = new Set<string>();

for (const url of sitemapUrls) {
  const page = await get(url);
  if (page.status >= 300 && page.status < 400) {
    add("warning", url, `Redirect ${page.status} → ${page.location ?? "?"}`);
    continue;
  }
  if (page.status !== 200) {
    add("error", url, `HTTP ${page.status}`);
    continue;
  }
  pageHtml.set(url, page.body);

  const title = page.body.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const description = attr(page.body, "meta", "name", "description");
  const canonical = attr(page.body, "link", "rel", "canonical");
  const h1s = all(page.body, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map((h) =>
    h.replace(/<[^>]+>/g, "").trim(),
  );
  const ogTitle = attr(page.body, "meta", "property", "og:title");
  const ogImage = attr(page.body, "meta", "property", "og:image");
  const twitterTitle = attr(page.body, "meta", "name", "twitter:title");
  const twitterImage = attr(page.body, "meta", "name", "twitter:image");
  const hasJsonLd = /<script\b[^>]*type=["']application\/ld\+json["']/i.test(
    page.body,
  );

  if (!title) add("error", url, "Missing title");
  else if (title.length > 60) add("warning", url, `Title ${title.length} chars`);
  if (!description) add("error", url, "Missing meta description");
  else if (description.length > 160) {
    add("warning", url, `Description ${description.length} chars`);
  }
  if (!canonical) add("error", url, "Missing canonical");
  else if (new URL(canonical, ORIGIN).href !== url) {
    add("warning", url, `Canonical mismatch ${canonical}`);
  }
  if (h1s.length === 0) add("error", url, "Missing H1");
  if (h1s.length > 1) add("warning", url, `${h1s.length} H1s`);
  if (!ogTitle || !ogImage) add("warning", url, "Incomplete Open Graph");
  if (!twitterTitle || !twitterImage) add("warning", url, "Incomplete Twitter card");
  if (!hasJsonLd) add("warning", url, "Missing JSON-LD");

  for (const href of all(page.body, /<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    let abs: URL;
    try {
      abs = new URL(href, url);
    } catch {
      add("warning", url, `Invalid href ${href}`);
      continue;
    }
    if (abs.origin !== ORIGIN) continue;
    if (abs.pathname.startsWith("/api/")) continue;
    if (/\.(pdf|png|jpe?g|webp|gif|svg|ico|mp4|webm|woff2?)$/i.test(abs.pathname)) {
      continue;
    }
    internal.add(`${abs.origin}${abs.pathname}`);
  }
}

for (const url of internal) {
  if (pageHtml.has(url)) continue;
  const status = await finalStatus(url);
  if (status === 404) add("error", url, "Broken internal link");
  else if (status !== 200) add("warning", url, `Internal link HTTP ${status}`);
}

function printAndExit() {
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  for (const f of [...errors, ...warnings]) {
    console.log(`${f.severity.toUpperCase()}  ${f.url}  ${f.message}`);
  }
  console.log(`${errors.length} errors, ${warnings.length} warnings`);
  process.exit(errors.length > 0 ? 1 : 0);
}

printAndExit();
