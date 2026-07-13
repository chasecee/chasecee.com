import type { QueryParams, SanityDocument } from "@sanity/client";
import { useLiveQuery, STUDIO_URL, type QueryResponseInitial } from "@/sanity/live";
import { createReconcileOptimistic } from "@chasecee/sanity-kit/astro";
import {
  createDataAttribute,
  useOptimistic,
} from "@sanity/visual-editing/react";
import ProjectView, { type ProjectViewData } from "@/src/components/ProjectView";

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
    NonNullable<ProjectViewData["content"]> | undefined,
    SanityDocument<{ content?: NonNullable<ProjectViewData["content"]> }>
  >(
    project.content ?? undefined,
    createReconcileOptimistic(project._id, (action) => action.document.content),
  );

  const leadIn = useOptimistic<
    NonNullable<ProjectViewData["leadIn"]> | undefined,
    SanityDocument<{ leadIn?: NonNullable<ProjectViewData["leadIn"]> }>
  >(
    project.leadIn ?? undefined,
    createReconcileOptimistic(project._id, (action) => action.document.leadIn),
  );

  const attr = createDataAttribute({
    baseUrl: STUDIO_URL,
    id: project._id,
    type: project._type,
  });

  return (
    <ProjectView
      project={{
        ...project,
        content: content ?? project.content ?? [],
        leadIn: leadIn ?? project.leadIn ?? [],
      }}
      draftMode
      contentDataAttribute={attr("content")}
      leadInDataAttribute={attr("leadIn")}
      getDataAttribute={(key) =>
        key ? attr(`content[_key=="${key}"]`) : undefined
      }
      getLeadInDataAttribute={(key) =>
        key ? attr(`leadIn[_key=="${key}"]`) : undefined
      }
    />
  );
}
