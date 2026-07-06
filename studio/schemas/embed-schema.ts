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
      name: "aspectRatio",
      type: "string",
      title: "Aspect ratio",
      options: {
        list: [
          { title: "16:9", value: "16/9" },
          { title: "4:3", value: "4/3" },
          { title: "1:1", value: "1/1" },
        ],
      },
      initialValue: "16/9",
    },
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
  },
};

export default embed;
