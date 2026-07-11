import type { ArbitraryTypedObject, PortableTextBlock } from "@portabletext/types";
import type { ProjectSiteMini } from "@/types/Project";
import { Body } from "@/src/components/Body";
import ProjectHero from "@/src/components/ProjectHero";
import SiteMini from "@/src/components/blocks/SiteMini";

export type { ProjectSiteMini };

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
  siteMini?: ProjectSiteMini;
  content?: (PortableTextBlock | ArbitraryTypedObject)[];
};

type ProjectViewProps = {
  project: ProjectViewData;
  draftMode?: boolean;
  contentDataAttribute?: string;
  siteMiniDataAttribute?: string;
  getDataAttribute?: (key: string | undefined) => string | undefined;
};

export default function ProjectView({
  project,
  draftMode = false,
  contentDataAttribute,
  siteMiniDataAttribute,
  getDataAttribute,
}: ProjectViewProps) {
  const content = project.content ?? [];
  const siteMini = project.siteMini;
  const hasSiteMini = Boolean(siteMini?.url);

  return (
    <div className="prose prose-flow">
      <div
        className={
          hasSiteMini
            ? "prose-full not-prose mb-10 grid items-stretch gap-6 md:grid-cols-3"
            : "prose-full not-prose mb-10"
        }
      >
        <div className={hasSiteMini ? "md:col-span-2" : undefined}>
          <ProjectHero
            project={project}
            showDraftBadge={draftMode && project.isDraft === true}
            showUrlLink={!hasSiteMini}
          />
        </div>
        {hasSiteMini && siteMini && (
          <div className="flex items-center justify-center md:col-span-1">
            <SiteMini
              url={siteMini.url}
              embedUrl={siteMini.embedUrl}
              title={siteMini.title}
              draftMode={draftMode}
              dataSanity={siteMiniDataAttribute}
            />
          </div>
        )}
      </div>
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
