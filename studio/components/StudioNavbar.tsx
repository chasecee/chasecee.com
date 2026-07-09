import { Button } from "@sanity/ui";
import { useEditState, getPublishedId, type NavbarProps } from "sanity";
import { useRouterState } from "sanity/router";
import type { RouterPanes } from "sanity/structure";
import {
  getSiteBaseUrl,
  resolveDocumentUrl,
} from "../lib/resolveProductionUrl";

function getActiveDocument(panes: unknown): { id: string; type: string } | undefined {
  if (!Array.isArray(panes)) return;

  for (let i = panes.length - 1; i >= 0; i--) {
    const group = panes[i];
    if (!Array.isArray(group)) continue;

    for (let j = group.length - 1; j >= 0; j--) {
      const pane = group[j];
      const type = pane?.params?.type;
      if (pane?.id && type) {
        return { id: getPublishedId(pane.id), type };
      }
    }
  }
}

function SiteLink() {
  const panes = useRouterState((state) => state.panes) as RouterPanes | undefined;
  const active = getActiveDocument(panes);
  const { draft, published } = useEditState(
    active?.id || "noop",
    active?.type || "page",
    "low",
  );
  const document = active ? published || draft : null;
  const baseUrl = getSiteBaseUrl();
  const href = resolveDocumentUrl(baseUrl, undefined, {
    document: document ?? undefined,
    schemaType: active?.type || document?._type,
  });
  const text =
    href === baseUrl
      ? baseUrl.replace(/^https?:\/\//, "")
      : href.replace(/^https?:\/\//, "");

  return (
    <Button
      as="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      text={text}
      mode="bleed"
      tone="primary"
      fontSize={1}
      padding={2}
    />
  );
}

export function StudioNavbar(props: NavbarProps) {
  return props.renderDefault({
    ...props,
    __internal_actions: [
      ...(props.__internal_actions ?? []),
      {
        location: "topbar",
        name: "site-link",
        render: () => <SiteLink />,
      },
    ],
  });
}
