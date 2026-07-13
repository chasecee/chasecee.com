import type {
  PROJECT_QUERY_RESULT,
  PROJECTS_QUERY_RESULT,
} from "../sanity/sanity.types";

export type Project = PROJECTS_QUERY_RESULT[number];
export type ProjectDetail = NonNullable<PROJECT_QUERY_RESULT>;
export type ProjectAspectRatio = NonNullable<Project["aspectRatio"]>;
