import { useIsPresentationTool } from "@sanity/visual-editing/react";

export default function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool !== false) return null;

  return (
    <a
      href="/api/draft-mode/disable"
      className="ml-3 underline underline-offset-2 hover:no-underline"
    >
      Exit draft mode
    </a>
  );
}
