import Image from "next/image";
import Link from "next/link";
import urlFor from "@/sanity/sanity.image";
import { ChevronLeftIcon, ChevronRightIcon } from "@sanity/icons"; // Import these if needed
import { Project } from "@/types/Project";

type ProjectLinkProps = {
  project: Project;
  direction: "next" | "prev";
};

const ProjectLink = ({ project, direction }: ProjectLinkProps) => {
  return (
    <div className={`${direction}-post flex-grow `}>
      <Link
        href={`/projects/${project.slug}`}
        className={`${
          direction === "prev" ? "flex-row" : "flex-row-reverse"
        } not-prose group relative flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-gray-500/30 no-underline  transition-colors hover:bg-gray-500/10 `}
      >
        {project.image && (
          <div className="flex-none">
            <Image
              src={urlFor(project.image).width(150).height(150).dpr(1.5).url()}
              alt={project.name}
              width={150}
              height={150}
              className="w-full flex-none transition-opacity group-hover:opacity-90"
            />
          </div>
        )}
        <div className="relative z-10 flex flex-grow justify-center">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm opacity-50">
              {direction === "prev" ? "Previous Project" : "Next Project"}
            </span>
            <span className="text-2xl">{project.name}</span>
          </div>
        </div>
        {/* <div className="justify-self-end text-[4rem]">
          {direction === "prev" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </div> */}
      </Link>
    </div>
  );
};

export default ProjectLink;
