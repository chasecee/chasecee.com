import { useEffect } from "react";
import {
  getPublishedId,
  useEditState,
  type DocumentLayoutProps,
} from "sanity";
import { getActiveDocument, setActiveDocument } from "../lib/activeDocument";

export function DocumentLayout(props: DocumentLayoutProps) {
  const documentId = getPublishedId(props.documentId);
  const { draft, published } = useEditState(
    documentId,
    props.documentType,
    "low",
  );
  const document = published || draft;
  const slug = (document as { slug?: { current?: string } } | null)?.slug
    ?.current;

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

  return props.renderDefault(props);
}
