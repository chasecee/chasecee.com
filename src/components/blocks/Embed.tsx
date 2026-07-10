import type { CSSProperties } from "react";
import { cleanMaybe, normalizeAspectRatio } from "./utils";

type EmbedRatio = {
  desktop?: string;
  mobile?: string;
};

type EmbedStyle = CSSProperties & {
  "--embed-ar-desktop"?: string;
  "--embed-ar-mobile"?: string;
};

type EmbedProps = {
  url?: string;
  title?: string;
  aspectRatio?: string;
  ratio?: EmbedRatio;
  draftMode: boolean;
  dataSanity?: string;
};

export default function Embed({
  url,
  title,
  aspectRatio,
  ratio,
  draftMode,
  dataSanity,
}: EmbedProps) {
  const embedUrl = cleanMaybe(url, draftMode);
  if (!embedUrl) return null;

  const embedTitle = cleanMaybe(title, draftMode);
  const desktopAspectRatio =
    typeof ratio?.desktop === "string" ? ratio.desktop : aspectRatio;
  const mobileAspectRatio =
    typeof ratio?.mobile === "string"
      ? ratio.mobile
      : typeof ratio?.desktop === "string"
        ? ratio.desktop
        : aspectRatio;

  const embedStyle: EmbedStyle = {
    "--embed-ar-desktop": normalizeAspectRatio(desktopAspectRatio),
    "--embed-ar-mobile": normalizeAspectRatio(mobileAspectRatio),
  };

  return (
    <iframe
      src={embedUrl}
      title={embedTitle || "Embedded content"}
      style={embedStyle}
      className="embed-frame w-full border-0"
      loading="lazy"
      allowFullScreen
      data-sanity={dataSanity}
    />
  );
}
