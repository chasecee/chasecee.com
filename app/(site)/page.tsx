import { getProjects } from "@/sanity/sanity-utils";
import Image from "next/image";
import Link from "next/link";
import Container from "./components/Container";
import HomeHero from "./components/hero/HomeHero";
import urlFor from "@/sanity/sanity.image";
import generateColorPalette from "./utils/colorUtils";
import IntersectionObserverComponent from "./components/IntersectionObserver";

export default async function Home() {
  const projects = await getProjects();
  return (
    <Container>
      <HomeHero
        text="Shaping pixels "
        textB="into possibilities."
        paragraph="Hi, I'm Chase. I've been a coder and designer for over 8 years. I have a passion for building with effective design. "
        paragraphCTA="Learn more about me and my skillset."
      />
      <div
        className="mx-auto grid grid-cols-1 
      gap-10 md:grid-cols-2 
      xl:gap-20"
      >
        {projects.map((project) => {
          // Use the project's hex color as the baseColor for generating the palette
          const colorPalette = generateColorPalette(project.color.hex);
          return (
            <IntersectionObserverComponent
              key={project._id}
              inViewClass="in-view"
              notInViewClass="not-in-view"
              className="project-item"
            >
              <Link
                key={project._id}
                href={`/projects/${project.slug}`}
                className="group"
              >
                <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
                  {project.color && (
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: project.color.hex }}
                    ></div>
                  )}

                  <div
                    className="scale-y-120 absolute inset-0 hidden -translate-y-[20%] transform-gpu 
                flex-col 
                flex-nowrap
                gap-0 opacity-30
                mix-blend-overlay transition-all duration-500
                group-hover:translate-y-0
                group-hover:scale-y-100 
                group-hover:duration-1000 
                 group-active:scale-95"
                  >
                    {colorPalette.map((color, index) => (
                      <div
                        key={index}
                        className="color-div absolute h-36 w-full"
                        style={{
                          backgroundColor: color,
                          top: `${(index / colorPalette.length) * 95}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="view-actor-image absolute left-[10%] right-[10%] top-[100%] translate-y-0 rounded-xl transition-transform duration-300 group-hover:-translate-y-[75%] group-active:scale-95">
                    {project.image && (
                      <Image
                        src={urlFor(project.image)
                          .width(622)
                          .height(622)
                          .dpr(1.5)
                          .url()}
                        alt={project.name}
                        width={622}
                        height={622}
                        priority={true}
                        className="rounded-xl object-cover"
                      />
                    )}
                  </div>

                  {project.svgcode && (
                    <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:-translate-y-[28%] group-hover:duration-300">
                      <div
                        className="svg-parent absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2"
                        dangerouslySetInnerHTML={{
                          __html: project.svgcode.code,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="relative transition-transform duration-300 group-hover:-translate-y-0">
                  <span className="mt-3 inline-block rounded bg-white px-2 py-1 text-xl dark:bg-neutral-900">
                    {project.name}
                    {project.subtitle && (
                      <span className="opacity-30">
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
    </Container>
  );
}
