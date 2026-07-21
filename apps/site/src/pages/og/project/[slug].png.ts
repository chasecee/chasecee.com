import type { APIRoute } from "astro";
import { generateOGImagePng } from "@/lib/og-satori";
import { getProjects } from "@/sanity/sanity-utils";

export const prerender = true;

export async function getStaticPaths() {
  const projects = await getProjects();
  return projects
    .filter(
      (project): project is (typeof projects)[number] & { slug: string } =>
        typeof project.slug === "string" && project.slug.length > 0,
    )
    .map((project) => ({
      params: { slug: project.slug },
      props: { title: project.name ?? project.slug },
    }));
}

export const GET: APIRoute = async ({ params, props }) => {
  const slug = typeof params.slug === "string" ? params.slug : "";
  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const png = await generateOGImagePng({
    template: "project",
    title: typeof props.title === "string" ? props.title : slug,
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
