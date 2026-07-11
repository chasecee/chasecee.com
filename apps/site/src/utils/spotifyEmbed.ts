export type SpotifyKind =
  | "album"
  | "track"
  | "playlist"
  | "artist"
  | "episode"
  | "show";

export type SpotifySize = "compact" | "default";
export type SpotifyTheme = "dark" | "light";

const KIND_RE =
  /(?:open\.spotify\.com\/(?:embed\/)?|spotify:)(album|track|playlist|artist|episode|show)[/:]([a-zA-Z0-9]+)/i;

export function parseSpotifyUrl(input: string): {
  kind: SpotifyKind;
  id: string;
  embedUrl: string;
} | null {
  const match = input.trim().match(KIND_RE);
  if (!match) return null;
  const kind = match[1].toLowerCase() as SpotifyKind;
  const id = match[2];
  return {
    kind,
    id,
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
  };
}

export function spotifyEmbedHeight(kind: SpotifyKind, size: SpotifySize): number {
  if (size === "compact") return 80;
  return kind === "track" ? 152 : 352;
}

export function spotifyEmbedSrc(
  embedUrl: string,
  theme: SpotifyTheme = "dark",
): string {
  const url = new URL(embedUrl);
  url.searchParams.set("utm_source", "generator");
  url.searchParams.set("theme", theme === "light" ? "1" : "0");
  return url.toString();
}
