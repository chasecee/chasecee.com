import type { QueryParams, SanityDocument } from "@sanity/client";
import { useLiveQuery, STUDIO_URL, type QueryResponseInitial } from "@/sanity/live";
import {
  createDataAttribute,
  useOptimistic,
} from "@sanity/visual-editing/react";
import type { ArbitraryTypedObject, PortableTextBlock } from "@portabletext/types";
import ProjectView, { type ProjectViewData } from "@/src/components/ProjectView";

type ProjectContentItem = PortableTextBlock | ArbitraryTypedObject;

type LiveProjectProps = {
  query: string;
  params: QueryParams;
  initial: QueryResponseInitial<ProjectViewData>;
};

function itemKey(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const key = (value as { _key?: unknown })._key;
  return typeof key === "string" ? key : undefined;
}

function reconcileByKey(
  current: ProjectContentItem[] | undefined,
  next: ProjectContentItem[],
): ProjectContentItem[] {
  const byKey = new Map(
    (current ?? [])
      .map((item) => [itemKey(item), item] as const)
      .filter((entry): entry is [string, ProjectContentItem] => !!entry[0]),
  );
  return next.map((item) => {
    const key = itemKey(item);
    return key ? (byKey.get(key) ?? item) : item;
  });
}

export default function LiveProject({
  query,
  params,
  initial,
}: LiveProjectProps) {
  const { data } = useLiveQuery<ProjectViewData>(query, params, { initial });
  const project = data ?? initial.data;

  const content = useOptimistic<
    ProjectContentItem[] | undefined,
    SanityDocument<{ content?: ProjectContentItem[] }>
  >(project.content, (current, action) => {
    if (action.id !== project._id) return current;
    const next = action.document.content;
    return Array.isArray(next) ? reconcileByKey(current, next) : current;
  });

  const attr = createDataAttribute({
    baseUrl: STUDIO_URL,
    id: project._id,
    type: project._type,
  });

  return (
    <ProjectView
      project={{ ...project, content: content ?? [] }}
      draftMode
      contentDataAttribute={attr("content")}
      siteMiniDataAttribute={attr("siteMini")}
      getDataAttribute={(key) =>
        key ? attr(`content[_key=="${key}"]`) : undefined
      }
    />
  );
}
