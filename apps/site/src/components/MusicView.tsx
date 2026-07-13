import { stegaClean } from "@sanity/client/stega";
import type { SanityImageSource } from "@sanity/image-url";
import { Gallery } from "@chasecee/sanity-kit/astro";
import type { MusicDetail } from "@/types/Music";
import urlFor from "@/sanity/sanity.image";
import { withSanityImageParams } from "@/src/utils/sanityImageParams";
import MusicPlayers, { isPlatformListenLink } from "@/src/components/MusicPlayers";

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
  const links = item.links ?? [];
  const otherLinks = links.filter((link) => !isPlatformListenLink(link.label));

  return (
    <div className="prose prose-flow mt-10">
      {showDraftBadge && (
        <span className="mb-4 inline-flex rounded bg-amber-300 px-2 py-1 text-xs font-bold uppercase tracking-wide text-black">
          Draft
        </span>
      )}
      <h1>{bandName}</h1>
      <h2>{albumName}</h2>

      <MusicPlayers
        embeds={embeds}
        links={links}
        albumName={stegaClean(item.albumName ?? "")}
        draftMode={draftMode}
        embedsDataAttribute={embedsDataAttribute}
        getEmbedDataAttribute={getEmbedDataAttribute}
      />

      {otherLinks.length > 0 && (
        <section className="mt-10">
          <h3>Links</h3>
          <ul>
            {otherLinks.map((link) => (
              <li key={link._key || link.url}>
                <a href={stegaClean(link.url)} target="_blank" rel="noopener noreferrer">
                  {draftMode ? link.label : stegaClean(link.label)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

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
    </div>
  );
}
