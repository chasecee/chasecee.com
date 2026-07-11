import React from "react";
import type {
  PortableTextBlock,
  ArbitraryTypedObject,
} from "@portabletext/types";
import { Body as SharedBody } from "@chasecee/sanity-kit/astro";
import urlFor from "@/sanity/sanity.image";
import type { InternalLinkValue } from "@/types/Content";

type DataAttributeResolver = (key: string | undefined) => string | undefined;

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
  return (
    <SharedBody
      value={value}
      draftMode={draftMode}
      getDataAttribute={getDataAttribute}
      buildImageUrl={(source, options) => {
        const image = urlFor(source).width(options.width);
        if (options.height) image.height(options.height);
        return image.fit("max").url();
      }}
      resolveInternalHref={(link) => {
        const value = link as InternalLinkValue;
        if (!value?.slug) return "#";
        if (value.refType === "project") return `/projects/${value.slug}`;
        if (value.refType === "page") return value.slug === "home" ? "/" : `/${value.slug}`;
        if (value.refType === "music") return `/music/${value.slug}`;
        return "#";
      }}
    />
  );
};

export default Body;
