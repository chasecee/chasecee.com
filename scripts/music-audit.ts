import { mkdir, writeFile } from "node:fs/promises";

type SanityMusicDoc = {
  _id: string;
  _type: "music";
  _createdAt: string;
  _updatedAt: string;
  bandName: string;
  albumName: string;
  releaseYear: number;
  slug?: { current?: string };
  links?: Array<{ label?: string; url?: string; _key?: string }> | null;
  embeds?: Array<{ _type?: string; url?: string; _key?: string }> | null;
};

type AppleAlbum = {
  collectionId: number;
  collectionName: string;
  artistName: string;
  collectionViewUrl: string;
  releaseDate?: string;
};

type SpotifyCandidate = {
  albumUrl: string;
  embedUrl: string;
  title: string;
  artist: string;
};

type YouTubeCandidate = {
  id: string;
  title: string;
  author: string;
  url: string;
};

const SANITY_QUERY =
  '*[_type == "music"] | order(orderRank) { _id, _type, _createdAt, _updatedAt, bandName, albumName, releaseYear, slug, links, embeds, albumArt, content }';
const SANITY_URL = `https://lgevplo8.api.sanity.io/v2023-07-12/data/query/production?query=${encodeURIComponent(SANITY_QUERY)}`;

const OUT_DIR = new URL("../docs/music-audit/", import.meta.url);
const SNAPSHOT_PATH = new URL("./sanity-snapshot.json", OUT_DIR);
const CATALOG_PATH = new URL("./platform-catalog.json", OUT_DIR);
const REQUEST_TIMEOUT_MS = 7000;
const MAX_SPOTIFY_CANDIDATES = 6;
const MAX_INVIDIOUS_PROBES = 4;

