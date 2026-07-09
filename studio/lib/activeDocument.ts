type ActiveDocument = {
  id: string;
  type: string;
  slug?: string;
};

let activeDocument: ActiveDocument | null = null;
const listeners = new Set<() => void>();

export function setActiveDocument(next: ActiveDocument | null) {
  const same =
    activeDocument?.id === next?.id &&
    activeDocument?.type === next?.type &&
    activeDocument?.slug === next?.slug;
  if (same) return;

  activeDocument = next;
  for (const listener of listeners) listener();
}

export function getActiveDocument() {
  return activeDocument;
}

export function subscribeActiveDocument(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
