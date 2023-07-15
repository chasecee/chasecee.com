import { getProjects } from "@/sanity/sanity-utils"
import Image from "next/image";


export default async function Home() {

  const projects = await getProjects();

  return (
    <div className="container">
      <h1 className="text-7xl">hello, i&apos;m <span className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">chase</span></h1>
      <div className="grid grid-cols-3 gap-8">
        {projects.map((project) => (

          <div key={project._id}>
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
          </div>

        ))}
      </div>
    </div>
  );

}
