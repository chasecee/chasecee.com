import type { ArbitraryTypedObject, PortableTextBlock } from "@portabletext/types";
import type { ProjectDetail } from "@/types/Project";
import { Body } from "@/src/components/Body";
import ProjectHero from "@/src/components/ProjectHero";
import SiteMini from "@/src/components/blocks/SiteMini";

export type ProjectViewData = ProjectDetail;

type SiteMiniBlock = {
  _type: "siteMini";
  _key?: string;
  url?: string;
  embedUrl?: string;
  title?: string;
};

type ProjectViewProps = {
  project: ProjectViewData;
  draftMode?: boolean;
  contentDataAttribute?: string;
  leadInDataAttribute?: string;
  getDataAttribute?: (key: string | undefined) => string | undefined;
  getLeadInDataAttribute?: (key: string | undefined) => string | undefined;
};

export default function ProjectView({
  project,
  draftMode = false,
  contentDataAttribute,
  leadInDataAttribute,
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
  const siteMiniIndex = leadIn.findIndex((block) => {
    if (!block || typeof block !== "object") return false;
    if ((block as { _type?: string })._type !== "siteMini") return false;
    const url = (block as { url?: unknown }).url;
    return typeof url === "string" && url.trim().length > 0;
  });
  const siteMini =
    siteMiniIndex >= 0 ? (leadIn[siteMiniIndex] as SiteMiniBlock) : null;
  const leadInContent =
    siteMiniIndex >= 0
      ? leadIn.filter((_, index) => index !== siteMiniIndex)
      : leadIn;
  const siteMiniDataAttribute = siteMini
    ? getLeadInDataAttribute?.(siteMini._key)
    : undefined;
  const hasSiteMini = Boolean(siteMini?.url);

  return (
    <div className="prose prose-flow">
      <div
        className={
          hasSiteMini
            ? "w-full my-8 grid gap-8 md:gap-12 md:grid-cols-[minmax(0,var(--project-lead-col))_1fr]"
            : "w-full my-8"
        }
      >
        <div className="flex min-w-0 flex-col">
          <ProjectHero
            project={project}
            showDraftBadge={draftMode && project.isDraft === true}
            hasSiteMini={hasSiteMini}
          />
          {leadInContent.length > 0 && (
            <div data-sanity={leadInDataAttribute}>
              <Body
                value={leadInContent}
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
        <div data-sanity={contentDataAttribute}>
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
