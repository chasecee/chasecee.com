import { AspectRatioInput } from "../plugins/aspect-ratio";
import { AutoTitleObjectInput } from "../plugins/auto-title/AutoTitleObjectInput";

const isValidRatio = (value?: string) => {
  if (!value) return true;
  return /^\d+(\.\d+)?\s*[:/]\s*\d+(\.\d+)?$/.test(value.trim());
};

const embed = {
  name: "embed",
  type: "object",
  title: "Embed",
  components: { input: AutoTitleObjectInput },
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
      description: "Auto-filled from oEmbed when available. Editable.",
    },
    {
      name: "width",
      type: "string",
      title: "Width",
      options: {
        list: [
          { title: "Content", value: "content" },
          { title: "Full width", value: "full" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "full",
      validation: (Rule: any) => Rule.required(),
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
