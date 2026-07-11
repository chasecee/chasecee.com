let loaderPromise: Promise<void> | null = null;

export function loadDotLottiePlayer() {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("dotlottie-player")) return Promise.resolve();

  if (!loaderPromise) {
    loaderPromise = import("@aarsteinmedia/dotlottie-player/light").then(
      ({ default: DotLottiePlayer, tagName }) => {
        if (!customElements.get(tagName)) {
          customElements.define(tagName, DotLottiePlayer);
        }
      },
    );
  }

  return loaderPromise;
}
