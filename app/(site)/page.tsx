import { getProjects } from "@/sanity/sanity-utils";
import Container from "./components/Container";
import HomeHero from "./components/hero/HomeHero";
import ProjectsList from "./components/ProjectsList";

export default async function Home() {
  const projects = await getProjects();
  return (
    <Container>
      <HomeHero
        text="Shaping pixels. "
        textB="Shipping solutions."
        paragraph="Hi, I'm Chase. I've been a coder and designer for over a decade. I have a passion for building with effective design. "
        paragraphCTA="Learn more about me and my skillset."
      />
      <ProjectsList projects={projects} />
    </Container>
  );
}