function log(message: string): void {
  const t = new Date().toISOString();
  console.log(`[music-audit ${t}] ${message}`);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson<T>(
  url: string,
  headers: Record<string, string> = {},
): Promise<T> {
  log(`GET JSON ${url}`);
  const started = Date.now();
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      "user-agent": "cee-app-music-audit/1.0",
      ...headers,
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  log(`OK JSON ${url} (${Date.now() - started}ms)`);
  return (await res.json()) as T;
}

async function getText(url: string): Promise<string> {
  log(`GET TEXT ${url}`);
  const started = Date.now();
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": "cee-app-music-audit/1.0" },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  log(`OK TEXT ${url} (${Date.now() - started}ms)`);
  return await res.text();
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function parseSpotifyAlbumFromAnyUrl(url: string): string | null {
  const clean = url.trim();
  const match = clean.match(
    /(?:open\.spotify\.com\/(?:embed\/)?album\/|spotify:album:)([A-Za-z0-9]{22})/i,
  );
  return match?.[1] ?? null;
}

async function fetchSanitySnapshot() {
  return await getJson<{
    query: string;
    result: SanityMusicDoc[];
  }>(SANITY_URL);
}

async function searchAppleMusic(
  bandName: string,
  albumName: string,
  releaseYear: number,
): Promise<AppleAlbum | null> {
  log(`Apple search: ${bandName} - ${albumName}`);
  const term = encodeURIComponent(`${bandName} ${albumName}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=12`;
  const data = await getJson<{ results: AppleAlbum[] }>(url);
  const targetArtist = normalize(bandName);
  const targetAlbum = normalize(albumName);
  const scored = data.results
    .map((item) => {
      const artist = normalize(item.artistName ?? "");
      const album = normalize(item.collectionName ?? "");
      let score = 0;
      if (artist === targetArtist) score += 60;
      else if (artist.includes(targetArtist) || targetArtist.includes(artist))
        score += 30;
      if (album === targetAlbum) score += 80;
      else if (album.includes(targetAlbum) || targetAlbum.includes(album))
        score += 40;
      if (item.releaseDate) {
        const year = Number(item.releaseDate.slice(0, 4));
        if (Number.isFinite(year) && Math.abs(year - releaseYear) <= 1) score += 10;
      }
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  if (!scored[0] || scored[0].score < 100) return null;
  log(
    `Apple match: ${scored[0].item.artistName} - ${scored[0].item.collectionName} (score ${scored[0].score})`,
  );
  return scored[0].item;
}

async function fetchSpotifyMeta(albumId: string): Promise<SpotifyCandidate | null> {
  const albumUrl = `https://open.spotify.com/album/${albumId}`;
  const oembed = await getJson<{ title?: string }>(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(albumUrl)}`,
  ).catch(() => null);
  const oembedTitle = oembed?.title?.trim();
  const mirrorUrl = `https://r.jina.ai/http://open.spotify.com/album/${albumId}`;
  const text = await getText(mirrorUrl).catch(() => "");
  const titleMatch = text.match(
    /^Title:\s*(.+?)\s*-\s*(?:Album|Single|EP)\s+by\s+(.+)$/m,
  );
  if (!titleMatch && !oembedTitle) return null;
  return {
    albumUrl,
    embedUrl: `https://open.spotify.com/embed/album/${albumId}`,
    title: titleMatch?.[1]?.trim() ?? oembedTitle ?? "",
    artist: titleMatch?.[2]?.trim() ?? "",
  };
}

async function searchSpotify(
  bandName: string,
  albumName: string,
  existingUrls: string[],
): Promise<SpotifyCandidate | null> {
  log(`Spotify search: ${bandName} - ${albumName}`);
  const seedIds = existingUrls
    .map(parseSpotifyAlbumFromAnyUrl)
    .filter((id): id is string => Boolean(id));
  const query = encodeURIComponent(`${bandName} ${albumName}`);
  const mirrorSearch = await getText(
    `https://r.jina.ai/http://open.spotify.com/search/${query}`,
  ).catch(() => "");
  const searchIds = Array.from(
    mirrorSearch.matchAll(/https:\/\/open\.spotify\.com\/album\/([A-Za-z0-9]{22})/g),
  ).map((m) => m[1]);
  const ids = unique([...seedIds, ...searchIds]).slice(0, MAX_SPOTIFY_CANDIDATES);
  log(`Spotify candidates: ${ids.length}`);
  const targetArtist = normalize(bandName);
  const targetAlbum = normalize(albumName);
  const candidates: Array<{ data: SpotifyCandidate; score: number }> = [];

  for (const id of ids) {
    log(`Spotify inspect album id: ${id}`);
    try {
      const data = await fetchSpotifyMeta(id);
      if (!data) continue;
      const artist = normalize(data.artist);
      const title = normalize(data.title);
      let score = 0;
      if (seedIds.includes(id)) score += 25;
      if (artist === targetArtist) score += 70;
      else if (artist.includes(targetArtist) || targetArtist.includes(artist))
        score += 35;
      if (title === targetAlbum) score += 80;
      else if (title.includes(targetAlbum) || targetAlbum.includes(title))
        score += 40;
      candidates.push({ data, score });
      log(
        `Spotify candidate: ${data.artist} - ${data.title} (score ${score})`,
      );
    } catch {
      log(`Spotify candidate failed for id: ${id}`);
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  if (!candidates[0] || candidates[0].score < 100) return null;
  log(
    `Spotify match: ${candidates[0].data.artist} - ${candidates[0].data.title} (score ${candidates[0].score})`,
  );
  return candidates[0].data;
}

async function findWorkingInvidious(): Promise<string | null> {
  const list = await getJson<Array<[string, { uri?: string }]>>(
    "https://api.invidious.io/instances.json",
  ).catch(() => []);
  for (const [, meta] of list.slice(0, MAX_INVIDIOUS_PROBES)) {
    const uri = meta?.uri;
    if (!uri || !uri.startsWith("https://")) continue;
    try {
      log(`Invidious probe: ${uri}`);
      const q = encodeURIComponent("test");
      await getJson(`${uri}/api/v1/search?q=${q}&type=video`);
      log(`Invidious selected: ${uri}`);
      return uri;
    } catch {
      log(`Invidious probe failed: ${uri}`);
    }
  }
  log("No working Invidious instance found");
  return null;
}

async function searchYouTube(
  bandName: string,
  albumName: string,
  instance: string | null,
): Promise<YouTubeCandidate | null> {
  if (!instance) return null;
  log(`YouTube search (${instance}): ${bandName} - ${albumName}`);
  const q = encodeURIComponent(`${bandName} ${albumName} full album`);
  const results = await getJson<
    Array<{ videoId?: string; title?: string; author?: string }>
  >(`${instance}/api/v1/search?q=${q}&type=video`).catch(() => []);
  const targetArtist = normalize(bandName);
  const targetAlbum = normalize(albumName);
  const rejectTerms = [
    "making of",
    "timelapse",
    "time lapse",
    "behind the scenes",
    "artwork",
    "teaser",
    "trailer",
    "review",
    "reaction",
    "interview",
  ];
  const scored = results
    .map((item) => {
      const title = normalize(item.title ?? "");
      const author = normalize(item.author ?? "");
      const hasRejectTerm = rejectTerms.some((term) => title.includes(term));
      if (hasRejectTerm) return { item, score: -999 };
      let score = 0;
      if (title.includes(targetAlbum)) score += 50;
      if (title.includes(targetArtist)) score += 40;
      if (author.includes(targetArtist)) score += 30;
      if (title.includes("full album")) score += 15;
      if (title.includes("album stream")) score += 15;
      if (title.includes("official")) score += 10;
      if (!title.includes("full album") && !title.includes("album stream")) score -= 20;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0]?.item;
  if (!best?.videoId || scored[0].score < 95) return null;
  log(
    `YouTube match: ${best.author ?? "unknown"} - ${best.title ?? "unknown"} (score ${scored[0].score})`,
  );
  return {
    id: best.videoId,
    title: best.title ?? "",
    author: best.author ?? "",
    url: `https://www.youtube.com/watch?v=${best.videoId}`,
  };
}

function appleEmbedFromCollectionUrl(collectionViewUrl: string): string | null {
  try {
    const u = new URL(collectionViewUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const country = parts[0] || "us";
    const albumSlug = parts[2];
    const albumId = parts[3];
    if (!albumSlug || !albumId) return null;
    return `https://embed.music.apple.com/${country}/album/${albumSlug}/${albumId}`;
  } catch {
    return null;
  }
}

async function run() {
  log("Run started");
  await mkdir(OUT_DIR, { recursive: true });
  const sanitySnapshot = await fetchSanitySnapshot();
  await writeFile(
    SNAPSHOT_PATH,
    `${JSON.stringify(sanitySnapshot, null, 2)}\n`,
    "utf8",
  );

  const invidious = await findWorkingInvidious();
  const catalog = [];

  for (const doc of sanitySnapshot.result) {
    log(`Processing: ${doc.bandName} - ${doc.albumName} (${doc._id})`);
    const slug = doc.slug?.current ?? doc._id;
    const notes: string[] = [];
    const currentLinks = doc.links ?? [];
    const currentEmbeds = doc.embeds ?? [];
    const existingUrls = [
      ...currentLinks.map((l) => l.url).filter((v): v is string => Boolean(v)),
      ...currentEmbeds.map((e) => e.url).filter((v): v is string => Boolean(v)),
    ];

    const apple = await searchAppleMusic(doc.bandName, doc.albumName, doc.releaseYear);
    const spotify = await searchSpotify(doc.bandName, doc.albumName, existingUrls);
    const youtube = await searchYouTube(doc.bandName, doc.albumName, invidious);

    if (
      currentEmbeds.some(
        (e) =>
          e._type === "embed" &&
          typeof e.url === "string" &&
          e.url.includes("open.spotify.com/embed/album/"),
      )
    ) {
      notes.push("Existing Spotify embed is stored as generic embed.");
    }
    if (!apple) notes.push("No confident Apple Music album match.");
    if (!spotify) notes.push("No confident Spotify album match.");
    if (!youtube) notes.push("No confident YouTube full-album match.");
    if (!invidious) notes.push("YouTube search unavailable (no working Invidious instance).");

    const proposedLinks: Array<{ label: string; url: string }> = [];
    const proposedEmbeds: Array<Record<string, unknown>> = [];

    if (spotify) {
      proposedLinks.push({ label: "Spotify", url: spotify.albumUrl });
      proposedEmbeds.push({
        _type: "spotify",
        url: spotify.albumUrl,
        size: "default",
        theme: "dark",
      });
    }
    if (apple) {
      proposedLinks.push({ label: "Apple Music", url: apple.collectionViewUrl });
      const embedUrl = appleEmbedFromCollectionUrl(apple.collectionViewUrl);
      if (embedUrl) {
        proposedEmbeds.push({
          _type: "embed",
          url: embedUrl,
          title: `${apple.collectionName} - Apple Music`,
          width: "full",
          ratio: { desktop: "16/9" },
        });
      }
    }
    if (youtube) {
      proposedLinks.push({ label: "YouTube", url: youtube.url });
      proposedEmbeds.push({
        _type: "embed",
        url: `https://www.youtube.com/embed/${youtube.id}`,
        title: `${youtube.title} - YouTube`,
        width: "full",
        ratio: { desktop: "16/9" },
      });
    }

    catalog.push({
      sanityId: doc._id,
      slug,
      bandName: doc.bandName,
      albumName: doc.albumName,
      releaseYear: doc.releaseYear,
      current: { links: currentLinks, embeds: currentEmbeds },
      proposed: { links: proposedLinks, embeds: proposedEmbeds },
      sources: {
        spotify: spotify?.albumUrl ?? null,
        appleMusic: apple?.collectionViewUrl ?? null,
        youtube: youtube?.url ?? null,
      },
      notes,
    });
    log(
      `Done: ${doc.bandName} - ${doc.albumName} | links=${proposedLinks.length} embeds=${proposedEmbeds.length}`,
    );
  }

  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  log(`Wrote ${SNAPSHOT_PATH.pathname}`);
  log(`Wrote ${CATALOG_PATH.pathname}`);
  log("Run finished");
}

await run();
