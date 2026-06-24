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
      href = slug ? `/${slug}` : "#";
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
          className="mx-auto rounded-lg"
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
