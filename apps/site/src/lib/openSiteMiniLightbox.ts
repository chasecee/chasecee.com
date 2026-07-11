function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const MARGIN = 16;

function slideSize() {
  return {
    width: Math.max(1, window.innerWidth - MARGIN * 2),
    height: Math.max(1, window.innerHeight - MARGIN * 2),
  };
}

let active: { destroy: () => void } | null = null;

export async function openSiteMiniLightbox(opts: {
  src: string;
  title: string;
}) {
  const src = opts.src.trim();
  if (!src) return;

  active?.destroy();
  active = null;

  const { default: PhotoSwipeLightbox } = await import("photoswipe/lightbox");

  const title = opts.title.trim() || "Site preview";
  const size = slideSize();
  const lightbox = new PhotoSwipeLightbox({
    dataSource: [
      {
        html: `<div class="pswp__site-mini"><iframe src="${escapeAttr(src)}" title="${escapeAttr(title)}" loading="lazy"></iframe></div>`,
        width: size.width,
        height: size.height,
      },
    ],
    pswpModule: () => import("photoswipe"),
    showHideAnimationType: "fade",
    bgOpacity: 1,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const onResize = () => {
    const pswp = lightbox.pswp;
    const slide = pswp?.currSlide;
    if (!pswp || !slide) return;
    const next = slideSize();
    slide.width = next.width;
    slide.height = next.height;
    slide.content.width = next.width;
    slide.content.height = next.height;
    pswp.updateSize(true);
  };

  const destroy = () => {
    window.removeEventListener("resize", onResize);
    lightbox.destroy();
    if (active === api) active = null;
  };

  const api = { destroy };
  active = api;

  lightbox.on("destroy", () => {
    window.removeEventListener("resize", onResize);
    if (active === api) active = null;
  });
  lightbox.on("openingAnimationEnd", () => {
    window.addEventListener("resize", onResize);
  });

  lightbox.init();
  lightbox.loadAndOpen(0);
}
