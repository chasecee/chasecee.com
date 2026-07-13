import { stegaClean } from "@sanity/client/stega";
import type { SanityImageSource } from "@sanity/image-url";
import { Embed, Gallery, Spotify } from "@chasecee/sanity-kit/astro";
import type { MusicDetail, MusicEmbed } from "@/types/Music";
import urlFor from "@/sanity/sanity.image";
import { withSanityImageParams } from "@/src/utils/sanityImageParams";

export type MusicViewData = MusicDetail;

type MusicViewProps = {
  item: MusicViewData;
  draftMode?: boolean;
  embedsDataAttribute?: string;
  getEmbedDataAttribute?: (key: string | undefined) => string | undefined;
};

export default function MusicView({
  item,
  draftMode = false,
  embedsDataAttribute,
  getEmbedDataAttribute,
}: MusicViewProps) {
  const showDraftBadge = draftMode && item.isDraft;
  const bandName = draftMode
    ? (item.bandName ?? "")
    : stegaClean(item.bandName ?? "");
  const albumName = draftMode
    ? (item.albumName ?? "")
    : stegaClean(item.albumName ?? "");
  const embeds = item.embeds ?? [];

  return (
    <div className="prose prose-flow mt-10">
      {showDraftBadge && (
        <span className="mb-4 inline-flex rounded bg-amber-300 px-2 py-1 text-xs font-bold uppercase tracking-wide text-black">
          Draft
        </span>
      )}
      <h1>{bandName}</h1>
      <h2>{albumName}</h2>

      {item.albumArt && (
        <img
          src={withSanityImageParams(item.albumArt, {
            w: 1600,
            fit: "max",
            auto: "format",
          })}
          alt={item.albumArtAlt || `${stegaClean(item.albumName)} album art`}
          width={1200}
          height={1200}
          className={`w-full rounded-xl ${showDraftBadge ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900" : ""}`}
        />
      )}

      {item.gallery?.images && item.gallery.images.length > 0 && (
        <section className="mt-8">
          <Gallery
            images={item.gallery.images.map((image) => ({
              ...image,
              asset: image.asset ?? undefined,
              alt: image.alt ?? undefined,
              caption: image.caption ?? undefined,
              url: image.url
                ? withSanityImageParams(image.url, {
                    w: 2400,
                    fit: "max",
                    auto: "format",
                  })
                : undefined,
            }))}
            columns={item.gallery.columns}
            draftMode={draftMode}
            buildImageUrl={(source, options) => {
              const image = urlFor(source as SanityImageSource).width(options.width);
              if (options.height) image.height(options.height);
              return image.fit("max").url();
            }}
          />
        </section>
      )}

      {item.links && item.links.length > 0 && (
        <section className="mt-10">
          <h3>Links</h3>
          <ul>
            {item.links.map((link) => (
              <li key={link._key || link.url}>
                <a href={stegaClean(link.url)} target="_blank" rel="noopener noreferrer">
                  {draftMode ? link.label : stegaClean(link.label)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {embeds.length > 0 && (
        <section
          className="not-prose mt-10 flex flex-col gap-6"
          data-sanity={embedsDataAttribute}
        >
          {embeds.map((embed) =>
            embed._type === "spotify" ? (
              <Spotify
                key={embed._key || embed.url}
                url={embed.url}
                title={embed.title}
                size={embed.size}
                theme={embed.theme}
                draftMode={draftMode}
                dataSanity={getEmbedDataAttribute?.(embed._key)}
              />
            ) : (
              <Embed
                key={embed._key || (embed as MusicEmbed).url}
                url={(embed as MusicEmbed).url}
                title={
                  (embed as MusicEmbed).title ||
                  `${stegaClean(item.albumName)} embed`
                }
                width={(embed as MusicEmbed).width}
                aspectRatio={(embed as MusicEmbed).aspectRatio}
                ratio={(embed as MusicEmbed).ratio}
                draftMode={draftMode}
                dataSanity={getEmbedDataAttribute?.(embed._key)}
              />
            ),
          )}
        </section>
      )}
    </div>
  );
}
