import { AutoTitleObjectInput } from "../plugins/auto-title/AutoTitleObjectInput";

const SPOTIFY_RE =
  /(?:open\.spotify\.com\/(?:embed\/)?|spotify:)(album|track|playlist|artist|episode|show)[/:]([a-zA-Z0-9]+)/i;

function parseSpotifyUrl(input: string) {
  const match = input.trim().match(SPOTIFY_RE);
  if (!match) return null;
  return { kind: match[1].toLowerCase(), id: match[2] };
}

const spotify = {
  name: "spotify",
  type: "object",
  title: "Spotify",
  components: { input: AutoTitleObjectInput },
  fields: [
    {
      name: "url",
      type: "url",
      title: "Spotify URL",
      description: "Track, album, playlist, artist, show, or episode link.",
      validation: (Rule: any) =>
        Rule.required().custom((value: string | undefined) => {
          if (!value) return true;
          return parseSpotifyUrl(value)
            ? true
            : "Paste a Spotify open.spotify.com or spotify: URI";
        }),
    },
    {
      name: "size",
      type: "string",
      title: "Size",
      initialValue: "default",
      options: {
        list: [
          { title: "Default (152 track / 352 collection)", value: "default" },
          { title: "Compact (80)", value: "compact" },
        ],
        layout: "radio",
      },
    },
    {
      name: "theme",
      type: "string",
      title: "Theme",
      initialValue: "dark",
      options: {
        list: [
          { title: "Dark", value: "dark" },
          { title: "Light", value: "light" },
        ],
        layout: "radio",
      },
    },
    {
      name: "title",
      type: "string",
      title: "Title",
      description: "Auto-filled from Spotify. Editable.",
    },
  ],
  preview: {
    select: { title: "title", subtitle: "url", size: "size" },
    prepare: ({
      title,
      subtitle,
      size,
    }: {
      title?: string;
      subtitle?: string;
      size?: string;
    }) => {
      const parsed = subtitle ? parseSpotifyUrl(subtitle) : null;
      return {
        title: title || (parsed ? `Spotify ${parsed.kind}` : "Spotify"),
        subtitle: parsed
          ? `${parsed.kind} · ${size || "default"}`
          : subtitle || "",
      };
    },
  },
};

export default spotify;
