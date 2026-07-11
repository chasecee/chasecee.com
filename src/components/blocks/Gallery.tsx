import { useEffect, type CSSProperties } from "react";
import urlFor from "@/sanity/sanity.image";
import { cleanMaybe } from "./utils";

type AssetRef = {
  _ref?: string;
  _id?: string;
  metadata?: {
    dimensions?: {
      width?: number;
      height?: number;
    };
  };
};

export type GalleryImageValue = {
  _key?: string;
  asset?: AssetRef;
  alt?: string;
  caption?: string;
  url?: string;
};

type GalleryProps = {
  images?: GalleryImageValue[];
  columns?: number;
  draftMode?: boolean;
  dataSanity?: string;
};

function imageDimensions(image: GalleryImageValue): { width: number; height: number } {
  const meta = image.asset?.metadata?.dimensions;
  if (meta?.width && meta?.height) {
    return { width: meta.width, height: meta.height };
  }

  const ref = image.asset?._ref || image.asset?._id || "";
  const parts = ref.split("-");
  if (parts.length >= 3) {
    const [w, h] = parts[2].split("x").map((item) => Number.parseInt(item, 10));
    if (Number.isFinite(w) && Number.isFinite(h)) return { width: w, height: h };
  }

  return { width: 1600, height: 1600 };
}

export default function Gallery({
  images,
  columns = 2,
  draftMode = false,
  dataSanity,
}: GalleryProps) {
  useEffect(() => {
    document.dispatchEvent(new Event("gallery:mount"));
  }, [images]);

  if (!images?.length) return null;

  const safeColumns = Number.isInteger(columns)
    ? Math.min(6, Math.max(0, columns))
    : 2;
  const desktopColumns = safeColumns === 0 ? images.length : safeColumns;

  const rows: GalleryImageValue[][] = [];
  for (let i = 0; i < images.length; i += desktopColumns) {
    rows.push(images.slice(i, i + desktopColumns));
  }

  return (
    <div
      className="prose-wide not-prose flex flex-col gap-2 md:gap-4"
      data-pswp-gallery
      data-sanity={dataSanity}
    >
      {rows.map((row, rowIndex) => {
        const template = row
          .map((image) => {
            const { width, height } = imageDimensions(image);
            return `${(width / height).toFixed(4)}fr`;
          })
          .join(" ");

        return (
          <div
            key={row[0]?._key || `row-${rowIndex}`}
            className="grid gap-1 md:gap-2 grid-cols-1 sm:[grid-template-columns:var(--row-cols)]"
            style={{ "--row-cols": template } as CSSProperties}
          >
            {row.map((image) => {
              const { width, height } = imageDimensions(image);
              const thumb = image.url
                ? cleanMaybe(image.url, draftMode)
                : image.asset
                  ? urlFor(image).width(1400).fit("max").url()
                  : "";
              const full = image.url
                ? cleanMaybe(image.url, draftMode)
                : image.asset
                  ? urlFor(image).width(2400).fit("max").url()
                  : "";
              if (!thumb || !full) return null;

              const alt = cleanMaybe(image.alt || "", draftMode);
              const caption = cleanMaybe(image.caption || "", draftMode);

              return (
                <figure key={image._key || full} className="m-0">
                  <a
                    href={full}
                    className="block"
                    data-pswp-src={full}
                    data-pswp-width={width}
                    data-pswp-height={height}
                    data-caption={caption || undefined}
                    data-cropped="true"
                  >
                    <img
                      src={thumb}
                      alt={alt}
                      width={width}
                      height={height}
                      className="h-auto w-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                  {caption ? (
                    <figcaption className="mt-2 text-xs opacity-50">
                      <em>{caption}</em>
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
