import type { QueryParams, SanityDocument } from "@sanity/client";
import {
  createDataAttribute,
  useOptimistic,
} from "@sanity/visual-editing/react";
import { useLiveQuery, STUDIO_URL, type QueryResponseInitial } from "@/sanity/live";
import { createReconcileOptimistic } from "@chasecee/sanity-kit/astro";
import MusicView, { type MusicViewData } from "@/src/components/MusicView";

type LiveMusicProps = {
  query: string;
  params: QueryParams;
  initial: QueryResponseInitial<MusicViewData>;
};

export default function LiveMusic({ query, params, initial }: LiveMusicProps) {
  const { data } = useLiveQuery<MusicViewData>(query, params, { initial });
  const item = data ?? initial.data;

  const embeds = useOptimistic<
    NonNullable<MusicViewData["embeds"]> | undefined,
    SanityDocument<{ embeds?: NonNullable<MusicViewData["embeds"]> }>
  >(
    item.embeds ?? undefined,
    createReconcileOptimistic(item._id, (action) => action.document.embeds),
  );

  const content = useOptimistic<
    NonNullable<MusicViewData["content"]> | undefined,
    SanityDocument<{ content?: NonNullable<MusicViewData["content"]> }>
  >(
    item.content ?? undefined,
    createReconcileOptimistic(item._id, (action) => action.document.content),
  );

  const attr = createDataAttribute({
    baseUrl: STUDIO_URL,
    id: item._id,
    type: item._type || "music",
  });

  return (
    <MusicView
      item={{
        ...item,
        embeds: embeds ?? item.embeds ?? [],
        content: content ?? item.content ?? [],
      }}
      draftMode
      embedsDataAttribute={attr("embeds")}
      contentDataAttribute={attr("content")}
      getEmbedDataAttribute={(key) =>
        key ? attr(`embeds[_key=="${key}"]`) : undefined
      }
      getContentDataAttribute={(key) =>
        key ? attr(`content[_key=="${key}"]`) : undefined
      }
    />
  );
}
