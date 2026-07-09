import GalleryManagerInput from "../components/GalleryManagerInput";

const detailsFieldset = {
  name: "details",
  title: "Details",
  options: { collapsible: true, collapsed: true },
};

const music = {
  name: "music",
  title: "Music",
  type: "document",
  fieldsets: [detailsFieldset],
  fields: [
    {
      name: "bandName",
      title: "Band Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
      fieldset: "details",
    },
    {
      name: "albumName",
      title: "Album Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
      fieldset: "details",
    },
    {
      name: "releaseYear",
      title: "Release Year",
      type: "number",
      validation: (Rule: any) => Rule.required().integer().min(1800).max(3000),
      fieldset: "details",
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
      fieldset: "details",
    },
    {
      name: "albumArt",
      title: "Album Art",
      type: "image",
      options: { hotspot: true },
      fieldset: "details",
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
      components: { input: GalleryManagerInput },
      of: [
        {
          name: "galleryImage",
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
      ],
      fieldset: "details",
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
      fieldset: "details",
    },
    {
      name: "embeds",
      title: "Embeds",
      type: "array",
      of: [{ type: "embed" }],
      fieldset: "details",
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
