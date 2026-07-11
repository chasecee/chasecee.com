import { stegaClean } from "@sanity/client/stega";
import urlFor from "@/sanity/sanity.image";
import { sanitizeProjectSvg } from "@/src/utils/sanitizeProjectSvg";
import LucideIcon from "@/src/components/icons/LucideIcon";
import { LUCIDE_ICONS } from "@/src/components/icons/lucide";

type ProjectHeroData = {
  name: string;
  subtitle?: string;
  url?: string;
  archived?: boolean;
  image?: string;
  svgcode?: {
    code?: string;
  };
};

type ProjectHeroProps = {
  project: ProjectHeroData;
  showDraftBadge?: boolean;
  hasSiteMini?: boolean;
  className?: string;
};

function shortenUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}

export default function ProjectHero({
  project,
  showDraftBadge = false,
  hasSiteMini = false,
  className = "",
}: ProjectHeroProps) {
  const cleanName = stegaClean(project.name);
  const projectUrl =
    typeof project.url === "string" ? stegaClean(project.url).trim() : "";
  const rawSvgCode = project.svgcode?.code;
  const svgCode =
    typeof rawSvgCode === "string"
      ? sanitizeProjectSvg(stegaClean(rawSvgCode).trim())
      : "";
  const imageUrl = project.image
    ? urlFor(project.image).width(1600).height(900).dpr(1.5).url()
    : "";
  const hasLogo = Boolean(svgCode);

  return (
    <header
      className={
        hasLogo
          ? `not-prose relative flex flex-col max-w-[90%] ${showDraftBadge ? "ring-2 ring-amber-300 ring-inset" : ""} ${className}`
          : `not-prose relative flex h-full min-h-72 flex-col justify-end overflow-hidden p-8 text-white ${showDraftBadge ? "ring-2 ring-amber-300 ring-inset" : ""} ${className}`
      }
    >
      {!hasLogo && (
        <div className="absolute inset-0 bg-black">
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              width={1600}
              height={900}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          )}
          <div className="absolute inset-0 bg-black/70" />
        </div>
      )}
      {showDraftBadge && (
        <span className="absolute right-4 top-4 z-20 inline-flex rounded bg-amber-300 px-2 py-1 text-xs font-bold uppercase tracking-wide text-black">
          Draft
        </span>
      )}
      <div className="relative z-10 flex flex-col items-start gap-3">
        <h1 className="sr-only">{project.name}</h1>
        {svgCode ? (
          <div
            className="max-w-full lg:max-w-[60ch]"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: svgCode }}
          />
        ) : (
          <div className="mb-0 text-6xl leading-none">{project.name}</div>
        )}
        {projectUrl && (
          <a
            href={projectUrl}
            title={cleanName}
            target="_blank"
            rel="noopener"
            className={`group inline-flex rounded px-4 no-underline ring-1 ring-current/50 hover:opacity-70 ${hasSiteMini ? "md:hidden" : ""}`}
          >
            <span className="flex h-[2.1rem] flex-row items-center justify-normal gap-1">
              {project.archived ? "Archived: " : ""}
              {shortenUrl(projectUrl)}
              <LucideIcon
                icon={LUCIDE_ICONS.externalLink}
                size={16}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </span>
          </a>
        )}
      </div>
    </header>
  );
}
