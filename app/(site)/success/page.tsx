import Container from "@/app/(site)/components/Container";
import Link from "next/link";
import CTA from "../components/CTA";
import { Metadata } from "next";
import FishSpline from "../components/splines/FishSpline";
export const metadata: Metadata = {
  title: "Success - Chase Cee",
  description: "Web Designer and Developer",
};

export default function Success() {
  return (
    <div>
      <Container>
        <div className="fixed inset-0">
          <FishSpline />
        </div>
        <div className="prose mx-auto pt-[170rem] dark:prose-invert">
          <header>
            <h1>Success! Your form was sent straight to my inbox.</h1>
          </header>
          {/* <p>
            Can&apos;t wait to chat! Until then, learn more{" "}
            <Link href="/about" title="About me">
              about me
            </Link>
            , or check out my{" "}
            <Link href="/" title="recent chasecee work">
              recent work
            </Link>
            .
          </p> */}
        </div>
        <CTA
          title="Thanks for reaching out. Now what?"
          subtitle="Learn more about me, or check out my projects."
          primaryLink="/"
          secondaryLink="/about"
          outerClass=""
        />
      </Container>
    </div>
  );
}
