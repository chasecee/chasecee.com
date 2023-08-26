import Container from "@/app/(site)/components/Container";
import { Form } from "../components/Form";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Chase Cee",
  description: "Web Designer and Developer",
};

export default function Contact() {
  return (
    <div>
      <Container>
        <div className="prose mx-auto max-w-[46ch] dark:prose-invert">
          <header>
            <h1>Let&apos;s talk.</h1>
            <p className="text-xl">
              New work, feedback, or mentorship? I&apos;m down for all of it.
              Fill out the form, or reach out on my{" "}
              <Link href="https://github.com/chasecee/" target="_blank">
                Github
              </Link>
              , or&nbsp;
              <Link href="https://twitter.com/ChaseCee" target="_blank">
                Twitter
              </Link>
              . Have a nice day!
            </p>
          </header>
          <Form />
        </div>
      </Container>
    </div>
  );
}
