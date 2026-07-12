import type { QueryParams, SanityDocument } from "@sanity/client";
import {
  createDataAttribute,
  useOptimistic,
} from "@sanity/visual-editing/react";
import { useLiveQuery, STUDIO_URL, type QueryResponseInitial } from "@/sanity/live";
import { reconcileByKey } from "@/sanity/reconcile-by-key";
import MusicView, { type MusicViewData } from "@/src/components/MusicView";
import type { MusicEmbed, MusicSpotify } from "@/types/Music";

type MusicEmbedItem = MusicEmbed | MusicSpotify;

type LiveMusicProps = {
  query: string;
  params: QueryParams;
  initial: QueryResponseInitial<MusicViewData>;
};

export default function LiveMusic({ query, params, initial }: LiveMusicProps) {
  const { data } = useLiveQuery<MusicViewData>(query, params, { initial });
  const item = data ?? initial.data;

  const embeds = useOptimistic<
    MusicEmbedItem[] | undefined,
    SanityDocument<{ embeds?: MusicEmbedItem[] }>
  >(item.embeds, (current, action) => {
    if (action.id !== item._id) return current;
    const next = action.document.embeds;
    return Array.isArray(next) ? reconcileByKey(current, next) : current;
  });

  const attr = createDataAttribute({
    baseUrl: STUDIO_URL,
    id: item._id,
    type: item._type || "music",
  });

  return (
    <MusicView
      item={{ ...item, embeds: embeds ?? [] }}
      draftMode
      embedsDataAttribute={attr("embeds")}
      getEmbedDataAttribute={(key) =>
        key ? attr(`embeds[_key=="${key}"]`) : undefined
      }
    />
  );
}
