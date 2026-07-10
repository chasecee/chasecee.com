import type { DocumentActionComponent } from "sanity";

export function withPublishShortcut(
  Action: DocumentActionComponent,
): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props) => {
    const next = Action(props);
    if (!next) return next;
    return {
      ...next,
      shortcut: "mod+s",
    };
  };
  Wrapped.action = Action.action;
  Wrapped.displayName = `withPublishShortcut(${Action.displayName || Action.name || "Action"})`;
  return Wrapped;
}
