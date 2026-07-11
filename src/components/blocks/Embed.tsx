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
  width?: "content" | "full";
  aspectRatio?: string;
  ratio?: EmbedRatio;
  draftMode: boolean;
  dataSanity?: string;
};

export default function Embed({
  url,
  title,
  width = "full",
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
    <div
      className={width === "full" ? "prose-wide w-full" : "mx-auto w-full"}
      style={
        width === "content"
          ? ({ maxWidth: "min(var(--prose-measure), 100%)" } as CSSProperties)
          : undefined
      }
      data-sanity={dataSanity}
    >
      <iframe
        src={embedUrl}
        title={embedTitle || "Embedded content"}
        style={embedStyle}
        className="embed-frame w-full border-0"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}
