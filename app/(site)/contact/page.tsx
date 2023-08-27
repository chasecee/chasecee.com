import Container from "@/app/(site)/components/Container";
import { Form } from "../components/Form";
import Link from "next/link";
import { Metadata } from "next";
import { FaFilePdf, FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import WavyLine from "../components/WavyLine";
import Button from "../components/Button";
export const metadata: Metadata = {
  title: "Contact - Chase Cee",
  description: "Web Designer and Developer",
};
const size = 24;
export default function Contact() {
  return (
    <Container>
      <main>
        <div className="prose mx-auto flex flex-col gap-10 dark:prose-invert">
          <h1 className="mb-0 text-[13vw] sm:text-[2.9rem] md:text-[3.3rem]">
            Let&apos;s talk.
          </h1>
          <WavyLine />
          <p className="m-0 mt-2 text-xl">
            <div className="m-0 flex flex-col gap-5 sm:flex-row">
              <Button href="https://github.com/chasecee/" target="_blank">
                Github
                <FaGithub size={size} />
              </Button>
              <Button href="https://twitter.com/ChaseCee/" target="_blank">
                Twitter
                <FaTwitter size={size} />
              </Button>
              <Button
                href="https://www.linkedin.com/in/chasechristensen-1/"
                target="_blank"
              >
                LinkedIn
                <FaLinkedin size={size} />
              </Button>
              <Button href="/Chase-Christensen-Resume-2023.pdf" target="_blank">
                Resume
                <FaFilePdf size={size} />
              </Button>
            </div>
          </p>
        </div>
      </main>
    </Container>
  );
}
