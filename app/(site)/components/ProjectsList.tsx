import Link from "next/link";
import Image from "next/image";
import IntersectionObserverComponent from "./IntersectionObserver";
import urlFor from "@/sanity/sanity.image";
import generateColorPalette from "../utils/colorUtils";
import { Project } from "@/types/Project";
import { ColorPalette } from "./ColorPalette";
import InMomentSpline from "./splines/InMomentSpline";
import dynamic from "next/dynamic";

const LoopPlayerCard = dynamic(() => import("./project-cards/LoopPlayerCard"));
const CustomDashboardCard = dynamic(
  () => import("./project-cards/CustomDashboardCard"),
);

type ProjectsListProps = {
  projects: Project[];
  title?: string;
  columns?: number;
  forceLoading?: boolean;
};

function ProjectsListSkeleton({
  columns = 4,
  title,
}: {
  columns?: number;
  title?: string;
}) {
  const getColumnClass = (columns: number) => {
    switch (columns) {
      case 1:
        return "w-full";
      case 2:
        return "w-1/2";
      case 3:
        return "w-1/3";
      case 4:
        return "w-1/4";
      case 5:
        return "w-1/5";
      case 6:
        return "w-1/6";
      default:
        return "w-1/4";
    }
  };

  return (
    <div className="project-list">
      {title && (
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-current opacity-20" />
      )}
      <div className="flex flex-nowrap gap-16 overflow-x-auto pb-10">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className={`${getColumnClass(columns)} flex-shrink-0 opacity-20`}
          >
            <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
              <div className="absolute inset-0 animate-pulse rounded-xl bg-current" />
            </div>
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-current" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsListContent({
  projects,
  title,
  columns = 4,
}: ProjectsListProps) {
  const getColumnClass = (columns: number) => {
    switch (columns) {
      case 1:
        return "w-full";
      case 2:
        return "w-1/2";
      case 3:
        return "w-1/3";
      case 4:
        return "w-1/4";
      case 5:
        return "w-1/5";
      case 6:
        return "w-1/6";
      default:
        return "w-1/4";
    }
  };

  return (
    <div className="project-list">
      {title && <h2 className="mb-6 text-left text-2xl font-bold">{title}</h2>}
      <div className="flex flex-nowrap gap-16 overflow-x-auto pb-10">
        {projects.map((project: Project, index: number) => {
          const slugname =
            typeof project.slug === "string"
              ? project.slug
              : project.slug?.current;

          if (slugname === "loop-player") {
            return (
              <LoopPlayerCard
                key={project._id}
                project={project}
                columnClass={getColumnClass(columns)}
                index={index}
              />
            );
          }

          if (slugname === "custom-dashboard") {
            return (
              <CustomDashboardCard
                key={project._id}
                project={project}
                columnClass={getColumnClass(columns)}
                index={index}
              />
            );
          }

          const colorPalette = project.color?.hex
            ? generateColorPalette(project.color.hex)
            : null;

          return (
            <div
              key={project._id}
              className={`project-item ${getColumnClass(columns)} flex-shrink-0 project-${index + 1} project-${
                slugname
              }`}
            >
              <Link
                key={project._id}
                href={`/projects/${slugname}`}
                title={`See my work on ${project.name}`}
                className="group"
              >
                <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
                  {project.color?.hex && (
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: project.color.hex }}
                    ></div>
                  )}
                  {colorPalette && (
                    <ColorPalette
                      colorPalette={colorPalette}
                      project={project}
                    />
                  )}
                  {project.name != "aInMoment.com" && (
                    <div className="view-actor-image absolute top-[100%] right-[10%] left-[10%] translate-y-0 rounded-xl transition-transform duration-300 group-hover:-translate-y-[75%] group-active:scale-95">
                      {project.image && (
                        <Image
                          src={urlFor(project.image)
                            .width(515)
                            .height(515)
                            .dpr(1.5)
                            .url()}
                          alt={project.name}
                          width={515}
                          height={515}
                          priority={index < 2}
                          sizes="(max-width: 640) 314px, 515px"
                          className="rounded-xl object-cover"
                        />
                      )}
                    </div>
                  )}
                  {project.svgcode?.code && (
                    <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:-translate-y-[28%] group-hover:duration-300">
                      <div
                        className="svg-parent absolute top-1/2 left-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
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
    return <ProjectsListSkeleton columns={columns} title={title} />;
  }

  // Filter out any invalid projects
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
