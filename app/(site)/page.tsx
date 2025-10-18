export const dynamic = "force-static";
import { getPersonalProjects, getClientProjects } from "@/sanity/sanity-utils";
import ContainerHome from "./components/ContainerHome";
import ProjectsList from "./components/ProjectsList";
import HomeHero9 from "./components/hero/HomeHero9/HomeHero9";
import BottomCTA from "./components/BottomCTA";

export default async function Home() {
  const [personalProjects, clientProjects] = await Promise.all([
    getPersonalProjects(),
    getClientProjects(),
  ]);

  return (
    <>
      <ContainerHome className="relative z-10" showCTA={false}>
        <HomeHero9 />
        <div className="relative z-10 flex flex-col gap-10">
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
        <BottomCTA />
      </ContainerHome>
    </>
  );
}
