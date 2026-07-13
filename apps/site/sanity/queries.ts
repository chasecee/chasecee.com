import { defineQuery } from "groq";
import { portableTextFields } from "@chasecee/sanity-kit/astro";

const MUSIC_FIELDS = `{
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
  links,
  embeds
}`;

const MUSIC_DETAIL_FIELDS = `{
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
  links,
  embeds,
  "content": content[]${portableTextFields}
}`;

const PROJECT_CARD_FIELDS = `{
  _id,
  _type,
  "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
  _createdAt,
  name,
  "slug": slug.current,
  "image": image.asset->url,
  archived,
  type,
  svgcode,
  subtitle,
  color,
  displayType,
  embedUrl,
  aspectRatio,
  url
}`;

export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug][0]{
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
  orderRank,
  "leadIn": leadIn[]${portableTextFields},
  "content": content[]${portableTextFields}
}`);

export const PROJECTS_QUERY = defineQuery(
  `*[_type == "project"] | order(orderRank) ${PROJECT_CARD_FIELDS}`,
);

export const PERSONAL_PROJECTS_QUERY = defineQuery(
  `*[_type == "project" && type == "personal"] | order(orderRank) ${PROJECT_CARD_FIELDS}`,
);

export const CLIENT_PROJECTS_QUERY = defineQuery(
  `*[_type == "project" && type == "client"] | order(orderRank) ${PROJECT_CARD_FIELDS}`,
);

export const MUSIC_LIST_QUERY = defineQuery(
  `*[_type == "music"] | order(orderRank) ${MUSIC_FIELDS}`,
);

export const MUSIC_BY_SLUG_QUERY = defineQuery(
  `*[_type == "music" && (slug.current == $slug || _id == $slug)][0] ${MUSIC_DETAIL_FIELDS}`,
);

export const MUSIC_QUERY = MUSIC_BY_SLUG_QUERY;

export const PAGES_QUERY = defineQuery(`*[_type == "page"]{
  _id,
  _createdAt,
  title,
  "slug": slug.current
}`);

export const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  _id,
  _createdAt,
  title,
  subtitle,
  "slug": slug.current,
  content[]${portableTextFields}
}`);
