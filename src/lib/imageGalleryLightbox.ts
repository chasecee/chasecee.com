import PhotoSwipeLightbox from "photoswipe/lightbox";

let lightbox: PhotoSwipeLightbox | null = null;

const ARROW_SVG =
  '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 24 24" width="24" height="24"><path d="M15.5 3.5 7 12l8.5 8.5 1.4-1.4L9.8 12l7.1-7.1z"/></svg>';

export const destroyImageGalleryLightbox = () => {
  lightbox?.destroy();
  lightbox = null;
};

const captionFromSlide = (element: Element | undefined) => {
  if (!(element instanceof HTMLElement)) return "";
  return element.dataset.caption?.trim() || "";
};

export const initImageGalleryLightbox = () => {
  destroyImageGalleryLightbox();
  if (!document.querySelector("[data-pswp-gallery]")) return;

  lightbox = new PhotoSwipeLightbox({
    gallery: "body",
    children: "[data-pswp-gallery] a",
    showHideAnimationType: "zoom",
    pswpModule: () => import("photoswipe"),
    paddingFn: (viewportSize) => {
      const inline = viewportSize.x < 768 ? 16 : 48;
      return { top: 48, bottom: 48, left: inline, right: inline };
    },
    initialZoomLevel: "fit",
    secondaryZoomLevel: 1.5,
    maxZoomLevel: 3,
    bgOpacity: 1,
    arrowPrevSVG: ARROW_SVG,
    arrowNextSVG: ARROW_SVG,
    loop: false,
    preload: [1, 2],
  });

  lightbox.on("afterInit", () => {
    const pswp = lightbox?.pswp;
    if (!pswp?.element) return;

    let caption = pswp.element.querySelector<HTMLElement>(".pswp__custom-caption");
    if (!caption) {
      caption = document.createElement("div");
      caption.className = "pswp__custom-caption";
      pswp.element.appendChild(caption);
    }

    const update = () => {
      if (!caption) return;
      const text = captionFromSlide(pswp.currSlide?.data?.element);
      caption.textContent = text;
      caption.hidden = !text;
    };

    update();
    pswp.on("change", update);
  });

  lightbox.init();
};
