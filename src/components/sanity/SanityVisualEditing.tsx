import { VisualEditing } from "@sanity/visual-editing/react";

const history = {
  subscribe: (navigate: (update: { type: string; url: string }) => void) => {
    const onPop = () => navigate({ type: "pop", url: window.location.href });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  },
  update: (update: { type: string; url?: string }) => {
    if (update.type === "push" && update.url) {
      window.history.pushState(null, "", update.url);
    }
    if (update.type === "replace" && update.url) {
      window.history.replaceState(null, "", update.url);
    }
    if (update.type === "pop") {
      window.history.back();
    }
  },
};

export default function SanityVisualEditing() {
  return <VisualEditing portal history={history} />;
}
