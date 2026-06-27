const page = {
  name: "page",
  title: "Pages",
  type: "document",
  fieldsets: [
    {
      name: "details",
      title: "Details",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [
        { type: "block" },
        { type: "skills" },
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alt Text",
            },
          ],
        },
      ],
    },
    {
      name: "title",
      title: "Title",
      type: "string",
      fieldset: "details",
    },
    {
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      fieldset: "details",
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      fieldset: "details",
    },
  ],
};

export default page;
