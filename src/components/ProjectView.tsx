import type { ArbitraryTypedObject, PortableTextBlock } from "@portabletext/types";
import { Body } from "@/src/components/Body";
import ProjectHero from "@/src/components/ProjectHero";

export type ProjectViewData = {
  _id: string;
  _type: string;
  isDraft?: boolean;
  name: string;
  subtitle?: string;
  url?: string;
  archived?: boolean;
  image?: string;
  svgcode?: { code?: string };
  content?: (PortableTextBlock | ArbitraryTypedObject)[];
};

type ProjectViewProps = {
  project: ProjectViewData;
  draftMode?: boolean;
  contentDataAttribute?: string;
  getDataAttribute?: (key: string | undefined) => string | undefined;
};

export default function ProjectView({
  project,
  draftMode = false,
  contentDataAttribute,
  getDataAttribute,
}: ProjectViewProps) {
  const content = project.content ?? [];

  return (
    <div className="prose mx-auto">
      <ProjectHero
        project={project}
        showDraftBadge={draftMode && project.isDraft === true}
      />
      {content.length > 0 && (
        <div className="content" data-sanity={contentDataAttribute}>
          <Body
            value={content}
            draftMode={draftMode}
            getDataAttribute={getDataAttribute}
          />
        </div>
      )}
    </div>
  );
}
