import { useEffect, useRef, useState } from "react";
import Button from "../Button";
import LucideIcon from "../icons/LucideIcon";
import { LUCIDE_ICONS } from "../icons/lucide";
import { cleanMaybe, cleanResource } from "@chasecee/sanity-kit/astro";
import "../../styles/embeds.css";
import styles from "./site-mini.module.css";

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

async function loadSrcDoc(src: string) {
  const response = await fetch(src, { mode: "cors" });
  if (!response.ok) throw new Error("fetch failed");
  const html = await response.text();
  const base = new URL(src).href;
  if (/<base\s/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (open) => `${open}<base href="${base}">`);
  }
  return `<base href="${base}">${html}`;
}

export default function SiteMini({
  url,
  embedUrl,
  title,
  draftMode,
  dataSanity,
}: SiteMiniProps) {
  const href = cleanResource(url);
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const drag = useRef<{
    pointerId: number;
    startY: number;
    startScroll: number;
  } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [useSrc, setUseSrc] = useState(true);

  const src = href ? cleanResource(embedUrl) || href : "";
  const label = href
    ? cleanMaybe(title, draftMode) || hostnameLabel(href)
    : "Site preview";

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!src || !desktop) {
      setSrcDoc(null);
      setUseSrc(true);
      return;
    }
    let cancelled = false;
    setSrcDoc(null);
    setUseSrc(true);
    void loadSrcDoc(src)
      .then((html) => {
        if (cancelled) return;
        setSrcDoc(html);
        setUseSrc(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSrcDoc(null);
        setUseSrc(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src, desktop]);

  if (!href) return null;

  const dragEnabled = desktop && !useSrc && srcDoc !== null;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled || event.button !== 0) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScroll: win.scrollY,
    };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const shell = shellRef.current;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    setCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    const active = drag.current;
    const win = iframeRef.current?.contentWindow;
    if (!active || !win || active.pointerId !== event.pointerId) return;
    win.scrollTo({
      top: active.startScroll - (event.clientY - active.startY),
      behavior: "auto",
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  return (
    <div
      className="not-prose relative flex w-full flex-col items-center gap-3"
      data-sanity={dataSanity}
    >
      <div
        ref={shellRef}
        className={`${styles.root} rounded-xl ring-site ring-neutral-500/50 ${dragEnabled ? "" : styles.native}`}
      >
        <iframe
          ref={iframeRef}
          title={label}
          loading="lazy"
          className="site-mini-frame embed-frame-fixed"
          {...(useSrc ? { src } : { srcDoc: srcDoc ?? undefined })}
        />
        {dragEnabled && (
          <div
            className="absolute inset-0 z-[1] cursor-none touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={(event) => {
              event.preventDefault();
              iframeRef.current?.contentWindow?.scrollBy(0, event.deltaY);
            }}
            onPointerLeave={() => {
              if (!dragging) setCursor(null);
            }}
            onPointerEnter={(event) => {
              const shell = shellRef.current;
              if (!shell) return;
              const rect = shell.getBoundingClientRect();
              setCursor({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }}
          >
            {cursor && (
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/15 shadow-[0_0_0_1px_rgb(0_0_0_/_0.25)] backdrop-blur-[2px] transition-transform duration-150 ${dragging ? "scale-90 bg-white/25" : "scale-100"}`}
                style={{ left: cursor.x, top: cursor.y }}
              />
            )}
          </div>
        )}
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
