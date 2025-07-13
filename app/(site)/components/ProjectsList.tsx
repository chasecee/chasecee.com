import Link from "next/link";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import generateColorPalette from "../utils/colorUtils";
import { Project } from "@/types/Project";
import { ColorPalette } from "./ColorPalette";
import dynamic from "next/dynamic";

const LoopPlayerCard = dynamic(() => import("./project-cards/LoopPlayerCard"));
const CustomDashboardCard = dynamic(
  () => import("./project-cards/CustomDashboardCard"),
);

const getColumnClass = (columns: number) => {
  switch (columns) {
    case 1:
      return "w-full";
    case 2:
      return "md:w-1/2";
    case 3:
      return "md:w-1/3";
    case 4:
      return "md:w-1/4";
    case 5:
      return "md:w-1/5";
    case 6:
      return "md:w-1/6";
    default:
      return "md:w-1/4";
  }
};

type ProjectsListProps = {
  projects: Project[];
  title?: string;
  columns?: number;
  forceLoading?: boolean;
};

function ProjectsListContent({
  projects,
  title,
  columns = 4,
}: ProjectsListProps) {
  return (
    <div className="project-list">
      {title && <h2 className="mb-6 text-left text-2xl font-bold">{title}</h2>}
      <div className="flex flex-nowrap gap-12 overflow-x-auto pb-10">
        {projects.map((project: Project, index: number) => {
          const slugname =
            typeof project.slug === "string"
              ? project.slug
              : project.slug?.current;

          const displayType = project.displayType || "popup";

          return (
            <div
              key={project._id}
              className={`project-item ${getColumnClass(columns)} w-[80%] flex-shrink-0 project-${index + 1} project-${slugname}`}
            >
              <Link
                href={`/projects/${slugname}`}
                title={`See my work on ${project.name}`}
                className="group"
              >
                {slugname === "loop-player" ? (
                  <LoopPlayerCard project={project} />
                ) : slugname === "custom-dashboard" ? (
                  <CustomDashboardCard project={project} index={index} />
                ) : (
                  <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
                    {displayType === "background" && project.image ? (
                      <div
                        className="absolute inset-0 rounded-xl bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${project.image})`,
                        }}
                      />
                    ) : (
                      project.color?.hex && (
                        <div
                          className="absolute inset-0 rounded-xl"
                          style={{ backgroundColor: project.color.hex }}
                        />
                      )
                    )}

                    {displayType === "popup" && project.color?.hex && (
                      <ColorPalette
                        colorPalette={generateColorPalette(project.color.hex)}
                        project={project}
                      />
                    )}

                    {project.svgcode?.code && (
                      <div
                        className={`view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 ${
                          displayType === "background"
                            ? "group-hover:scale-110 group-hover:duration-300"
                            : "group-hover:-translate-y-[28%] group-hover:duration-300"
                        }`}
                      >
                        <div
                          className="svg-parent absolute top-1/2 left-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                          dangerouslySetInnerHTML={{
                            __html: project.svgcode.code,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

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
        })}
      </div>
    </div>
  );
}

export default function ProjectsList({
  projects,
  title,
  columns = 4,
  forceLoading = false,
}: ProjectsListProps) {
  if (forceLoading || !projects) {
    return <div className="project-list opacity-50">Loading projects...</div>;
  }

  const validProjects = projects.filter(
    (project) => project && project._id && project.name,
  );

  return (
    <ProjectsListContent
      projects={validProjects}
      title={title}
      columns={columns}
    />
  );
}
