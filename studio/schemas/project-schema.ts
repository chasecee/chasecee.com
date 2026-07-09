import { EditIcon, CogIcon, LinkIcon, LaunchIcon } from "@sanity/icons";
import { ALL_FIELDS_GROUP } from "sanity";
import AspectRatioInput from "../components/AspectRatioInput";

const project = {
  name: "project",
  title: "Projects",
  type: "document",
  groups: [
    {
      name: "content",
      title: "Content",
      icon: EditIcon,
      default: true,
    },
    {
      name: "meta",
      title: "Meta",
      icon: CogIcon,
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      group: "content",
    },
    {
      name: "content",
      title: "Content",
      type: "array",
      group: "content",
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
        { type: "embed" },
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
      group: "meta",
    },
    {
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      group: "meta",
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      group: "meta",
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
      group: "meta",
    },
    {
      name: "color",
      title: "Color",
      type: "color",
      group: "meta",
    },
    {
      title: "Display Type",
      name: "displayType",
      type: "string",
      options: {
        list: [
          { title: "Popup (Default)", value: "popup" },
          { title: "Background", value: "background" },
          { title: "Embed", value: "embed" },
        ],
        layout: "radio",
      },
      initialValue: "popup",
      group: "meta",
    },
    {
      name: "embedUrl",
      title: "Embed URL",
      type: "url",
      group: "meta",
      hidden: ({ parent }: { parent?: { displayType?: string } }) =>
        parent?.displayType !== "embed",
      validation: (Rule: any) =>
        Rule.custom((value: string | undefined, context: any) => {
          if (context.parent?.displayType === "embed" && !value) {
            return "Embed URL is required when display type is Embed";
          }
          return true;
        }),
    },
    {
      name: "aspectRatio",
      title: "Aspect Ratio",
      type: "object",
      group: "meta",
      hidden: ({ parent }: { parent?: { displayType?: string } }) =>
        parent?.displayType !== "embed",
      components: { input: AspectRatioInput },
      fields: [
        {
          name: "desktop",
          title: "Desktop",
          type: "string",
          initialValue: "1/1",
        },
        {
          name: "mobile",
          title: "Mobile",
          type: "string",
        },
      ],
      initialValue: { desktop: "1/1" },
    },
    {
      name: "url",
      title: "URL",
      type: "url",
      group: "meta",
    },
    {
      title: "Archived",
      name: "archived",
      type: "boolean",
      group: "meta",
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
