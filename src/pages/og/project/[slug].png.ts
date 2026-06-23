import type { APIRoute, GetStaticPaths } from "astro";
import { generateOGImagePng } from "@/lib/og-satori";
import { getProjects } from "@/sanity/sanity-utils";

export const prerender = true;

export const getStaticPaths = (async () => {
  const projects = await getProjects();
  return projects.map((project) => ({
    params: { slug: project.slug },
    props: { name: project.name },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { name } = props as { name: string };
  const png = await generateOGImagePng({ template: "project", title: name });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
