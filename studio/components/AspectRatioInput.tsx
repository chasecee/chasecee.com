import { Stack, Text, TextInput, Grid } from "@sanity/ui";
import { set, unset, type ObjectInputProps } from "sanity";

type AspectValue = {
  desktop?: string;
  mobile?: string;
};

export default function AspectRatioInput(props: ObjectInputProps) {
  const value = (props.value as AspectValue | undefined) ?? {};
  const readOnly = Boolean(props.readOnly);

  const patch = (key: keyof AspectValue, next: string) => {
    const trimmed = next.trim();
    if (!trimmed) {
      const rest = { ...value };
      delete rest[key];
      props.onChange(Object.keys(rest).length ? set(rest) : unset());
      return;
    }
    props.onChange(set({ ...value, [key]: trimmed }));
  };

  return (
    <Stack space={3}>
      <Grid columns={[1, 2]} gap={3}>
        <Stack space={2}>
          <Text size={1} weight="medium">
            Desktop
          </Text>
          <TextInput
            fontSize={1}
            value={value.desktop ?? "1/1"}
            readOnly={readOnly}
            placeholder="1/1"
            onChange={(e) => patch("desktop", e.currentTarget.value)}
          />
        </Stack>
        <Stack space={2}>
          <Text size={1} weight="medium">
            Mobile
          </Text>
          <TextInput
            fontSize={1}
            value={value.mobile ?? ""}
            readOnly={readOnly}
            placeholder="same as desktop"
            onChange={(e) => patch("mobile", e.currentTarget.value)}
          />
        </Stack>
      </Grid>
    </Stack>
  );
}
