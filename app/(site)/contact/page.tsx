import Container from "@/app/(site)/components/Container";
import { Metadata } from "next";
import WavyLine from "../components/WavyLineDynamic";
import Button from "../components/Button";
import { GithubIcon, LinkedInIcon } from "../components/icons";
export const metadata: Metadata = {
  title: "Contact - Chase Cee",
  description: "Web Designer and Developer",
};
export default function Contact() {
  return (
    <Container>
      <main>
        <div className="prose dark:prose-invert mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-center">
            <h1 className="mb-0 text-[13vw] whitespace-nowrap sm:text-[2.9rem] md:text-[3.3rem]">
              Let&apos;s talk
            </h1>
            <WavyLine />
          </div>
          <div className="m-0 mt-2 text-xl">
            <div className="m-0 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <Button href="https://github.com/chasecee/" target="_blank">
                Github
                <GithubIcon size={24} />
              </Button>

              <Button
                href="https://www.linkedin.com/in/chasechristensen-1/"
                target="_blank"
              >
                LinkedIn
                <LinkedInIcon size={24} />
              </Button>
              <Button href="/ChaseChristensen-Resume-2025.pdf" target="_blank">
                Resume
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </Container>
  );
}
