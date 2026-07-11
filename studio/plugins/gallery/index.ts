import { definePlugin } from "sanity";
import {
  createGallerySchemaTypes,
  createGalleryInput,
  type GallerySchemaOptions,
} from "./schema";

export type GalleryPluginOptions = GallerySchemaOptions;
export { createGalleryInput, createGallerySchemaTypes };

export const galleryPlugin = definePlugin<GalleryPluginOptions | void>((options) => {
  const resolvedOptions = options ?? {};

  return {
    name: "gallery-plugin",
    schema: {
      types: createGallerySchemaTypes(resolvedOptions),
    },
  };
});
