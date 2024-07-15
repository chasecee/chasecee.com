import Link from "next/link";
import Image from "next/image";
import IntersectionObserverComponent from "./IntersectionObserver";
import urlFor from "@/sanity/sanity.image";
import generateColorPalette from "../utils/colorUtils";
import { Project } from "@/types/Project";
import { ColorPalette } from "./ColorPalette";
import InMomentSpline from "./splines/InMomentSpline";
type ProjectsListProps = {
  projects: Project[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  return (
    // <IntersectionObserverComponent
    //   inViewClass=""
    //   notInViewClass=""
    //   threshold={0.01}
    //   className="project-list transition-transform"
    // >
    <div className="project-list">
      <div className="mx-auto grid grid-cols-1 gap-10 md:grid-cols-2 xl:gap-20">
        {projects.map((project: Project, index: number) => {
          const colorPalette = generateColorPalette(project.color.hex);
          const slugname = project.slug;
          return (
            <div
              key={project._id}
              className={`project-item project-${index + 1} project-${
                project.slug
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
                    <ColorPalette
                      colorPalette={generateColorPalette(project.color.hex)}
                      project={project}
                    />
                  )}
                  {project.name != "InMoment.com" && (
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
                          priority={index < 2}
                          sizes="(max-width: 640) 314px, 515px"
                          className="rounded-xl object-cover"
                        />
                      )}
                    </div>
                  )}
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

                  {/* {project.name === "InMoment.com" ? <InMomentSpline /> : null} */}
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
