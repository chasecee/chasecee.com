import { getProjects } from "@/sanity/sanity-utils";
import ContainerHome from "./components/ContainerHome";
import ProjectsList from "./components/ProjectsList";
import { Suspense } from "react";
import LoadingSkeleton from "./components/LoadingSkeleton";
import HomeHero from "./components/hero/HomeHero7/HomeHero7";

export default async function Home() {
  const projects = await getProjects();
  return (
    <>
      <ContainerHome className="container relative z-10" showCTA={true}>
        <HomeHero />
        <Suspense fallback={<LoadingSkeleton />}>
          <ProjectsList projects={projects} />
        </Suspense>
      </ContainerHome>
    </>
  );
}
