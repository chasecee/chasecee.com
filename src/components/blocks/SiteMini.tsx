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
      className="not-prose relative flex w-full flex-col items-center gap-3"
      data-sanity={dataSanity}
    >
      <div className="site-mini rounded ring-1 ring-neutral-500/70">
        <iframe
          src={src}
          title={label}
          loading="lazy"
          className="site-mini-frame embed-frame-fixed"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-nowrap justify-center gap-2 p-4">
        <Button
          href={href}
          target="_blank"
          rel="noopener"
          className="group shrink-0 gap-x-2 px-4 py-2"
        >
          Visit Site
          <LucideIcon
            icon={LUCIDE_ICONS.externalLink}
            size={14}
            className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </Button>
        <Button
          className="group shrink-0 gap-x-2 px-4 py-2"
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
        </Button>
      </div>
    </div>
  );
}
