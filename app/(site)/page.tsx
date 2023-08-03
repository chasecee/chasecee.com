import { getProjects } from "@/sanity/sanity-utils"
import Image from "next/image";
import Link from "next/link";
import Container from "./components/Container";
import HomeHero from "./components/HomeHero";
import urlFor from "@/sanity/sanity.image";

export default async function Home() {
  

  const projects = await getProjects();
  return (
    <Container>
      <HomeHero 
      text="Pixel perfection one line of code at a time." 
      paragraph="Hi, I'm Chase. I've been a coder and designer for over 8 years. I have a passion for building with effective design. Learn more about me and my skillset." 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 
      gap-10 xl:gap-20 
      mx-auto">
        {projects.map((project) => (
         
          <Link 
            key={project._id} 
            href={`/projects/${project.slug}`}
            className='group'
            
            >
               
            <div className="relative h-0 pt-[100%] overflow-hidden">
                {project.color && (
                  <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: project.color.hex }}></div>
                )}
              <div className="
              absolute top-[100%] translate-y-0 left-[10%] right-[10%] 
              group-hover:-translate-y-[75%] group-active::scale-95 rounded-xl transition-transform duration-300">
                  {project.image && (
                    <Image
                      src={urlFor(project.image).width(622).height(622).dpr(1.5).url()}
                      alt={project.name}
                      width={622}
                      height={622}
                      className="object-cover rounded-xl"
                    />
                  )}
              </div>

              {project.svgcode && (
                <div className="group-hover:-translate-y-[30%] group-hover:duration-300 duration-500 delay-[25ms] transition-transform absolute inset-0">
                  <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 svg-parent' 
                  dangerouslySetInnerHTML={{ __html: project.svgcode.code }} />
                </div>
              )}
            </div>
            <div className="relative group-hover:-translate-y-0 transition-transform duration-300">
              <span className="inline-block px-2 py-1 rounded bg-white dark:bg-neutral-900 text-xl">
                {project.name}
              </span>
            </div>
          </Link>

        ))}
      </div>
    </Container>
  );

}