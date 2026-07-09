import React, { type CSSProperties } from "react";
import urlFor from "@/sanity/sanity.image";
import { PortableText } from "@portabletext/react";
import type {
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from "@portabletext/react";
import LucideIcon from "./icons/LucideIcon";
import { LUCIDE_ICONS } from "./icons/lucide";
import type {
  PortableTextBlock,
  ArbitraryTypedObject,
} from "@portabletext/types";
import type { InternalLinkValue, ExternalLinkValue } from "@/types/Content";
import { stegaClean } from "@sanity/client/stega";

type EmbedRatio = {
  desktop?: string;
  mobile?: string;
};

function normalizeAspectRatio(value: string | undefined): string {
  if (!value) return "16 / 9";
  const cleaned = stegaClean(value).trim();
  const compact = cleaned.replace(/\s+/g, "");
  const slash = compact.includes("/") ? compact : compact.replace(":", "/");
  if (!/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(slash)) return "16 / 9";
  const [width, height] = slash.split("/");
  return `${width} / ${height}`;
}

type EmbedStyle = CSSProperties & {
  "--embed-ar-desktop"?: string;
  "--embed-ar-mobile"?: string;
};

const InternalLink: React.FC<
  PortableTextMarkComponentProps<InternalLinkValue>
> = ({ value, children }) => {
  if (!value) return <>{children}</>;

  const { slug, refType } = value;
  let href: string;
  switch (refType) {
    case "project":
      href = slug ? `/projects/${slug}` : "#";
      break;
    case "page":
      href = slug ? (slug === "home" ? "/" : `/${slug}`) : "#";
      break;
    default:
      href = "#";
  }

  return <a href={href}>{children}</a>;
};

const ExternalLink: React.FC<
  PortableTextMarkComponentProps<ExternalLinkValue>
> = ({ value, children }) => {
  if (!value) return <>{children}</>;

  const { blank, href } = value;

  return blank ? (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="link_external group inline-flex items-center gap-1"
    >
      {children}
      <LucideIcon
        icon={LUCIDE_ICONS.externalLink}
        size={16}
        className="group-hover:scale-125"
      />
    </a>
  ) : (
    <a href={href}>{children}</a>
  );
};

const components: PortableTextComponents = {
  marks: {
    internalLink: InternalLink,
    link: ExternalLink,
  },
  types: {
    embed: ({ value }) => {
      const { url, title, aspectRatio, ratio } = value as {
        url?: string;
        title?: string;
        aspectRatio?: string;
        ratio?: EmbedRatio;
      };
      const embedUrl = typeof url === "string" ? stegaClean(url).trim() : "";
      if (!embedUrl) return null;
      const embedTitle =
        typeof title === "string" ? stegaClean(title).trim() : "";
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
        />
      );
    },
    image: ({ value }) => {
      if (!value) return null;

      const img = value as Record<string, unknown>;

      let width = (img?.asset as { metadata?: { dimensions?: { width?: number } } })?.metadata?.dimensions?.width;
      let height = (img?.asset as { metadata?: { dimensions?: { height?: number } } })?.metadata?.dimensions?.height;

      const asset = img?.asset as { _ref?: string; _id?: string } | undefined;
      if ((!width || !height) && (asset?._ref || asset?._id)) {
        const ref: string = asset._ref || asset._id || "";
        const parts = ref.split("-");
        if (parts.length >= 3) {
          const dims = parts[2];
          const [w, h] = dims.split("x").map((v) => parseInt(v, 10));
          if (!isNaN(w) && !isNaN(h)) {
            width = w;
            height = h;
          }
        }
      }

      width = width ?? 800;
      height = height ?? 600;
      const imageSrc = stegaClean(
        urlFor(value)
          .width(width)
          .height(height)
          .fit("max")
          .url(),
      );
      const imageAlt = stegaClean((img?.alt as string) || "");

      return (
        <img
          src={imageSrc}
          alt={imageAlt}
          width={width}
          height={height}
          className="mx-auto max-w-full md:mx-[-2em] md:max-w-[calc(100%+4em)]"
        />
      );
    },
  },
};

interface BodyProps {
  value: (PortableTextBlock | ArbitraryTypedObject)[];
}

export const Body: React.FC<BodyProps> = ({ value }) => {
  return <PortableText value={value} components={components} />;
};

export default Body;
