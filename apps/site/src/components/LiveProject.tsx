import type { QueryParams, SanityDocument } from "@sanity/client";
import { useLiveQuery, STUDIO_URL, type QueryResponseInitial } from "@/sanity/live";
import { createReconcileOptimistic } from "@chasecee/sanity-kit/astro";
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
  >(
    project.content,
    createReconcileOptimistic(project._id, (action) => action.document.content),
  );

  const leadIn = useOptimistic<
    ProjectContentItem[] | undefined,
    SanityDocument<{ leadIn?: ProjectContentItem[] }>
  >(
    project.leadIn,
    createReconcileOptimistic(project._id, (action) => action.document.leadIn),
  );

  const attr = createDataAttribute({
    baseUrl: STUDIO_URL,
    id: project._id,
    type: project._type,
  });

  return (
    <ProjectView
      project={{ ...project, content: content ?? [], leadIn: leadIn ?? [] }}
      draftMode
      contentDataAttribute={attr("content")}
      leadInDataAttribute={attr("leadIn")}
      siteMiniDataAttribute={attr("siteMini")}
      getDataAttribute={(key) =>
        key ? attr(`content[_key=="${key}"]`) : undefined
      }
      getLeadInDataAttribute={(key) =>
        key ? attr(`leadIn[_key=="${key}"]`) : undefined
      }
    />
  );
}
