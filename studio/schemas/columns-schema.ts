import { contentBlocks } from "./blocks";

const column = {
  name: "column",
  type: "object",
  title: "Column",
  fields: [
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }, ...contentBlocks],
    },
  ],
  preview: {
    select: { blocks: "content" },
    prepare({ blocks }: { blocks?: Array<Record<string, unknown>> }) {
      const firstText = (blocks || [])
        .flatMap((b) => (Array.isArray(b.children) ? b.children : []))
        .map((c: Record<string, unknown>) => c.text)
        .find((t) => typeof t === "string" && t.trim());
      return { title: (firstText as string) || "Empty column" };
    },
  },
};

const columns = {
  name: "columns",
  type: "object",
  title: "Columns",
  fields: [
    {
      name: "columns",
      title: "Columns",
      type: "array",
      of: [column],
      validation: (Rule: any) => Rule.min(2).max(4),
    },
  ],
  preview: {
    select: { columns: "columns" },
    prepare({ columns }: { columns?: unknown[] }) {
      const count = columns?.length ?? 0;
      return { title: `Columns (${count})` };
    },
  },
};

export default columns;
