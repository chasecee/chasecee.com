import { LinkIcon, LaunchIcon } from "@sanity/icons";

const project = {
  name: "project",
  title: "Projects",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
    },
    {
      name: "subtitle",
      title: "Subtitle",
      type: "string",
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt",
          type: "string",
        },
      ],
    },
    {
      type: "code",
      name: "svgcode",
      title: "SVG Code for Logo",
      options: {
        language: "xml", // SVG is XML-based
      },
    },
    {
      name: "color",
      title: "Color",
      type: "color",
    },
    {
      name: "url",
      title: "URL",
      type: "url",
    },
    {
      title: "Archived",
      name: "archived",
      type: "boolean",
    },
    {
      name: "content",
      title: "Content",
      type: "array",
      of: [
        {
          type: "block",
          marks: {
            annotations: [
              {
                name: "link",
                type: "object",
                title: "External link",
                icon: LaunchIcon,
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                  },
                  {
                    title: "Open in new tab",
                    name: "blank",
                    type: "boolean",
                  },
                ],
              },
              {
                name: "internalLink",
                type: "object",
                title: "Internal link",
                icon: LinkIcon,
                fields: [
                  {
                    name: "reference",
                    type: "reference",
                    title: "Reference",
                    to: [{ type: "project" }, { type: "page" }],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "slug.current",
      media: "image",
    },
  },
};
export default project;
