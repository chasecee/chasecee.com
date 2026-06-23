import type { Project } from "@/types/Project";
import sanityClient from "./sanityClient";
import type { Page } from "@/types/Page";

const PROJECT_FIELDS = `{
  _id,
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
  url,
  content
}`;

export async function getProjects(): Promise<Project[]> {
  return sanityClient.fetch(
    `*[_type == "project"] | order(orderRank) ${PROJECT_FIELDS}`,
  );
}

export async function getPersonalProjects(): Promise<Project[]> {
  return sanityClient.fetch(
    `*[_type == "project" && type == "personal"] | order(orderRank) ${PROJECT_FIELDS}`,
  );
}

export async function getClientProjects(): Promise<Project[]> {
  return sanityClient.fetch(
    `*[_type == "project" && type == "client"] | order(orderRank) ${PROJECT_FIELDS}`,
  );
}

export async function getProject(slug: string): Promise<{
  project?: Project;
  nextProject?: Project;
  prevProject?: Project;
}> {
  const project = await sanityClient.fetch(
    `*[_type == "project" && slug.current == $slug][0]{
      _id,
      _createdAt,
      name,
      "slug": slug.current,
      "image": image.asset->url,
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
    const nextProject = await sanityClient.fetch(
      `*[_type == "project" && orderRank > $orderRank] | order(orderRank) [0] {
        _id,
        name,
        "slug": slug.current,
        "image": image.asset->url
      }`,
      { orderRank: project.orderRank },
    );

    const prevProject = await sanityClient.fetch(
      `*[_type == "project" && orderRank < $orderRank] | order(orderRank desc) [0] {
        _id,
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

export async function getPages(): Promise<Page[]> {
  return sanityClient.fetch(
    `*[_type == "page"]{
      _id,
      _createdAt,
      title,
      "slug": slug.current
    }`,
  );
}

export async function getPage(slug: string): Promise<Page> {
  return sanityClient.fetch(
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

