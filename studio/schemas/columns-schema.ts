import { contentBlocks } from "./blocks";
import { ColumnsObjectInput } from "../plugins/columns";

const column = {
  name: "column",
  type: "object",
  title: "Column",
  fields: [
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }, { type: "columns" }, ...contentBlocks],
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
  components: {
    input: ColumnsObjectInput,
  },
  initialValue: {
    valign: "top",
    columns: [
      {
        _type: "column",
        content: [
          {
            _type: "block",
            style: "normal",
            markDefs: [],
            children: [{ _type: "span", text: "", marks: [] }],
          },
        ],
      },
      {
        _type: "column",
        content: [
          {
            _type: "block",
            style: "normal",
            markDefs: [],
            children: [{ _type: "span", text: "", marks: [] }],
          },
        ],
      },
    ],
  },
  fields: [
    {
      name: "columns",
      title: "Columns",
      type: "array",
      of: [column],
      validation: (Rule: any) => Rule.min(2).max(4),
    },
    {
      name: "valign",
      title: "Vertical alignment",
      type: "string",
      initialValue: "top",
      options: {
        list: [
          { title: "Top", value: "top" },
          { title: "Center", value: "center" },
          { title: "Bottom", value: "bottom" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    },
  ],
  preview: {
    select: { columns: "columns", valign: "valign" },
    prepare({ columns, valign }: { columns?: unknown[]; valign?: string }) {
      const count = columns?.length ?? 0;
      return {
        title: `Columns (${count})`,
        subtitle: valign && valign !== "top" ? `Align: ${valign}` : undefined,
      };
    },
  },
};

export default columns;
