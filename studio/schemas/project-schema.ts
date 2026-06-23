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
      title: "Project Type",
      name: "type",
      type: "string",
      options: {
        list: [
          { title: "Personal Project", value: "personal" },
          { title: "Client Work", value: "client" },
        ],
        layout: "radio",
      },
      
      validation: (Rule: any) => Rule.required(),
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
        language: "xml",
      },
    },
    {
      name: "color",
      title: "Color",
      type: "color",
    },
    {
      title: "Display Type",
      name: "displayType",
      type: "string",
      options: {
        list: [
          { title: "Popup (Default)", value: "popup" },
          { title: "Background", value: "background" },
        ],
        layout: "radio",
      },
      initialValue: "popup",
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
        {
          name: "videoFile",
          type: "file",
          title: "Video file",
          accept: ".mp4,.webm",
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alt text",
              description: "Alternative text for accessibility.",
            },
          ],
        },
        {
          name: "media",
          type: "object",
          title: "Media",
          fields: [
            {
              name: "media",
              type: "file",
              title: "Media file",
              
            } as { name: string; type: string; title: string; media: any },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "slug.current",
      type: "type",
      media: "image",
    },
    prepare({
      title,
      subtitle,
      type,
      media,
    }: {
      title: string;
      subtitle: string;
      type: string;
      media: any;
    }) {
      const typeLabel =
        type === "personal"
          ? "Personal"
          : type === "client"
            ? "Client"
            : "No Type";
      return {
        title,
        subtitle: `${typeLabel} • ${subtitle || "No slug"}`,
        media,
      };
    },
  },
};

export default project;
