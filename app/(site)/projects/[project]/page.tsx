import Container from "@/app/(site)/components/Container";
import { getProject, getProjects } from "@/sanity/sanity-utils";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import { Body } from "@/app/(site)/components/Body";
import Link from "next/link";
import { LinkOutIcon } from "@/app/(site)/components/icons";
import ProjectLink from "./ProjectLink";

function shortenUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}
type Props = {
  params: Promise<{ project: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ project: p.slug }));
}

export default async function Project({ params }: Props) {
  const { project: slug } = await params;
  const { project, nextProject, prevProject } = await getProject(slug);

  if (!project) {
    return <div>Project not found</div>;
  }
  return (
    <div>
      <Container>
        <div className="prose dark:prose-invert mx-auto">
          <header className="flex flex-col flex-wrap justify-start gap-6 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between">
            <h1 className="mb-0">{project.name}</h1>

            {project.url && (
              <div>
                <Link
                  href={project?.url}
                  title={project.name}
                  target="_blank"
                  className="not-prose group inline-flex rounded-xl px-3 py-0 pr-2 text-green-500 no-underline opacity-80 hover:opacity-100 dark:text-emerald-400"
                >
                  <span className="flex h-[2.1rem] flex-row items-center justify-normal gap-1">
                    {project.archived ? "Archived: " : ""}
                    {shortenUrl(project.url)}
                    <LinkOutIcon size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </Link>
              </div>
            )}
          </header>
          {project.image && (
            <Image
              src={urlFor(project.image).width(722).height(452).dpr(1.5).url()}
              alt={project.name}
              width={722}
              height={452}
              className="rounded-xl object-cover"
            />
          )}
          {project.content && (
            <div>
              <Body value={project.content} />
            </div>
          )}
          <h3 className="mt-20 mb-4 text-xl">
            Thanks for reading! Check out more:
          </h3>
          <div className="not-prose grid gap-4 md:grid-cols-2">
            {prevProject && (
              <ProjectLink project={prevProject} direction="prev" />
            )}
            {nextProject && (
              <ProjectLink project={nextProject} direction="next" />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
