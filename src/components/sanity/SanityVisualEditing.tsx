import { useEffect, useMemo, useRef } from "react";
import {
  VisualEditing,
  type HistoryAdapter,
  type HistoryRefresh,
  type HistoryUpdate,
} from "@sanity/visual-editing/react";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import type { ClientPerspective } from "@sanity/client";
import { Idiomorph } from "idiomorph";
import { FieldLabelPlugin } from "./FieldLabelPlugin";

const PREVIEW_ROOT_ID = "sanity-preview-root";
const overlayPlugins = [FieldLabelPlugin()];

function serializePerspective(perspective: ClientPerspective): string {
  return typeof perspective === "string"
    ? perspective
    : JSON.stringify(perspective);
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setPerspectiveCookie(perspective: ClientPerspective): boolean {
  const next = serializePerspective(perspective);
  const current = getCookie(perspectiveCookieName);
  if (current === next) return false;
  const secure = window.location.protocol === "https:";
  const sameSite = secure ? "None" : "Lax";
  document.cookie = `${perspectiveCookieName}=${encodeURIComponent(next)}; path=/; SameSite=${sameSite}${secure ? "; Secure" : ""}`;
  return true;
}

function currentUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function applyHistoryUpdate(
  update: Pick<HistoryUpdate, "type" | "url">,
  currentHref: string,
) {
  switch (update.type) {
    case "push":
      if (currentHref !== update.url) window.location.assign(update.url!);
      return;
    case "replace":
      if (currentHref !== update.url) window.location.replace(update.url!);
      return;
    case "pop":
      window.history.back();
      return;
  }
}

function hardReload(): Promise<void> {
  return new Promise(() => {
    window.location.reload();
  });
}

async function morphPreviewRoot(): Promise<void> {
  const root = document.getElementById(PREVIEW_ROOT_ID);
  if (!root) {
    window.location.reload();
    return;
  }

  const response = await fetch(window.location.href, {
    headers: { Accept: "text/html" },
    credentials: "same-origin",
  });
  if (!response.ok) {
    window.location.reload();
    return;
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const next = doc.getElementById(PREVIEW_ROOT_ID);
  if (!next) {
    window.location.reload();
    return;
  }

  if (doc.title) document.title = doc.title;

  Idiomorph.morph(root, next, {
    morphStyle: "outerHTML",
    callbacks: {
      beforeNodeMorphed(oldNode: Node, newNode: Node) {
        if (
          oldNode instanceof HTMLElement &&
          oldNode.localName === "astro-island" &&
          newNode instanceof HTMLElement
        ) {
          oldNode.replaceWith(newNode.cloneNode(true));
          return false;
        }
      },
    },
  });
}

export default function SanityVisualEditing() {
  type Navigate = Parameters<HistoryAdapter["subscribe"]>[0];
  const navigateRef = useRef<Navigate | undefined>(undefined);
  const lastUrlRef = useRef("");
  const lastRevRef = useRef<string | undefined>(undefined);
  const morphQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const sync = () => {
      const url = currentUrl();
      if (url !== lastUrlRef.current) {
        lastUrlRef.current = url;
        navigateRef.current?.({ type: "push", title: document.title, url });
      }
    };

    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      origPush.apply(window.history, args);
      sync();
    };
    window.history.replaceState = function (...args) {
      origReplace.apply(window.history, args);
      sync();
    };

    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  const history = useMemo<HistoryAdapter>(
    () => ({
      subscribe: (navigate) => {
        navigateRef.current = navigate;
        const url = currentUrl();
        lastUrlRef.current = url;
        navigate({ type: "push", title: document.title, url });
        return () => {
          if (navigateRef.current === navigate) {
            navigateRef.current = undefined;
          }
        };
      },
      update: (update) => {
        applyHistoryUpdate(update, window.location.href);
      },
    }),
    [],
  );

  const refresh = (payload: HistoryRefresh): false | Promise<void> => {
    if (payload.source === "manual") {
      return hardReload();
    }

    if (payload.source === "mutation") {
      if (payload.livePreviewEnabled) return false;
      if (payload.document._rev === lastRevRef.current) {
        return Promise.resolve();
      }
      lastRevRef.current = payload.document._rev;
      morphQueueRef.current = morphQueueRef.current
        .catch(() => undefined)
        .then(morphPreviewRoot);
      return morphQueueRef.current;
    }

    return false;
  };

  return (
    <VisualEditing
      history={history}
      portal
      plugins={overlayPlugins}
      onPerspectiveChange={(perspective) => {
        if (setPerspectiveCookie(perspective)) {
          window.location.reload();
        }
      }}
      refresh={refresh}
    />
  );
}
