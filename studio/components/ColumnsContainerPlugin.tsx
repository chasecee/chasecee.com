import { defineContainer } from "@portabletext/editor";
import { defineBehavior, raise } from "@portabletext/editor/behaviors";
import { BehaviorPlugin, NodePlugin } from "@portabletext/editor/plugins";
import type { PortableTextPluginsProps } from "sanity";

function emptyTextBlock(keyGenerator: () => string) {
  return {
    _key: keyGenerator(),
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: keyGenerator(), _type: "span", text: "", marks: [] }],
  };
}

function emptyColumn(keyGenerator: () => string) {
  return {
    _key: keyGenerator(),
    _type: "column",
    content: [emptyTextBlock(keyGenerator)],
  };
}

const columnNodes = [
  defineContainer({
    type: "columns",
    arrayField: "columns",
    render: ({ children, attributes, value }) => {
      const count = Array.isArray((value as { columns?: unknown[] } | undefined)?.columns)
        ? Math.max(1, (value as { columns: unknown[] }).columns.length)
        : 2;

      return (
        <div
          {...attributes}
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
          }}
        >
          {children}
        </div>
      );
    },
    of: [
      defineContainer({
        type: "column",
        arrayField: "content",
        render: ({ children, attributes }) => (
          <div
            {...attributes}
            style={{
              border: "1px dashed var(--card-border-color)",
              borderRadius: 3,
              padding: "8px 10px",
              minHeight: 64,
            }}
          >
            {children}
          </div>
        ),
      }),
    ],
  }),
];

const columnScaffoldBehaviors = [
  defineBehavior({
    on: "insert.block",
    guard: ({ event }) => {
      if (event.block._type !== "columns") return false;
      const columns = "columns" in event.block ? event.block.columns : undefined;
      return !(Array.isArray(columns) && columns.length > 0);
    },
    actions: [
      ({ event, snapshot }) => [
        raise({
          ...event,
          block: {
            ...event.block,
            columns: [
              emptyColumn(snapshot.context.keyGenerator),
              emptyColumn(snapshot.context.keyGenerator),
            ],
          },
        }),
      ],
    ],
  }),
];

export function ColumnsPlugins(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <NodePlugin nodes={columnNodes} />
      <BehaviorPlugin behaviors={columnScaffoldBehaviors} />
    </>
  );
}
