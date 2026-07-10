import { defineContainer, type ContainerRenderProps, useEditor } from "@portabletext/editor";
import { NodePlugin } from "@portabletext/editor/plugins";
import { DragHandleIcon } from "@sanity/icons/DragHandle";
import { Button, Card, Menu, MenuButton, MenuItem, Tooltip } from "@sanity/ui";
import type { PortableTextPluginsProps } from "sanity";

const MAX_NEST_DEPTH = 8;
const VALIGN_OPTIONS = ["top", "center", "bottom"] as const;
type Valign = (typeof VALIGN_OPTIONS)[number];

const VALIGN_TO_ALIGN_ITEMS: Record<Valign, string> = {
  top: "start",
  center: "center",
  bottom: "end",
};
const VALIGN_LABELS: Record<Valign, string> = {
  top: "Top",
  center: "Center",
  bottom: "Bottom",
};
const VALIGN_SYMBOLS: Record<Valign, string> = {
  top: "↑",
  center: "↕",
  bottom: "↓",
};
const COLUMN_COUNT_OPTIONS = [2, 3, 4] as const;

function createEmptyColumn(keyGenerator: () => string) {
  return {
    _key: keyGenerator(),
    _type: "column",
    content: [
      {
        _key: keyGenerator(),
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: keyGenerator(), _type: "span", text: "", marks: [] }],
      },
    ],
  };
}

function ColumnsFrame(props: ContainerRenderProps) {
  const { attributes, children, node, path, readOnly, focused, selected } = props;
  const editor = useEditor();

  const cols = node.columns;
  const count = Array.isArray(cols) ? Math.max(1, cols.length) : 2;
  const valign: Valign = VALIGN_OPTIONS.includes(node.valign as Valign)
    ? (node.valign as Valign)
    : "top";
  const colCount = Math.max(2, Math.min(4, Array.isArray(cols) ? cols.length : 2));
  const menuId = `columns-valign-${JSON.stringify(path).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const countMenuId = `columns-count-${JSON.stringify(path).replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const setValign = (next: Valign) => {
    if (readOnly || next === valign) return;
    editor.send({
      type: "set",
      at: [...path, "valign"],
      value: next,
    });
  };

  const setColumnCount = (targetCount: number) => {
    if (readOnly || targetCount === colCount) return;
    if (!COLUMN_COUNT_OPTIONS.includes(targetCount as (typeof COLUMN_COUNT_OPTIONS)[number])) {
      return;
    }
    const keyGenerator = editor.getSnapshot().context.keyGenerator;
    const current = Array.isArray(cols) ? [...cols] : [];
    const next = current.slice(0, targetCount);
    while (next.length < targetCount) next.push(createEmptyColumn(keyGenerator));
    editor.send({
      type: "set",
      at: [...path, "columns"],
      value: next,
    });
  };

  return (
    <div
      {...attributes}
      draggable={!readOnly}
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        alignItems: VALIGN_TO_ALIGN_ITEMS[valign],
        position: "relative",
        paddingLeft: 32,
      }}
    >
      <div
        contentEditable={false}
        style={{
          position: "absolute",
          left: 1,
          top: 1,
          pointerEvents: readOnly ? "none" : "auto",
          opacity: focused || selected ? 1 : 0.75,
          width: 32,
          maxWidth: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 4,
          zIndex: 2,
        }}
      >
        <Tooltip
          content="Drag to re-order"
          delay={{ open: 600 }}
          placement="top"
          fallbackPlacements={["bottom", "right"]}
          portal
        >
          <Card
            aria-label="Drag columns block"
            border
            contentEditable={false}
            draggable={!readOnly}
            padding={0}
            radius={2}
            shadow={1}
            style={{
              cursor: readOnly ? "default" : "grab",
              lineHeight: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              maxWidth: 32,
              minHeight: 32,
            }}
            tone="default"
          >
            <DragHandleIcon />
          </Card>
        </Tooltip>
        <Tooltip
          content={`Vertical align: ${VALIGN_LABELS[valign]}`}
          delay={{ open: 600 }}
          placement="top"
          fallbackPlacements={["bottom", "right"]}
          portal
        >
          <MenuButton
            id={menuId}
            button={
              <Button
                aria-label={`Set vertical alignment (${VALIGN_LABELS[valign]})`}
                fontSize={1}
                mode="bleed"
                padding={0}
                style={{
                  width: 24,
                  minHeight: 24,
                  lineHeight: 1,
                  justifyContent: "center",
                }}
                text={VALIGN_SYMBOLS[valign]}
                tone="default"
              />
            }
            menu={
              <Menu>
                {VALIGN_OPTIONS.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => setValign(option)}
                    pressed={valign === option}
                    text={VALIGN_LABELS[option]}
                  />
                ))}
              </Menu>
            }
            popover={{
              placement: "right-start",
              fallbackPlacements: ["right-end", "bottom-start", "top-start"],
              portal: true,
            }}
          />
        </Tooltip>
        <Tooltip
          content="Set column count"
          delay={{ open: 600 }}
          placement="top"
          fallbackPlacements={["bottom", "right"]}
          portal
        >
          <MenuButton
            id={countMenuId}
            button={
              <Button
                aria-label={`Set column count (${colCount})`}
                fontSize={1}
                mode="bleed"
                padding={0}
                style={{
                  width: 24,
                  minHeight: 24,
                  lineHeight: 1,
                  justifyContent: "center",
                }}
                text={`${colCount}`}
                tone="default"
              />
            }
            menu={
              <Menu>
                {COLUMN_COUNT_OPTIONS.map((size) => (
                  <MenuItem
                    key={size}
                    onClick={() => setColumnCount(size)}
                    pressed={colCount === size}
                    text={`${size}`}
                  />
                ))}
              </Menu>
            }
            popover={{
              placement: "right-start",
              fallbackPlacements: ["right-end", "bottom-start", "top-start"],
              portal: true,
            }}
          />
        </Tooltip>
      </div>
      {children}
    </div>
  );
}

function ColumnFrame(props: ContainerRenderProps) {
  const { attributes, children } = props;
  return (
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
  );
}

function createColumnsNode(depth: number): ReturnType<typeof defineContainer> {
  return defineContainer({
    type: "columns",
    arrayField: "columns",
    render: (props) => <ColumnsFrame {...props} />,
    of: [createColumnNode(depth)],
  });
}

function createColumnNode(depth: number): ReturnType<typeof defineContainer> {
  return defineContainer({
    type: "column",
    arrayField: "content",
    render: (props) => <ColumnFrame {...props} />,
    of: depth < MAX_NEST_DEPTH ? [createColumnsNode(depth + 1)] : [],
  });
}

const columnNodes = [createColumnsNode(1)];

export function ColumnsPortableTextPlugin(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <NodePlugin nodes={columnNodes} />
    </>
  );
}
