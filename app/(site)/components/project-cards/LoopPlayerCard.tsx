import Link from "next/link";
import { Project } from "@/types/Project";

type LoopPlayerCardProps = {
  project: Project;
  columnClass: string;
  index: number;
};

export default function LoopPlayerCard({
  project,
  columnClass,
  index,
}: LoopPlayerCardProps) {
  const slugname =
    typeof project.slug === "string" ? project.slug : project.slug?.current;

  return (
    <div
      className={`project-item ${columnClass} flex-shrink-0 project-${index + 1} project-${slugname}`}
    >
      <Link
        key={project._id}
        href={`/projects/${slugname}`}
        title={`See my work on ${project.name}`}
        className="group"
      >
        <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
          <div className="absolute inset-0 rounded-xl bg-gray-900"></div>

          {project.svgcode?.code && (
            <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:-translate-y-[28%] group-hover:duration-300">
              <div
                className="svg-parent absolute top-1/2 left-1/2 h-full w-[50%] -translate-x-1/2 -translate-y-1/2 text-white"
                dangerouslySetInnerHTML={{
                  __html: project.svgcode.code,
                }}
              />
            </div>
          )}
        </div>
        <div className="relative">
          <span className="mt-3 inline-block text-base">
            <span className="font-bold">{project.name}</span>
            {project.subtitle && (
              <span className="font-light opacity-40">
                &nbsp;-&nbsp;{project.subtitle}
              </span>
            )}
          </span>
        </div>
      </Link>
    </div>
  );
}
