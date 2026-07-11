let bound = false;

export function bindSiteMiniLightbox() {
  if (bound || typeof document === "undefined") return;
  bound = true;

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest("[data-site-mini-open]");
    if (!(trigger instanceof HTMLElement)) return;

    event.preventDefault();
    const src = trigger.dataset.src?.trim();
    if (!src) return;

    void import("./openSiteMiniLightbox").then(({ openSiteMiniLightbox }) =>
      openSiteMiniLightbox({
        src,
        title: trigger.dataset.title?.trim() || "Site preview",
      }),
    );
  });
}
