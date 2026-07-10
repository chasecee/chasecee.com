import type { ArrayOfObjectsInputProps, ImageValue } from "sanity";
import { createGalleryInput, type AltFromFilename } from "./GalleryInput";

export type GalleryImage = ImageValue & { _key: string; alt?: string };

export interface GallerySchemaOptions {
  name?: string;
  title?: string;
  imageTypeName?: string;
  fields?: Array<Record<string, unknown>>;
  input?: (props: ArrayOfObjectsInputProps<GalleryImage>) => JSX.Element;
  accept?: string;
  altFromFilename?: AltFromFilename;
}

const defaultFields = [
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
];

export const createGallerySchemaTypes = (options: GallerySchemaOptions = {}) => {
  const galleryName = options.name ?? "gallery";
  const galleryTitle = options.title ?? "Gallery";
  const imageTypeName = options.imageTypeName ?? "galleryImage";
  const input =
    options.input ??
    createGalleryInput({
      accept: options.accept,
      altFromFilename: options.altFromFilename,
    });

  const galleryImage = {
    name: imageTypeName,
    title: "Gallery Image",
    type: "image",
    options: { hotspot: true },
    fields: options.fields ?? defaultFields,
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
  };

  const gallery = {
    name: galleryName,
    title: galleryTitle,
    type: "array",
    components: { input },
    options: {
      layout: "grid",
      sortable: true,
      modal: { type: "dialog", width: 1 },
      disableActions: ["add"],
    },
    of: [{ type: imageTypeName }],
  };

  return [galleryImage, gallery];
};
