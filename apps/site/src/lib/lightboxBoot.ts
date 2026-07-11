import { bindSiteMiniLightbox } from "./bindSiteMiniLightbox";

bindSiteMiniLightbox();

type GalleryModule = typeof import("./imageGalleryLightbox");
let galleryMod: GalleryModule | null = null;

async function startGallery() {
  if (!document.querySelector("[data-pswp-gallery]")) return;
  galleryMod = await import("./imageGalleryLightbox");
  galleryMod.initImageGalleryLightbox();
}

function destroyGallery() {
  galleryMod?.destroyImageGalleryLightbox();
}

document.addEventListener("astro:before-preparation", destroyGallery);
document.addEventListener("gallery:mount", () => {
  void startGallery();
});
document.addEventListener("astro:page-load", () => {
  void startGallery();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void startGallery();
  });
} else {
  void startGallery();
}
