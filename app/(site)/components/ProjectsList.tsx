import Link from "next/link";
import Image from "next/image";
import IntersectionObserverComponent from "./IntersectionObserver";
import urlFor from "@/sanity/sanity.image";
import generateColorPalette from "../utils/colorUtils";
import { Project } from "@/types/Project";
import { ColorPalette } from "./ColorPalette";


type ProjectsListProps = {
  projects: Project[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <IntersectionObserverComponent
      inViewClass="opacity-100"
      notInViewClass="opacity-10"
      threshold={0.1}
      className="project-list transition-opacity"
    >
      <div className="mx-auto grid grid-cols-1 gap-10 md:grid-cols-2 xl:gap-20">
        {projects.map((project: Project, index: number) => {
          const colorPalette = generateColorPalette(project.color.hex);
          return (
            <IntersectionObserverComponent
              key={project._id}
              inViewClass="in-view"
              notInViewClass="not-in-view"
              threshold={0.1}
              className={`project-item project-${index + 1} project-${project.slug
                }`}
            >
              <Link
                key={project._id}
                href={`/projects/${project.slug}`}
                title={`See my work on ${project.name}`}
                className="group"
              >
                <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
                  {project.color && (
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: project.color.hex }}
                    ></div>
                  )}
                  {project.color && (
                    <div className="project-gradient-bg absolute inset-0 -bottom-10 -top-10 flex-col flex-nowrap gap-0 overflow-hidden rounded-xl opacity-[15%] transition-all duration-500">
                      <ColorPalette
                        colorPalette={generateColorPalette(project.color.hex)}
                        project={project}
                      />
                    </div>
                  )}

                  <div className="view-actor-image absolute left-[10%] right-[10%] top-[100%] translate-y-0 rounded-xl transition-transform duration-300 group-hover:-translate-y-[75%] group-active:scale-95">
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
                        priority={true}
                        className="rounded-xl object-cover"
                      />
                    )}
                  </div>

                  {project.svgcode && (
                    <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:-translate-y-[28%] group-hover:duration-300">
                      <div
                        className="svg-parent absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                        dangerouslySetInnerHTML={{
                          __html: project.svgcode.code,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="mt-3 inline-block rounded bg-white px-2 py-1 text-xl dark:bg-neutral-900">
                    {project.name}
                    {project.subtitle && (
                      <span className="opacity-40">
                        &nbsp;-&nbsp;{project.subtitle}
                      </span>
                    )}
                  </span>
                </div>
              </Link>
            </IntersectionObserverComponent>
          );
        })}
      </div>
    </IntersectionObserverComponent>
  );
}
