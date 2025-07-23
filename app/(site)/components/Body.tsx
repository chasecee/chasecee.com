import React from "react";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import {
  PortableText,
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from "@portabletext/react";
import { LaunchIcon } from "@sanity/icons";
import {
  PortableTextBlock,
  TypedObject,
  ArbitraryTypedObject,
} from "@portabletext/types";

interface InternalLinkValue extends TypedObject {
  _type: "internalLink";
  slug: string;
  refType: "project" | "page";
}

interface ExternalLinkValue extends TypedObject {
  _type: "link";
  blank: boolean;
  href: string;
}

const hasAnchorTag = (children: React.ReactNode): boolean => {
  if (typeof children === "string") return false;
  if (React.isValidElement(children) && children.type === "a") return true;
  if (Array.isArray(children)) {
    return children.some((child) => hasAnchorTag(child));
  }
  return false;
};

const InternalLink: React.FC<
  PortableTextMarkComponentProps<InternalLinkValue>
> = ({ value, children }) => {
  if (!value) return <>{children}</>;

  if (hasAnchorTag(children)) {
    return <span className="internal-link-nested">{children}</span>;
  }

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

  if (hasAnchorTag(children)) {
    return <span className="external-link-nested">{children}</span>;
  }

  const { blank, href } = value;
  return blank ? (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="link_external group inline-flex items-center gap-1"
    >
      {children}
      <LaunchIcon className="group-hover:scale-125" />
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

      const img = value as any;

      let width = img?.asset?.metadata?.dimensions?.width as number | undefined;
      let height = img?.asset?.metadata?.dimensions?.height as
        | number
        | undefined;

      if ((!width || !height) && (img?.asset?._ref || img?.asset?._id)) {
        const ref: string = img.asset._ref || img.asset._id;
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
        <Image
          src={urlFor(value as any)
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
