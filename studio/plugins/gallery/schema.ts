import type { ArrayOfObjectsInputProps, ImageValue } from "sanity";
import { createGalleryInput, type AltFromFilename } from "./GalleryInput";
import { GalleryBlockPreview } from "./GalleryBlockPreview";

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

  const columnsField = {
    name: "columns",
    title: "Columns",
    type: "number",
    options: {
      list: [
        { title: "1", value: 1 },
        { title: "2", value: 2 },
        { title: "3", value: 3 },
        { title: "4", value: 4 },
        { title: "5", value: 5 },
        { title: "6", value: 6 },
        { title: "Col per item", value: 0 },
      ],
      layout: "radio",
      direction: "horizontal",
    },
    initialValue: 2,
    validation: (Rule: any) => Rule.required().integer().min(0).max(6),
  };

  const imagesField = {
    name: "images",
    title: "Images",
    type: "array",
    components: { input },
    options: {
      layout: "grid",
      sortable: true,
      modal: { type: "dialog", width: 1 },
      disableActions: ["add"],
    },
    of: [{ type: imageTypeName }],
    validation: (Rule: any) => Rule.min(1),
  };

  const gallery = {
    name: galleryName,
    title: galleryTitle,
    type: "object",
    components: { preview: GalleryBlockPreview },
    fields: [columnsField, imagesField],
    preview: {
      select: {
        images: "images",
        columns: "columns",
      },
      prepare: ({
        images,
        columns,
      }: {
        images?: unknown[];
        columns?: number;
      }) => {
        const thumbs = Array.isArray(images) ? images.slice(0, 6) : [];
        return {
          title: "Gallery",
          subtitle: `${Array.isArray(images) ? images.length : 0} images · ${columns === 0 ? "per item" : `${columns ?? 2} col`}`,
          thumbs,
        };
      },
    },
  };

  return [galleryImage, gallery];
};

export { createGalleryInput };
