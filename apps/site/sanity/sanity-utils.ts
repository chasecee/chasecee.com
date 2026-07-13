import type { ClientPerspective } from "@sanity/client";
import { getSanityClient } from "./preview";
import {
  CLIENT_PROJECTS_QUERY,
  MUSIC_BY_SLUG_QUERY,
  MUSIC_LIST_QUERY,
  PAGE_QUERY,
  PAGES_QUERY,
  PERSONAL_PROJECTS_QUERY,
  PROJECTS_QUERY,
} from "./queries";
import type {
  CLIENT_PROJECTS_QUERY_RESULT,
  MUSIC_BY_SLUG_QUERY_RESULT,
  MUSIC_LIST_QUERY_RESULT,
  PAGE_QUERY_RESULT,
  PAGES_QUERY_RESULT,
  PERSONAL_PROJECTS_QUERY_RESULT,
  PROJECTS_QUERY_RESULT,
} from "./sanity.types";

type QueryOptions = {
  preview?: boolean;
  perspective?: ClientPerspective;
};

function getClient(options?: QueryOptions) {
  return getSanityClient(options?.preview === true, options?.perspective);
}

export async function getProjects(
  options?: QueryOptions,
): Promise<PROJECTS_QUERY_RESULT> {
  return getClient(options).fetch(PROJECTS_QUERY);
}

export async function getMusic(
  options?: QueryOptions,
): Promise<MUSIC_LIST_QUERY_RESULT> {
  return getClient(options).fetch(MUSIC_LIST_QUERY);
}

export async function getMusicBySlug(
  slug: string,
  options?: QueryOptions,
): Promise<MUSIC_BY_SLUG_QUERY_RESULT> {
  return getClient(options).fetch(MUSIC_BY_SLUG_QUERY, { slug });
}

export async function getPersonalProjects(
  options?: QueryOptions,
): Promise<PERSONAL_PROJECTS_QUERY_RESULT> {
  return getClient(options).fetch(PERSONAL_PROJECTS_QUERY);
}

export async function getClientProjects(
  options?: QueryOptions,
): Promise<CLIENT_PROJECTS_QUERY_RESULT> {
  return getClient(options).fetch(CLIENT_PROJECTS_QUERY);
}

export async function getPages(
  options?: QueryOptions,
): Promise<PAGES_QUERY_RESULT> {
  return getClient(options).fetch(PAGES_QUERY);
}

export async function getPage(
  slug: string,
  options?: QueryOptions,
): Promise<PAGE_QUERY_RESULT> {
  return getClient(options).fetch(PAGE_QUERY, { slug });
}
