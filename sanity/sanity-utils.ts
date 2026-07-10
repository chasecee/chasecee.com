import type { ClientPerspective } from "@sanity/client";
import type { Project } from "@/types/Project";
import type { Music } from "@/types/Music";
import type { Page } from "@/types/Page";
import { getSanityClient } from "./preview";

const PROJECT_FIELDS = `{
  _id,
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
  url,
  content
}`;

const MUSIC_FIELDS = `{
  _id,
  "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
  _createdAt,
  "slug": coalesce(slug.current, _id),
  bandName,
  albumName,
  releaseYear,
  "albumArt": albumArt.asset->url,
  "albumArtAlt": albumArt.alt,
  "gallery": gallery[]{
    _key,
    "url": asset->url,
    alt,
    caption
  },
  links,
  embeds
}`;

type QueryOptions = {
  preview?: boolean;
  perspective?: ClientPerspective;
};

function getClient(options?: QueryOptions) {
  return getSanityClient(options?.preview === true, options?.perspective);
}

export async function getProjects(options?: QueryOptions): Promise<Project[]> {
  return getClient(options).fetch(
    `*[_type == "project"] | order(orderRank) ${PROJECT_FIELDS}`,
  );
}

export async function getMusic(options?: QueryOptions): Promise<Music[]> {
  return getClient(options).fetch(
    `*[_type == "music"] | order(orderRank) ${MUSIC_FIELDS}`,
  );
}

export async function getMusicBySlug(
  slug: string,
  options?: QueryOptions,
): Promise<Music | null> {
  return getClient(options).fetch(
    `*[_type == "music" && (slug.current == $slug || _id == $slug)][0] ${MUSIC_FIELDS}`,
    { slug },
  );
}

export async function getPersonalProjects(
  options?: QueryOptions,
): Promise<Project[]> {
  return getClient(options).fetch(
    `*[_type == "project" && type == "personal"] | order(orderRank) ${PROJECT_FIELDS}`,
  );
}

export async function getClientProjects(
  options?: QueryOptions,
): Promise<Project[]> {
  return getClient(options).fetch(
    `*[_type == "project" && type == "client"] | order(orderRank) ${PROJECT_FIELDS}`,
  );
}

export async function getProject(
  slug: string,
  options?: QueryOptions,
): Promise<{
  project?: Project;
  nextProject?: Project;
  prevProject?: Project;
}> {
  const client = getClient(options);
  const project = await client.fetch(
    `*[_type == "project" && slug.current == $slug][0]{
      _id,
      "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
      _createdAt,
      name,
      "slug": slug.current,
      "image": image.asset->url,
      subtitle,
      url,
      archived,
      orderRank,
      "content": content[]{
        ...,
        markDefs[]{
          ...,
          _type == "internalLink" => {
            "slug": @.reference->slug.current,
            "refType": @.reference->_type
          },
          _type == "link" => {
            ...,
          }
        }
      }
    }`,
    { slug },
  );

  if (project) {
    const nextProject = await client.fetch(
      `*[_type == "project" && orderRank > $orderRank] | order(orderRank) [0] {
        _id,
        "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
        name,
        "slug": slug.current,
        "image": image.asset->url
      }`,
      { orderRank: project.orderRank },
    );

    const prevProject = await client.fetch(
      `*[_type == "project" && orderRank < $orderRank] | order(orderRank desc) [0] {
        _id,
        "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
        name,
        "slug": slug.current,
        "image": image.asset->url
      }`,
      { orderRank: project.orderRank },
    );

    return { project, nextProject, prevProject };
  }

  return {};
}

export async function getPages(options?: QueryOptions): Promise<Page[]> {
  return getClient(options).fetch(
    `*[_type == "page"]{
      _id,
      _createdAt,
      title,
      "slug": slug.current
    }`,
  );
}

export async function getPage(
  slug: string,
  options?: QueryOptions,
): Promise<Page> {
  return getClient(options).fetch(
    `*[_type == "page" && slug.current == $slug][0]{
      _id,
      _createdAt,
      title,
      subtitle,
      "slug": slug.current,
      content[]{
        ...,
        _type == "image" => {
          "imageUrl": asset->url,
          "alt": alt
        }
      }
    }`,
    { slug },
  );
}

