import Container from "@/app/(site)/components/Container";
import { getProject } from "@/sanity/sanity-utils";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import { Body } from "@/app/(site)/components/Body";
import Link from "next/link";
import { ArrowTopRightIcon } from "@sanity/icons";

type Props = {
  params: { project: string };
};

export default async function Project({ params }: Props) {
  const slug = params.project;
  const project = await getProject(slug);
  //console.log(project);
  return (
    <div>
      <Container>
        <div className="prose mx-auto dark:prose-invert">
          <header className="flex items-center justify-between">
            <h1 className="mb-0">{project.name}</h1>

            {project.url && (
              <div>
                <Link
                  href={project?.url}
                  title={project.name}
                  target="_blank"
                  className="not-prose group inline-flex rounded-xl border border-current px-3 py-0 pr-2 
                  text-sm text-black no-underline opacity-80 hover:opacity-100 dark:text-white/90"
                >
                  {project.archived ? (
                    <span className="flex h-[2.1rem] flex-row items-center justify-normal gap-1">
                      See Archived Website
                      <ArrowTopRightIcon className="text-[1.6rem] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </span>
                  ) : (
                    <span className="flex h-[2.1rem] flex-row items-center justify-normal gap-1">
                      See Live Website
                      <ArrowTopRightIcon className="text-[1.6rem] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </span>
                  )}
                </Link>
              </div>
            )}
          </header>
          {project.image && (
            <Image
              src={urlFor(project.image).width(622).height(622).dpr(1.5).url()}
              alt={project.name}
              width={622}
              height={622}
              className="rounded-xl object-cover"
            />
          )}
          <div>
            <Body value={project.content} />
          </div>
        </div>
      </Container>
    </div>
  );
}
