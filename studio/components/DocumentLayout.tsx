import { useEffect } from "react";
import {
  getPublishedId,
  useEditState,
  type DocumentLayoutProps,
} from "sanity";
import { getActiveDocument, setActiveDocument } from "../lib/activeDocument";

const accordionFieldsets = ["content", "meta"] as const;

const accordionStyles = accordionFieldsets
  .map(
    (name) => `
      [data-doc-accordion] [data-testid="fieldset-${name}"] legend {
        display: block;
        width: 100%;
      }
      [data-doc-accordion] [data-testid="fieldset-${name}"] legend button {
        width: 100%;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--card-border-color);
        border-radius: 0.1875rem;
        background: var(--card-bg-color);
      }
      [data-doc-accordion] [data-testid="fieldset-${name}"] legend button:hover {
        background: var(--card-muted-bg-color);
      }
      [data-doc-accordion] [data-testid="fieldset-${name}"] legend button [data-ui="Text"] {
        font-size: 1rem;
      }
      [data-doc-accordion] [data-testid="fieldset-${name}"] legend button > div:first-child {
        width: auto;
        height: auto;
        margin-right: 0;
      }
    `,
  )
  .join("\n");

export function DocumentLayout(props: DocumentLayoutProps) {
  const isProject = props.documentType === "project";
  const documentId = getPublishedId(props.documentId);
  const { draft, published } = useEditState(
    documentId,
    props.documentType,
    "low",
  );
  const currentDocument = published || draft;
  const slug = (currentDocument as { slug?: { current?: string } } | null)
    ?.slug?.current;

  useEffect(() => {
    setActiveDocument({
      id: documentId,
      type: props.documentType,
      slug,
    });

    return () => {
      if (getActiveDocument()?.id === documentId) {
        setActiveDocument(null);
      }
    };
  }, [documentId, props.documentType, slug]);

  if (!isProject) return props.renderDefault(props);

  return (
    <div data-doc-accordion="" style={{ display: "contents" }}>
      <style>{accordionStyles}</style>
      {props.renderDefault(props)}
    </div>
  );
}
