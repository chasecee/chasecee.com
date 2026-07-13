import { randomUUID } from "node:crypto";
import { createClient } from "sanity";

type GalleryImage = {
  _key?: string;
  asset?: unknown;
  alt?: string;
  caption?: string;
};

type GalleryField =
  | {
      columns?: number;
      images?: GalleryImage[];
    }
  | GalleryImage[];

type ContentBlock = {
  _type?: string;
  [key: string]: unknown;
};

type MusicDoc = {
  _id: string;
  gallery?: GalleryField;
  content?: ContentBlock[];
};

const token = process.env.SANITY_API_TOKEN;
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

if (!token || !projectId || !dataset) {
  throw new Error(
    "Set SANITY_API_TOKEN, SANITY_STUDIO_PROJECT_ID, and SANITY_STUDIO_DATASET.",
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-07-12",
  useCdn: false,
  token,
});

const shouldWrite = process.argv.includes("--write");

const clampColumns = (value: number) =>
  Number.isInteger(value) ? Math.min(Math.max(value, 0), 6) : 2;

const normalizeGallery = (gallery?: GalleryField) => {
  if (!gallery) return { columns: 2, images: [] as GalleryImage[] };
  if (Array.isArray(gallery)) {
    return { columns: 2, images: gallery };
  }
  return {
    columns: clampColumns(gallery.columns ?? 2),
    images: Array.isArray(gallery.images) ? gallery.images : [],
  };
};

const withKey = (key?: string) =>
  key && key.length > 0 ? key : randomUUID().replaceAll("-", "").slice(0, 12);

const musicDocs = await client.fetch<MusicDoc[]>(
  `*[_type == "music" && defined(gallery)]{
    _id,
    gallery,
    content
  }`,
);

for (const music of musicDocs) {
  const currentContent = music.content ?? [];
  const hasContentGallery = currentContent.some((block) => block?._type === "gallery");
  const patch = client.patch(music._id);

  if (hasContentGallery) {
    patch.unset(["gallery"]);
    if (shouldWrite) {
      await patch.commit();
      console.log(`unset gallery only ${music._id} (content already has gallery block)`);
    } else {
      console.log(`dry-run unset only ${music._id} (content already has gallery block)`);
    }
    continue;
  }

  const { columns, images } = normalizeGallery(music.gallery);
  const normalizedImages = images
    .filter((image) => image && typeof image === "object")
    .map((image) => ({
      _type: "galleryImage",
      _key: withKey(image._key),
      asset: image.asset,
      alt: image.alt,
      caption: image.caption,
    }));

  const nextContent = [
    {
      _type: "gallery",
      _key: withKey(),
      columns,
      images: normalizedImages,
    },
    ...currentContent,
  ];

  patch.set({ content: nextContent }).unset(["gallery"]);

  if (shouldWrite) {
    await patch.commit();
    console.log(`migrated ${music._id}`);
    continue;
  }

  console.log(`dry-run ${music._id}`);
}

console.log(
  shouldWrite
    ? `completed ${musicDocs.length} music migrations`
    : `dry-run complete for ${musicDocs.length} music docs`,
);
