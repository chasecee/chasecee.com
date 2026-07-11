import { useEffect, useMemo, useRef } from "react";
import {
  VisualEditing,
  type HistoryAdapter,
  type HistoryRefresh,
  type HistoryUpdate,
} from "@sanity/visual-editing/react";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import type { ClientPerspective } from "@sanity/client";
import { FieldLabelPlugin } from "./FieldLabelPlugin";

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
  if (getCookie(perspectiveCookieName) === next) return false;
  const secure = window.location.protocol === "https:";
  document.cookie = `${perspectiveCookieName}=${encodeURIComponent(next)}; path=/; SameSite=${secure ? "None" : "Lax"}${secure ? "; Secure" : ""}`;
  return true;
}

function href() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function applyHistoryUpdate(update: Pick<HistoryUpdate, "type" | "url">) {
  if (update.type === "pop") {
    window.history.back();
    return;
  }
  if (!update.url || update.url === window.location.href) return;
  if (update.type === "push") window.location.assign(update.url);
  else window.location.replace(update.url);
}

function handleRefresh(payload: HistoryRefresh): false | Promise<void> {
  if (payload.source === "mutation") return false;
  window.location.reload();
  return new Promise(() => {});
}

export default function SanityVisualEditing() {
  type Navigate = Parameters<HistoryAdapter["subscribe"]>[0];
  const navigateRef = useRef<Navigate | undefined>(undefined);
  const lastUrlRef = useRef("");

  useEffect(() => {
    const sync = () => {
      const url = href();
      if (url === lastUrlRef.current) return;
      lastUrlRef.current = url;
      navigateRef.current?.({ type: "push", title: document.title, url });
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
        lastUrlRef.current = href();
        navigate({ type: "push", title: document.title, url: lastUrlRef.current });
        return () => {
          if (navigateRef.current === navigate) navigateRef.current = undefined;
        };
      },
      update: applyHistoryUpdate,
    }),
    [],
  );

  return (
    <VisualEditing
      history={history}
      portal
      plugins={overlayPlugins}
      onPerspectiveChange={(perspective) => {
        if (setPerspectiveCookie(perspective)) window.location.reload();
      }}
      refresh={handleRefresh}
    />
  );
}
