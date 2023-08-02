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
      <div className="grid grid-cols-2 gap-8 mt-20">
        {projects.map((project) => (

          <Link 
            key={project._id} 
            href={`/projects/${project.slug}`}
            className='group'
            
            >
            {project.image && (
              <Image
                src={urlFor(project.image).width(622).height(622).dpr(1.5).url()}
                alt={project.name}
                width={622}
                height={622}
                className="object-cover rounded group-hover:scale-[102%] transition-transform duration-500 group-hover:duration-100"
              />
            )}
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
