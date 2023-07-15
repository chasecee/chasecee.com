import { getProjects } from "@/sanity/sanity-utils"
import Image from "next/image";
import Link from "next/link";
import Container from "./components/Container";


export default async function Home() {

  const projects = await getProjects();

  return (
    <Container>
      <h1 className="text-7xl my-5">hello, i&apos;m <span className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">chase</span></h1>
      <div className="grid grid-cols-2 gap-8">
        {projects.map((project) => (

          <Link 
            key={project._id} 
            href={`/projects/${project.slug}`}
            className='border border-red-100 hover:scale-105'
            
            >
            {project.image && (
              <Image
                src={project.image}
                alt={project.name}
                width={250}
                height={250}
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
