import { startTransition, useId, useState } from "react";
import { stegaClean } from "@sanity/client/stega";
import { Spotify } from "@chasecee/sanity-kit/astro";
import type { MusicDetail } from "@/types/Music";

type EmbedItem = NonNullable<MusicDetail["embeds"]>[number];
type LinkItem = NonNullable<MusicDetail["links"]>[number];

type PlayerTab = {
  id: string;
  label: string;
  kind: "spotify" | "apple";
  url: string;
  title?: string;
  size?: "default" | "compact";
  dataSanity?: string;
};

type MusicPlayersProps = {
  embeds: EmbedItem[];
  links: LinkItem[];
  albumName: string;
  draftMode?: boolean;
  embedsDataAttribute?: string;
  getEmbedDataAttribute?: (key: string | undefined) => string | undefined;
};

const APPLE_HOST = /(?:^|\.)music\.apple\.com$/i;
const PLAYER_HEIGHT = 352;

function appleEmbedSrc(raw: string): string | null {
  try {
    const url = new URL(stegaClean(raw).trim());
    if (!APPLE_HOST.test(url.hostname)) return null;
    url.hostname = "embed.music.apple.com";
    url.searchParams.set("theme", "dark");
    url.searchParams.delete("uo");
    return url.toString();
  } catch {
    return null;
  }
}

function buildTabs(
  embeds: EmbedItem[],
  links: LinkItem[],
  getEmbedDataAttribute?: (key: string | undefined) => string | undefined,
): PlayerTab[] {
  const tabs: PlayerTab[] = [];
  let hasApple = false;

  for (const embed of embeds) {
    if (embed._type === "spotify" && embed.url) {
      tabs.push({
        id: embed._key || `spotify-${embed.url}`,
        label: "Spotify",
        kind: "spotify",
        url: embed.url,
        title: embed.title,
        size: embed.size === "compact" ? "compact" : "default",
        dataSanity: getEmbedDataAttribute?.(embed._key),
      });
      continue;
    }

    if (embed._type === "embed" && embed.url) {
      const src = appleEmbedSrc(embed.url);
      if (!src) continue;
      hasApple = true;
      tabs.push({
        id: embed._key || `apple-${src}`,
        label: "Apple Music",
        kind: "apple",
        url: src,
        title: embed.title,
        dataSanity: getEmbedDataAttribute?.(embed._key),
      });
    }
  }

  if (!hasApple) {
    for (const link of links) {
      const label = stegaClean(link.label ?? "");
      const href = stegaClean(link.url ?? "");
      if (!href || !/apple music/i.test(label)) continue;
      const src = appleEmbedSrc(href);
      if (!src) continue;
      tabs.push({
        id: link._key || `apple-link-${src}`,
        label: "Apple Music",
        kind: "apple",
        url: src,
      });
      break;
    }
  }

  return tabs;
}

export function isPlatformListenLink(label: string | undefined): boolean {
  const value = stegaClean(label ?? "");
  return /^spotify$/i.test(value) || /^apple music$/i.test(value);
}

export default function MusicPlayers({
  embeds,
  links,
  albumName,
  draftMode = false,
  embedsDataAttribute,
  getEmbedDataAttribute,
}: MusicPlayersProps) {
  const tabs = buildTabs(embeds, links, getEmbedDataAttribute);
  const reactId = useId();
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  if (!active) return null;

  return (
    <section
      className="not-prose mx-auto mt-10 w-full"
      style={{ maxWidth: "min(var(--prose-measure), 100%)" }}
      data-sanity={embedsDataAttribute}
    >
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Listen"
          className="mb-4 flex gap-5 border-b border-current/15"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${reactId}-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${reactId}-panel`}
                tabIndex={selected ? 0 : -1}
                className={`-mb-px border-b pb-2 text-sm tracking-wide transition-colors ${
                  selected
                    ? "border-current text-current"
                    : "border-transparent text-current/45 hover:text-current/75"
                }`}
                onClick={() => {
                  startTransition(() => setActiveId(tab.id));
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        role="tabpanel"
        id={`${reactId}-panel`}
        aria-labelledby={`${reactId}-${active.id}`}
        style={{ minHeight: PLAYER_HEIGHT }}
      >
        {active.kind === "spotify" ? (
          <Spotify
            key={active.id}
            url={active.url}
            title={active.title}
            size={active.size}
            theme="dark"
            draftMode={draftMode}
            dataSanity={active.dataSanity}
          />
        ) : (
          <iframe
            key={active.id}
            src={active.url}
            title={active.title || `${albumName} on Apple Music`}
            width="100%"
            height={PLAYER_HEIGHT}
            className="embed-frame-fixed w-full border-0"
            style={{ height: PLAYER_HEIGHT, borderRadius: 12 }}
            allow="autoplay *; encrypted-media *; clipboard-write"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            loading="lazy"
            data-sanity={active.dataSanity}
          />
        )}
      </div>
    </section>
  );
}
