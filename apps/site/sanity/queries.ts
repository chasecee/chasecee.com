import { portableTextFields } from "@chasecee/sanity-kit/astro";

export const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0]{
  _id,
  _type,
  "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
  _createdAt,
  name,
  "slug": slug.current,
  "image": image.asset->url,
  subtitle,
  svgcode,
  url,
  archived,
  siteMini,
  orderRank,
  "leadIn": leadIn[]${portableTextFields},
  "content": content[]${portableTextFields}
}`;

export const MUSIC_QUERY = `*[_type == "music" && (slug.current == $slug || _id == $slug)][0]{
  _id,
  _type,
  "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
  _createdAt,
  "slug": coalesce(slug.current, _id),
  bandName,
  albumName,
  releaseYear,
  "albumArt": albumArt.asset->url,
  "albumArtAlt": albumArt.alt,
  "gallery": {
    "columns": coalesce(gallery.columns, 2),
    "images": coalesce(gallery.images, gallery)[]{
      _key,
      asset,
      "url": asset->url,
      alt,
      caption
    }
  },
  links,
  embeds
}`;
