import { LinkIcon } from "@sanity/icons/Link";
import { LaunchIcon } from "@sanity/icons/Launch";
import { AspectRatioInput } from "../plugins/aspect-ratio";
import { columnsBlock, contentBlocks } from "./blocks";
import { ColumnsPortableTextPlugin } from "../plugins/columns";

const textBlock = {
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
};

const projectPortableText = {
  components: {
    portableText: {
      plugins: ColumnsPortableTextPlugin,
    },
  },
  of: [
    textBlock,
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
    columnsBlock,
    ...contentBlocks,
  ],
};

const project = {
  name: "project",
  title: "Projects",
  type: "document",
  fieldsets: [
    {
      name: "content",
      title: "Content",
      options: { collapsible: true, collapsed: false },
    },
    {
      name: "meta",
      title: "Meta",
      options: { collapsible: true, collapsed: false },
    },
  ],
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      fieldset: "content",
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      fieldset: "content",
    },
    {
      name: "leadIn",
      title: "Lead In",
      type: "array",
      fieldset: "content",
      ...projectPortableText,
    },
    {
      name: "content",
      title: "Content",
      type: "array",
      fieldset: "content",
      ...projectPortableText,
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
      fieldset: "meta",
    },
    {
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      fieldset: "meta",
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fieldset: "meta",
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
      fieldset: "meta",
    },
    {
      name: "color",
      title: "Color",
      type: "color",
      fieldset: "meta",
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
      fieldset: "meta",
    },
    {
      name: "embedUrl",
      title: "Embed URL",
      type: "url",
      fieldset: "meta",
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
      fieldset: "meta",
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
      fieldset: "meta",
    },
    {
      name: "siteMini",
      title: "Site Mini",
      type: "siteMini",
      fieldset: "meta",
      description: "Phone-frame site preview shown beside the project header.",
    },
    {
      title: "Archived",
      name: "archived",
      type: "boolean",
      fieldset: "meta",
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
