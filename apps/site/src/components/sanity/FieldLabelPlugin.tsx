import { useLayoutEffect, useRef } from "react";
import { defineOverlayPlugin } from "@sanity/visual-editing/unstable_overlay-components";
import type { OverlayElementField } from "@sanity/visual-editing/react";

function fieldLabel(field: OverlayElementField): string | undefined {
  if (!field) return undefined;
  if ("title" in field && field.title) return field.title;
  if ("name" in field && field.name) return field.name;
  return undefined;
}

function pathLabel(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const segment = path.split(".").pop();
  if (!segment) return undefined;
  return segment.replace(/\[\d+\]$/, "");
}

function findLabelsPill(hud: HTMLElement): HTMLElement | undefined {
  const tab = hud.previousElementSibling;
  if (!(tab instanceof HTMLElement)) return undefined;
  return Array.from(tab.querySelectorAll<HTMLElement>('[data-ui="Flex"]')).find(
    (el) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)",
  );
}

export const FieldLabelPlugin = defineOverlayPlugin(() => ({
  type: "hud",
  name: "field-label",
  title: "Field",
  component: function FieldLabel({ field, node }) {
    const markerRef = useRef<HTMLSpanElement>(null);
    const label =
      fieldLabel(field) ||
      ("path" in node ? pathLabel(node.path) : undefined);

    useLayoutEffect(() => {
      const marker = markerRef.current;
      const hud = marker?.parentElement;
      if (!marker || !hud || !label) return;

      const labels = findLabelsPill(hud);
      if (!labels) return;

      let sep = labels.querySelector<HTMLElement>("[data-field-label-sep]");
      let text = labels.querySelector<HTMLElement>("[data-field-label]");

      if (!sep) {
        sep = document.createElement("span");
        sep.setAttribute("data-field-label-sep", "");
        sep.setAttribute("data-ui", "Text");
        sep.textContent = "/";
        sep.style.opacity = "0.7";
        labels.append(sep);
      }

      if (!text) {
        text = document.createElement("span");
        text.setAttribute("data-field-label", "");
        text.setAttribute("data-ui", "Text");
        labels.append(text);
      }

      text.textContent = label;

      return () => {
        sep?.remove();
        text?.remove();
      };
    }, [label]);

    return <span ref={markerRef} hidden />;
  },
}));
