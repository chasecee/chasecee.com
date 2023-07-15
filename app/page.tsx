import { getProjects } from "@/sanity/sanity-utils"


export default async function Home() {

  const projects = await getProjects();

  return (
    <div className="font-bold">
      <div>my projects</div>
      {projects.map((project) => (
        <div key={project._id}>{project?.name}</div>
      ))}
    </div>
  );

}
