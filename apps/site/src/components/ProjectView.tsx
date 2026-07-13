import type { ArbitraryTypedObject, PortableTextBlock } from "@portabletext/types";
import type { ProjectDetail, ProjectSiteMini } from "@/types/Project";
import { Body } from "@/src/components/Body";
import ProjectHero from "@/src/components/ProjectHero";
import SiteMini from "@/src/components/blocks/SiteMini";

export type { ProjectSiteMini };

export type ProjectViewData = ProjectDetail;

type ProjectViewProps = {
  project: ProjectViewData;
  draftMode?: boolean;
  contentDataAttribute?: string;
  leadInDataAttribute?: string;
  siteMiniDataAttribute?: string;
  getDataAttribute?: (key: string | undefined) => string | undefined;
  getLeadInDataAttribute?: (key: string | undefined) => string | undefined;
};

export default function ProjectView({
  project,
  draftMode = false,
  contentDataAttribute,
  leadInDataAttribute,
  siteMiniDataAttribute,
  getDataAttribute,
  getLeadInDataAttribute,
}: ProjectViewProps) {
  const content = (project.content ?? []) as (
    | PortableTextBlock
    | ArbitraryTypedObject
  )[];
  const leadIn = (project.leadIn ?? []) as (
    | PortableTextBlock
    | ArbitraryTypedObject
  )[];
  const siteMini = project.siteMini;
  const hasSiteMini = Boolean(siteMini?.url);

  return (
    <div className="prose prose-flow">
      <div
        className={
          hasSiteMini
            ? "prose-full my-8 grid gap-8 md:gap-12 md:grid-cols-[minmax(0,var(--project-lead-col))_1fr]"
            : "prose-full my-8"
        }
      >
        <div className="flex min-w-0 flex-col">
          <ProjectHero
            project={project}
            showDraftBadge={draftMode && project.isDraft === true}
            hasSiteMini={hasSiteMini}
          />
          {leadIn.length > 0 && (
            <div className="content" data-sanity={leadInDataAttribute}>
              <Body
                value={leadIn}
                draftMode={draftMode}
                getDataAttribute={getLeadInDataAttribute}
              />
            </div>
          )}
        </div>
        {hasSiteMini && siteMini && (
          <div className="not-prose relative hidden md:block">
            <div className="sticky top-[var(--site-scroll-offset)]">
              <SiteMini
                url={siteMini.url}
                embedUrl={siteMini.embedUrl}
                title={siteMini.title}
                draftMode={draftMode}
                dataSanity={siteMiniDataAttribute}
              />
            </div>
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
