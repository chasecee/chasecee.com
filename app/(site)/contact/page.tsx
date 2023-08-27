import Container from "@/app/(site)/components/Container";
import { Form } from "../components/Form";
import Link from "next/link";
import { Metadata } from "next";
import { FaGithub, FaTwitter } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Contact - Chase Cee",
  description: "Web Designer and Developer",
};

export default function Contact() {
  return (
    <div>
      <Container>
        <div className="prose mx-auto dark:prose-invert">
          <header>
            <h1>Let&apos;s talk.</h1>
            <p className="text-xl">
              New work, feedback, or mentorship? I&apos;m down for all of it.
              <div className="my-5 flex flex-row gap-5">
                <Link href="https://github.com/chasecee/" target="_blank">
                  <span className="sr-only">Github</span> <FaGithub size={48} />
                </Link>
                <Link href="https://twitter.com/ChaseCee" target="_blank">
                  <span className="sr-only">Twitter</span>{" "}
                  <FaTwitter size={48} />
                </Link>
              </div>
            </p>
          </header>
          {/* <Form /> */}
        </div>
      </Container>
    </div>
  );
}
