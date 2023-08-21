import { getProjects } from "@/sanity/sanity-utils";
import ContainerHome from "./components/ContainerHome";
import ProjectsList from "./components/ProjectsList";
import { Suspense } from "react";
import LoadingSkeleton from "./components/LoadingSkeleton";
import HomeHero3 from "./components/hero/HomeHero3";

export default async function Home() {
  const projects = await getProjects();
  return (
    <>
      <ContainerHome className="container relative z-10" showCTA={true}>
        <HomeHero3
          text="Hi I'm Chase."
          textB="Crafting digital experiences through effective design."
          paragraphCTA="Explore my skills and discover what I can create for you."
          className="relative"
        />
        <Suspense fallback={<LoadingSkeleton />}>
          <ProjectsList projects={projects} />
        </Suspense>
      </ContainerHome>
    </>
  );
}
