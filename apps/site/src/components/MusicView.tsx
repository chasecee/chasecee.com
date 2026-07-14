import { stegaClean } from "@sanity/client/stega";
import type { MusicDetail } from "@/types/Music";
import { withSanityImageParams } from "@chasecee/sanity-kit/astro";
import Body from "@/src/components/Body";
import MusicPlayers, { isPlatformListenLink } from "@/src/components/MusicPlayers";

export type MusicViewData = MusicDetail;

type MusicViewProps = {
  item: MusicViewData;
  draftMode?: boolean;
  embedsDataAttribute?: string;
  getEmbedDataAttribute?: (key: string | undefined) => string | undefined;
  contentDataAttribute?: string;
  getContentDataAttribute?: (key: string | undefined) => string | undefined;
};

export default function MusicView({
  item,
  draftMode = false,
  embedsDataAttribute,
  getEmbedDataAttribute,
  contentDataAttribute,
  getContentDataAttribute,
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
  const content = item.content ?? [];
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
        <div className="measure-wide">
          <img
            src={withSanityImageParams(item.albumArt, {
              w: 1600,
              fit: "max",
              auto: "format",
            })}
            alt={item.albumArtAlt || `${stegaClean(item.albumName)} album art`}
            width={1200}
            height={1200}
            className={`w-full ${showDraftBadge ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900" : ""}`}
          />
        </div>
      )}

      {content.length > 0 && (
        <section className="mt-8" data-sanity={contentDataAttribute}>
          <Body
            value={content}
            draftMode={draftMode}
            getDataAttribute={getContentDataAttribute}
          />
        </section>
      )}
    </div>
  );
}
