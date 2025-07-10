import { getPersonalProjects, getClientProjects } from "@/sanity/sanity-utils";
import ContainerHome from "./components/ContainerHome";
import ProjectsList from "./components/ProjectsList";
import HomeHero from "./components/hero/HomeHero7/HomeHero7";

export default async function Home() {
  const [personalProjects, clientProjects] = await Promise.all([
    getPersonalProjects(),
    getClientProjects(),
  ]);

  return (
    <>
      <ContainerHome className="relative z-10 container" showCTA={true}>
        <HomeHero />
        <div className="flex flex-col gap-10">
          <ProjectsList
            projects={personalProjects}
            title="Personal Projects"
            columns={3}
          />
          <ProjectsList
            projects={clientProjects}
            title="Client Work"
            columns={4}
            forceLoading={false}
          />
        </div>
      </ContainerHome>
    </>
  );
}
