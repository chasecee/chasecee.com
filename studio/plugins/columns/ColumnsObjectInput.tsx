import { Button, Flex, Menu, MenuButton, MenuItem, Stack } from "@sanity/ui";
import { set, type ObjectInputProps } from "sanity";

const VALIGN_OPTIONS = ["top", "center", "bottom"] as const;
type Valign = (typeof VALIGN_OPTIONS)[number];

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

type ColumnValue = {
  _key?: string;
  _type: "column";
  content?: unknown[];
};

type ColumnsValue = {
  columns?: ColumnValue[];
  valign?: string;
};

function createKey() {
  return `k${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyColumn(): ColumnValue {
  return {
    _key: createKey(),
    _type: "column",
    content: [
      {
        _key: createKey(),
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: createKey(), _type: "span", text: " ", marks: [] }],
      },
    ],
  };
}

function ensureColumnCount(columns: ColumnValue[] | undefined, minCount = 2): ColumnValue[] {
  const next = Array.isArray(columns) ? [...columns] : [];
  while (next.length < minCount) next.push(createEmptyColumn());
  return next;
}

export function ColumnsObjectInput(props: ObjectInputProps) {
  const value = (props.value as ColumnsValue | undefined) ?? {};
  const readOnly = Boolean(props.readOnly);
  const columns = ensureColumnCount(value.columns);
  const colCount = Math.max(2, Math.min(4, columns.length));
  const valign: Valign = VALIGN_OPTIONS.includes(value.valign as Valign)
    ? (value.valign as Valign)
    : "top";
  const baseId = props.id ? String(props.id) : "columns-input";

  const apply = (next: Partial<ColumnsValue>) => {
    props.onChange(
      set({
        ...value,
        ...next,
        columns: next.columns ?? columns,
        valign: (next.valign ?? valign) as string,
      }),
    );
  };

  const setValign = (next: Valign) => {
    if (readOnly || next === valign) return;
    apply({ valign: next });
  };

  const setColumnCount = (targetCount: number) => {
    if (readOnly || targetCount === colCount) return;
    if (!COLUMN_COUNT_OPTIONS.includes(targetCount as (typeof COLUMN_COUNT_OPTIONS)[number])) {
      return;
    }
    const next = columns.slice(0, targetCount);
    while (next.length < targetCount) next.push(createEmptyColumn());
    apply({ columns: next });
  };

  return (
    <Stack space={3}>
      <Flex gap={2}>
        <MenuButton
          id={`${baseId}-valign`}
          button={
            <Button
              aria-label={`Set vertical alignment (${VALIGN_LABELS[valign]})`}
              fontSize={1}
              mode="bleed"
              padding={2}
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
            placement: "bottom-start",
            fallbackPlacements: ["bottom-end", "top-start"],
            portal: true,
          }}
        />
        <MenuButton
          id={`${baseId}-count`}
          button={
            <Button
              aria-label={`Set column count (${colCount})`}
              fontSize={1}
              mode="bleed"
              padding={2}
              text={`${colCount}`}
              tone="default"
            />
          }
          menu={
            <Menu>
              {COLUMN_COUNT_OPTIONS.map((count) => (
                <MenuItem
                  key={count}
                  onClick={() => setColumnCount(count)}
                  pressed={colCount === count}
                  text={`${count}`}
                />
              ))}
            </Menu>
          }
          popover={{
            placement: "bottom-start",
            fallbackPlacements: ["bottom-end", "top-start"],
            portal: true,
          }}
        />
      </Flex>
      {props.renderDefault(props)}
    </Stack>
  );
}
