import { useEffect } from "react";
import {
  getPublishedId,
  useEditState,
  type DocumentLayoutProps,
} from "sanity";
import { getActiveDocument, setActiveDocument } from "../../lib/activeDocument";

const accordionFieldsets = ["content", "meta"] as const;

const chevronMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 25 25' fill='none'%3E%3Cpath d='M10 8L14.5 12.5L10 17' stroke='black' stroke-width='1.2' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const scrollerStyles = `
  [data-testid="document-panel-scroller"] {
    scrollbar-gutter: stable;
  }
  [data-doc-accordion] [data-ui="Stack"]:has(> fieldset[data-testid="fieldset-content"]),
  [data-doc-accordion] [data-ui="Stack"]:has(> div > fieldset[data-testid="fieldset-content"]) {
    gap: 2rem;
  }
  [data-doc-accordion] [data-testid="document-panel-scroller"] [data-ui="Container"] {
    max-width: none;
  }
  [data-doc-accordion] [data-testid="pt-editor"] {
    max-width: none;
  }
`;

const accordionStyles = accordionFieldsets
  .map((name) => {
    const root = `[data-doc-accordion] fieldset[data-testid="fieldset-${name}"]`;
    return `
      ${root} {
        border: 1px solid var(--card-border-color);
        border-radius: 0.1875rem;
        background: var(--card-bg-color);
        grid-gap: 0;
      }
      ${root} [data-ui="fieldHeaderContentBox"]:has(legend) {
        flex: 1;
        min-width: 0;
        max-width: none;
        padding:0.5rem;
        cursor: pointer;
      }
      ${root} legend {
        display: block;
        width: 100%;
      }
      ${root} legend button {
        width: 100%;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.1875rem 0.1875rem 0 0;
      }
      ${root} legend button:hover {
        background: var(--card-muted-bg-color);
      }
      ${root} legend button [data-ui="Text"] {
        font-size: 1rem;
      }
      ${root} legend button > div:first-child {
        width: auto;
        height: auto;
        margin-right: 0;
      }
      ${root} legend button > div:first-child svg {
        display: none;
      }
      ${root} legend button > div:first-child [data-ui="Text"] span::before {
        content: "";
        display: block;
        width: 1.25em;
        height: 1.25em;
        background-color: currentColor;
        mask: ${chevronMask} center / contain no-repeat;
        -webkit-mask: ${chevronMask} center / contain no-repeat;
        transition: transform 100ms ease-in-out;
      }
      ${root}:not(:has(> div[hidden])) legend button > div:first-child [data-ui="Text"] span::before {
        transform: rotate(90deg);
      }
      ${root} > div:last-child:not([hidden]) {
        padding: 0.25rem 1rem 1rem;
      }
    `;
  })
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
      <style>{scrollerStyles + accordionStyles}</style>
      {props.renderDefault(props)}
    </div>
  );
}
