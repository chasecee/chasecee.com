export function contentHasBlock(
  blocks: unknown[] | undefined | null,
  types: string | readonly string[],
): boolean {
  if (!Array.isArray(blocks)) return false;
  const wanted = typeof types === "string" ? [types] : types;

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const type = (block as { _type?: unknown })._type;
    if (typeof type === "string" && wanted.includes(type)) return true;

    if (type === "columns") {
      const columns = (block as { columns?: { content?: unknown[] }[] }).columns;
      if (!Array.isArray(columns)) continue;
      for (const column of columns) {
        if (contentHasBlock(column?.content, wanted)) return true;
      }
    }
  }

  return false;
}
