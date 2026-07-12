import React from "react";
import type {
  PortableTextBlock,
  ArbitraryTypedObject,
} from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url";
import { Body as SharedBody } from "@chasecee/sanity-kit/astro";
import urlFor from "@/sanity/sanity.image";

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
        const image = urlFor(source as SanityImageSource).width(options.width);
        if (options.height) image.height(options.height);
        return image.fit("max").url();
      }}
    />
  );
};

export default Body;
