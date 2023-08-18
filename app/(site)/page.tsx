import { getProjects } from "@/sanity/sanity-utils";
import Container from "./components/Container";
import HomeHero from "./components/hero/HomeHero";
import ProjectsList from "./components/ProjectsList";
import { Suspense } from "react";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Diamond from "./components/svg/Diamond2";
import Noise from "./components/svg/Noise";
import HueMove from "./components/HueMove";

export default async function Home() {
  const projects = await getProjects();
  return (
    <>
      {/* <div className="absolute left-0 top-[5rem] z-0 hidden h-[100dvh] w-full">
       

        <Diamond className="absolute -top-10 left-0" />
        <Diamond className="absolute left-[50%] top-0 z-10 -translate-x-1/2" />
        <Diamond className="absolute right-0 top-10" />
      </div> */}
      <HueMove />
      <Container className="relative z-10">
        {/* <HomeHero
          text="Shaping pixels. "
          textB="Shipping solutions."
          paragraph="Hi, I'm Chase. I've been a coder and designer for over a decade. I have a passion for building with effective design. "
          paragraphCTA="Learn more about me and my skillset."
          className="relative z-10"
        /> */}
        <Suspense fallback={<LoadingSkeleton />}>
          <ProjectsList projects={projects} />
        </Suspense>
      </Container>
    </>
  );
}
