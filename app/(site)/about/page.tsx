import Container from "@/app/(site)/components/Container";
import { Metadata } from "next";
import Skills from "../components/Skills";
import ArrowsLottie from "./ArrowsLottie";
import ProfilePic from "./ProfilePic";

export const metadata: Metadata = {
  title: "About - Chase Cee",
  description: "Web Designer and Developer",
};

export default function Contact() {
  return (
    <Container>
      <div className="size-full overflow-hidden">
        <div className="prose dark:prose-invert mx-auto mt-10">
          <div className="relative mb-10 flex w-full flex-col justify-between sm:flex-row sm:items-center">
            <ProfilePic />
            <div className="hidden">
              <ArrowsLottie />
            </div>

            <h1 className="relative z-20 m-0 mb-0 text-[13vw] sm:text-[2.9rem] md:text-[3.3rem]">
              Hard worker. <br /> Fast learner.
            </h1>
          </div>

          <p className="text-xl">
            I&apos;m Chase, a designer and developer based in Salt Lake City,
            Utah.
          </p>

          <p>
            I build online experiences front to back. Effective design should be
            driven by powerful, elegant applications. Magic happens when these
            are unified under a single, beautiful brand.
          </p>
          <p>
            From nationwide organizations to growing businesses, I have the
            experience and skillset guaranteed to deliver results. I&apos;m a
            front-end fanatic with a love for blending design and code into a
            platform that helps clients achieve their goals.
          </p>
          <h2>My Skillset</h2>
          <p>
            Working freelance as a designer and developer for several years
            taught me to adapt and learn based off the client mandate. Over the
            years I&apos;ve done just about everything, and learned a lot along
            the way.
          </p>
          <Skills />
          <p>
            I&apos;m constantly researching and evolving, whether it be for code
            best practices or keeping at the cutting edge of design trends.
          </p>
          <p>
            Overall, I just love to build things. I love learning and tackling
            new challenges. I&apos;m always open to talk about new
            opportunities! Let&apos;s get started on your next big idea.
          </p>
        </div>
      </div>
    </Container>
  );
}
