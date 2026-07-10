import React, { useMemo } from "react";
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
import Columns from "./blocks/Columns";
import Embed from "./blocks/Embed";
import ImageBlock from "./blocks/ImageBlock";

type DataAttributeResolver = (key: string | undefined) => string | undefined;

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

function getKey(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const key = (value as { _key?: unknown })._key;
  return typeof key === "string" ? key : undefined;
}

function createComponents(
  draftMode: boolean,
  getDataAttribute?: DataAttributeResolver,
): PortableTextComponents {
  return {
    block: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value: PortableTextBlock;
    }) => {
      const style =
        value && typeof value === "object" && "style" in value
          ? (value.style as string)
          : "normal";
      const dataSanity = getDataAttribute?.(getKey(value));
      if (style === "h1") return <h1 data-sanity={dataSanity}>{children}</h1>;
      if (style === "h2") return <h2 data-sanity={dataSanity}>{children}</h2>;
      if (style === "h3") return <h3 data-sanity={dataSanity}>{children}</h3>;
      if (style === "h4") return <h4 data-sanity={dataSanity}>{children}</h4>;
      if (style === "blockquote") {
        return <blockquote data-sanity={dataSanity}>{children}</blockquote>;
      }
      return <p data-sanity={dataSanity}>{children}</p>;
    },
    listItem: ({
      children,
      value,
    }: {
      children?: React.ReactNode;
      value: PortableTextBlock;
    }) => (
      <li data-sanity={getDataAttribute?.(getKey(value))}>{children}</li>
    ),
    marks: {
      internalLink: InternalLink,
      link: ExternalLink,
    },
    types: {
      columns: ({ value }) => {
        const { columns, valign } = value as {
          columns?: { _key: string; content?: PortableTextBlock[] }[];
          valign?: string;
        };
        return (
          <Columns
            columns={columns}
            valign={valign}
            components={createComponents(draftMode)}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      embed: ({ value }) => {
        const { url, title, aspectRatio, ratio } = value as {
          url?: string;
          title?: string;
          aspectRatio?: string;
          ratio?: { desktop?: string; mobile?: string };
        };
        return (
          <Embed
            url={url}
            title={title}
            aspectRatio={aspectRatio}
            ratio={ratio}
            draftMode={draftMode}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
      image: ({ value }) => {
        if (!value) return null;
        return (
          <ImageBlock
            value={value as Record<string, unknown>}
            draftMode={draftMode}
            dataSanity={getDataAttribute?.(getKey(value))}
          />
        );
      },
    },
  };
}

interface BodyProps {
  value: (PortableTextBlock | ArbitraryTypedObject)[];
  draftMode?: boolean;
  getDataAttribute?: DataAttributeResolver;
}

export const Body: React.FC<BodyProps> = ({
  value,
  draftMode = false,
  getDataAttribute,
}) => {
  const components = useMemo(
    () => createComponents(draftMode, getDataAttribute),
    [draftMode, getDataAttribute],
  );
  return <PortableText value={value} components={components} />;
};

export default Body;
