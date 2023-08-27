import Container from "@/app/(site)/components/Container";
import { Form } from "../components/Form";
import Link from "next/link";
import { Metadata } from "next";
import Skills from "../components/Skills";
import Image from "next/image";
import urlFor from "@/sanity/sanity.image";
import Arrows from "./Arrows";
import profilePic from "@/public/me.jpeg";
import ArrowsLottie from "./ArrowsLottie";

export const metadata: Metadata = {
  title: "About - Chase Cee",
  description: "Web Designer and Developer",
};
const alt = "alt text";

export default function Contact() {
  return (
    <Container className="overflow-visible">
      {/* <Arrows /> */}
      <div className="prose mx-auto mt-6 dark:prose-invert">
        <div className="relative mb-10 flex w-full flex-col justify-between sm:flex-row sm:items-center">
          <div className="group relative w-2/3 max-w-[260px] sm:w-1/4">
            <Image
              src={profilePic}
              alt={alt}
              width={500}
              height={500}
              className="m-0 w-full rounded-full"
            />
            <div className="absolute -inset-6  animate-[spin_5s_linear_infinite] rounded-full opacity-0 transition-opacity group-hover:opacity-100">
              <div className="border-animation h-full rounded-full"></div>
            </div>
          </div>
          <div className="w-30rem relative -top-[50px] left-[8rem] z-10  rotate-[-65deg] scale-x-[-100%] scale-y-[100%] self-start sm:-left-[2rem] sm:bottom-0 sm:top-0 sm:rotate-[-25deg] sm:scale-100 sm:self-end">
            <ArrowsLottie />
          </div>
          <h1 className="xs:text-red relative z-20 m-0 text-[13vw] sm:text-[2.9rem] md:text-[3.3rem]">
            Hard worker. <br /> Fast learner.
          </h1>
        </div>

        <p className="text-xl">
          I&apos;m Chase, a designer and developer living in Salt Lake City,
          Utah.
        </p>

        <p>
          I build online experiences front to back. Effective design should be
          driven by powerful, elegant applications. Magic happens when these are
          unified under a single, beautiful brand.
        </p>
        <p>
          From nationwide organizations to growing businesses, I have the
          experience and skillset guaranteed to deliver results. I&apos;m a
          front-end fanatic with a love for blending design and code into a
          platform that helps clients achieve their goals.
        </p>
        <h2>My Skillset</h2>
        <p>
          Working freelance as a designer and developer for several years taught
          me to adapt and learn based off the client mandate. Over the years
          I&apos;ve done just about everything, and learned a lot along the way.
        </p>
        <Skills />
        <p>
          I&apos;m constantly researching and evolving, whether it be for code
          best practices or keeping at the cutting edge of design trends.
        </p>
        <p>
          Overall, I just love to build things. I love learning and tackling new
          challenges. I&apos;m always open to talk about new opportunities!
          Let&apos;s get started on your next big idea.
        </p>
      </div>
    </Container>
  );
}
