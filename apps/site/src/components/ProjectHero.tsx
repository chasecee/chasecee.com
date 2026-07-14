import { stegaClean } from "@sanity/client/stega";
import urlFor from "@/sanity/sanity.image";
import { sanitizeProjectSvg } from "@/src/utils/sanitizeProjectSvg";
import LucideIcon from "@/src/components/icons/LucideIcon";
import { LUCIDE_ICONS } from "@/src/components/icons/lucide";

type ProjectHeroData = {
  name?: string | null;
  subtitle?: string | null;
  url?: string | null;
  archived?: boolean | null;
  image?: string | null;
  svgcode?: {
    code?: string | null;
  } | null;
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

function svgMaskDataUrl(svg: string): string {
  const maskSvg = svg
    .replace(/\sfilter="[^"]*"/g, "")
    .replace(/fill="(?!none)[^"]*"/g, 'fill="#fff"');
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(maskSvg)}")`;
}

export default function ProjectHero({
  project,
  showDraftBadge = false,
  hasSiteMini = false,
  className = "",
}: ProjectHeroProps) {
  const cleanName = stegaClean(project.name ?? "");
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
  const clippedLogo = Boolean(svgCode && imageUrl);
  const maskImage = clippedLogo ? svgMaskDataUrl(svgCode) : "";
  const imageFill = {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "top left",
  };

  return (
    <header
      className={
        hasLogo
          ? `measure not-prose relative flex flex-col ${showDraftBadge ? "ring-2 ring-amber-300 ring-inset" : ""} ${className}`
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
      <div className="relative z-10 flex flex-col items-start gap-6">
        <h1 className="sr-only">{cleanName}</h1>
        {clippedLogo ? (
          <div className="relative w-full">
            <div
              className="pointer-events-none select-none opacity-0 [&_svg]:h-auto [&_svg]:w-full"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: svgCode }}
            />
            <div
              className="absolute inset-0 opacity-0"
              aria-hidden="true"
              style={imageFill}
            />
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                ...imageFill,
                WebkitMaskImage: maskImage,
                maskImage,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                maskMode: "alpha",
              }}
            />
          </div>
        ) : svgCode ? (
          <div
            className="max-w-full"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: svgCode }}
          />
        ) : (
          <div className="mb-0 text-6xl leading-none">{cleanName}</div>
        )}
        {projectUrl && (
          <a
            href={projectUrl}
            title={cleanName}
            target="_blank"
            rel="noopener"
            className={`group ${hasSiteMini ? "md:hidden" : ""}`}
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
