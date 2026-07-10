import { definePlugin } from "sanity";
import { createGallerySchemaTypes, type GallerySchemaOptions } from "./schema";

export type GalleryPluginOptions = GallerySchemaOptions;

export const galleryPlugin = definePlugin<GalleryPluginOptions | void>((options) => {
  const resolvedOptions = options ?? {};

  return {
    name: "gallery-plugin",
    schema: {
      types: createGallerySchemaTypes(resolvedOptions),
    },
  };
});
