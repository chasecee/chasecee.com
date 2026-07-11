import type { CSSProperties } from "react";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { PortableTextComponents } from "@portabletext/react";
import { stegaClean } from "@sanity/client/stega";

type Column = {
  _key: string;
  content?: PortableTextBlock[];
};

type ColumnsProps = {
  columns?: Column[];
  valign?: string;
  components: PortableTextComponents;
  dataSanity?: string;
};

export default function Columns({
  columns,
  valign,
  components,
  dataSanity,
}: ColumnsProps) {
  if (!columns?.length) return null;
  const alignItems =
    { top: "start", center: "center", bottom: "end" }[stegaClean(valign ?? "")] ??
    "start";

  return (
    <div
      className="prose-wide grid gap-8 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
      style={{ "--cols": columns.length, alignItems } as CSSProperties}
      data-sanity={dataSanity}
    >
      {columns.map((column) => (
        <div key={column._key}>
          <PortableText value={column.content ?? []} components={components} />
        </div>
      ))}
    </div>
  );
}
