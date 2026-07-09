import GalleryInput from "../components/GalleryInput";

const music = {
  name: "music",
  title: "Music",
  type: "document",
  fields: [
    {
      name: "bandName",
      title: "Band Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "albumName",
      title: "Album Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "releaseYear",
      title: "Release Year",
      type: "number",
      validation: (Rule: any) => Rule.required().integer().min(1800).max(3000),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: (doc: { bandName?: string; albumName?: string }) =>
          [doc.bandName, doc.albumName].filter(Boolean).join("-"),
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "albumArt",
      title: "Album Art",
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
      name: "gallery",
      title: "Band Art / Photography Gallery",
      type: "array",
      components: { input: GalleryInput },
      options: {
        layout: "grid",
        sortable: true,
        modal: { type: "dialog", width: 1 },
        disableActions: ["add"],
      },
      of: [
        {
          name: "galleryImage",
          title: "Gallery Image",
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
          preview: {
            select: {
              media: "asset",
              title: "alt",
              subtitle: "caption",
            },
            prepare: ({
              media,
              title,
              subtitle,
            }: {
              media?: unknown;
              title?: string;
              subtitle?: string;
            }) => ({
              media,
              title: title || "Untitled image",
              subtitle,
            }),
          },
        },
      ],
    },
    {
      name: "links",
      title: "Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule: any) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "url",
            },
          },
        },
      ],
    },
    {
      name: "embeds",
      title: "Embeds",
      type: "array",
      of: [{ type: "embed" }],
    },
  ],
  preview: {
    select: {
      title: "albumName",
      subtitle: "bandName",
      media: "albumArt",
    },
  },
};

export default music;
