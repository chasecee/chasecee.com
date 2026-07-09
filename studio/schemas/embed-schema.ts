import AspectRatioInput from "../components/AspectRatioInput";

const isValidRatio = (value?: string) => {
  if (!value) return true;
  return /^\d+(\.\d+)?\s*[:/]\s*\d+(\.\d+)?$/.test(value.trim());
};

const embed = {
  name: "embed",
  type: "object",
  title: "Embed",
  fields: [
    {
      name: "url",
      type: "url",
      title: "URL",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "title",
      type: "string",
      title: "Title",
      description: "Accessible title for the iframe.",
    },
    {
      name: "ratio",
      title: "Aspect Ratio",
      type: "object",
      components: { input: AspectRatioInput },
      fields: [
        {
          name: "desktop",
          title: "Desktop",
          type: "string",
          initialValue: "16/9",
          validation: (Rule: any) =>
            Rule.custom((value: string | undefined) =>
              isValidRatio(value) ? true : "Use format like 16/9 or 16:9",
            ),
        },
        {
          name: "mobile",
          title: "Mobile",
          type: "string",
          validation: (Rule: any) =>
            Rule.custom((value: string | undefined) =>
              isValidRatio(value) ? true : "Use format like 4/3 or 4:3",
            ),
        },
      ],
      initialValue: { desktop: "16/9" },
    },
    {
      name: "aspectRatio",
      type: "string",
      title: "Legacy Aspect Ratio",
      hidden: true,
      readOnly: true,
      deprecated: {
        reason: "Use ratio.desktop and ratio.mobile instead.",
      },
    },
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
  },
};

export default embed;
