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
      <div className="grid grid-cols-2 gap-8">
        {projects.map((project) => (

          <Link 
            key={project._id} 
            href={`/projects/${project.slug}`}
            className='border border-red-100 hover:scale-105'
            
            >
            {project.image && (
              <Image
                src={urlFor(project.image).width(622).dpr(1.5).url()}
                alt={project.name}
                width={622}
                height={622}
                className="object-cover rounded lg border border-gray-500"
              />
            )}
            {project.name}
          </Link>

        ))}
      </div>
    </Container>
  );

}
