import { LinkIcon } from "@sanity/icons/Link";
import { LaunchIcon } from "@sanity/icons/Launch";
import {
  columnsBlock,
  contentBlocks,
  ColumnsPortableTextPlugin,
} from "@chasecee/sanity-kit/studio";

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
            to: [{ type: "project" }, { type: "page" }, { type: "music" }],
          },
        ],
      },
    ],
  },
};

export const contentPortableText = {
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
    ...contentBlocks(),
  ],
};

export const leadInPortableText = {
  ...contentPortableText,
  of: [...contentPortableText.of, { type: "siteMini" }],
};
