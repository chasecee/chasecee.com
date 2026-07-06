import React from "react";
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
import { previewPath } from "@/src/utils/previewPath";

function createInternalLink(preview: boolean) {
  const InternalLink: React.FC<
    PortableTextMarkComponentProps<InternalLinkValue>
  > = ({ value, children }) => {
    if (!value) return <>{children}</>;

    const { slug, refType } = value;
    let href: string;
    switch (refType) {
      case "project":
        href = slug ? previewPath(`/projects/${slug}`, preview) : "#";
        break;
      case "page":
        href = slug
          ? previewPath(slug === "home" ? "/" : `/${slug}`, preview)
          : "#";
        break;
      default:
        href = "#";
    }

    return <a href={href}>{children}</a>;
  };

  return InternalLink;
}

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
    internalLink: createInternalLink(false),
    link: ExternalLink,
  },
  types: {
    embed: ({ value }) => {
      const { url, title, aspectRatio } = value as {
        url?: string;
        title?: string;
        aspectRatio?: string;
      };
      if (!url) return null;

      return (
        <iframe
          src={url}
          title={title || "Embedded content"}
          style={{ aspectRatio: aspectRatio || "16/9" }}
          className="w-full border-0 md:mx-[-2em] md:w-[calc(100%+4em)]"
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

      return (
        <img
          src={urlFor(value)
            .width(width)
            .height(height)
            .fit("max")
            .url()}
          alt={(img?.alt as string) || ""}
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
  preview?: boolean;
}

export const Body: React.FC<BodyProps> = ({ value, preview = false }) => {
  const resolvedComponents = React.useMemo(
    () => ({
      ...components,
      marks: {
        ...components.marks,
        internalLink: createInternalLink(preview),
      },
    }),
    [preview],
  );

  return <PortableText value={value} components={resolvedComponents} />;
};

export default Body;
