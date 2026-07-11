type OEmbedResponse = {
  title?: string;
  author_name?: string;
};

function normalizeUrlForOEmbed(input: string): string | null {
  const trimmed = input.trim();
  const spotifyUri = trimmed.match(
    /^spotify:(album|track|playlist|artist|episode|show):([a-zA-Z0-9]+)$/i,
  );
  if (spotifyUri) {
    return `https://open.spotify.com/${spotifyUri[1].toLowerCase()}/${spotifyUri[2]}`;
  }
  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) return null;

    const host = url.hostname.replace(/^www\./, "");
    if (host === "open.spotify.com" || host === "spotify.com") {
      const match = url.pathname.match(
        /^\/(?:embed\/)?(album|track|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/i,
      );
      if (!match) return null;
      return `https://open.spotify.com/${match[1].toLowerCase()}/${match[2]}`;
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function oEmbedEndpoint(input: string): string | null {
  const url = normalizeUrlForOEmbed(input);
  if (!url) return null;

  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  if (host === "open.spotify.com" || host === "spotify.com") {
    return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com"
  ) {
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  }
  return null;
}

export function formatOEmbedTitle(data: OEmbedResponse): string | null {
  const title = data.title?.trim();
  if (!title) return null;
  const author = data.author_name?.trim();
  if (author && !title.includes(author)) return `${title} · ${author}`;
  return title;
}

export async function fetchOEmbedTitle(
  url: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const endpoint = oEmbedEndpoint(url);
  if (!endpoint) return null;
  const res = await fetch(endpoint, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as OEmbedResponse;
  return formatOEmbedTitle(data);
}
