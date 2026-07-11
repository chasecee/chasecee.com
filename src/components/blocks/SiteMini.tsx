import Button from "../Button";
import LucideIcon from "../icons/LucideIcon";
import { LUCIDE_ICONS } from "../icons/lucide";
import { cleanMaybe } from "./utils";

type SiteMiniProps = {
  url?: string;
  embedUrl?: string;
  title?: string;
  draftMode: boolean;
  dataSanity?: string;
};

const actionClass =
  "not-prose group inline-flex cursor-pointer items-center justify-center gap-x-2 rounded-[.25rem] border-0 px-6 py-3 text-base text-black no-underline shadow-xs transition-colors ring-[.125rem] ring-black/30 bg-black/5 dark:bg-white/5 dark:text-white dark:ring-white/30";

function hostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Site preview";
  }
}

export default function SiteMini({
  url,
  embedUrl,
  title,
  draftMode,
  dataSanity,
}: SiteMiniProps) {
  const href = cleanMaybe(url, draftMode);
  if (!href) return null;

  const src = cleanMaybe(embedUrl, draftMode) || href;
  const label = cleanMaybe(title, draftMode) || hostnameLabel(href);

  return (
    <div
      className="not-prose flex w-full flex-col items-center gap-3"
      data-sanity={dataSanity}
    >
      <div className="site-mini">
        <iframe
          src={src}
          title={label}
          loading="lazy"
          className="site-mini-frame embed-frame-fixed"
        />
      </div>
      <div className="flex flex-nowrap justify-center gap-2">
        <Button href={href} target="_blank" rel="noopener" className="group shrink-0 gap-x-2 px-4 py-2 text-sm">
          Visit Site
          <LucideIcon
            icon={LUCIDE_ICONS.externalLink}
            size={14}
            className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </Button>
        <button
          type="button"
          className={`${actionClass} shrink-0 px-4 py-2 text-sm`}
          data-site-mini-open
          data-src={src}
          data-title={label}
        >
          Expand
          <LucideIcon
            icon={LUCIDE_ICONS.maximize2}
            size={14}
            className="transition-transform group-hover:scale-110"
          />
        </button>
      </div>
    </div>
  );
}
