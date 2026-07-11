import { cleanMaybe } from "./utils";
import {
  parseSpotifyUrl,
  spotifyEmbedHeight,
  spotifyEmbedSrc,
  type SpotifySize,
  type SpotifyTheme,
} from "@/src/utils/spotifyEmbed";

type SpotifyProps = {
  url?: string;
  title?: string;
  size?: SpotifySize;
  theme?: SpotifyTheme;
  draftMode: boolean;
  dataSanity?: string;
};

export default function Spotify({
  url,
  title,
  size = "default",
  theme = "dark",
  draftMode,
  dataSanity,
}: SpotifyProps) {
  const raw = cleanMaybe(url, draftMode);
  const parsed = raw ? parseSpotifyUrl(raw) : null;
  if (!parsed) return null;

  const height = spotifyEmbedHeight(parsed.kind, size);
  const src = spotifyEmbedSrc(parsed.embedUrl, theme);
  const embedTitle = cleanMaybe(title, draftMode) || `Spotify ${parsed.kind}`;

  return (
    <div
      className="mx-auto w-full"
      style={{ maxWidth: "min(var(--prose-measure), 100%)" }}
      data-sanity={dataSanity}
    >
      <iframe
        src={src}
        title={embedTitle}
        width="100%"
        height={height}
        style={{ height }}
        className="embed-frame-fixed w-full border-0"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
