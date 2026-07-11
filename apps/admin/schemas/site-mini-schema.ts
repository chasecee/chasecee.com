const siteMini = {
  name: "siteMini",
  type: "object",
  title: "Site Mini",
  fields: [
    {
      name: "url",
      type: "url",
      title: "URL",
      description: "Visit Site link target.",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "embedUrl",
      type: "url",
      title: "Embed URL",
      description:
        "Optional. Iframe source when different from URL (e.g. an /embed path).",
    },
    {
      name: "title",
      type: "string",
      title: "Title",
    },
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
    prepare: ({
      title,
      subtitle,
    }: {
      title?: string;
      subtitle?: string;
    }) => ({
      title: title || "Site Mini",
      subtitle: subtitle || "",
    }),
  },
};

export default siteMini;
