// Bottom CTA teaser component
"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Button from "./Button";
import { UI, LINKS } from "../constants";
import profilePic from "@/public/me.webp";

const ArrowsLottie = dynamic(() => import("../about/ArrowsLottie"), {
  ssr: false,
  loading: () => null,
});

export default function BottomCTA() {
  return (
    <div className="relative my-20 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
      {/* <div
        className="absolute inset-0 bg-repeat opacity-20"
        style={{
          backgroundImage: `url('/noise1.webp')`,
          backgroundSize: `${UI.NOISE_SIZE}px`,
        }}
      /> */}
      <div className="relative flex flex-col items-center justify-center gap-20 px-4 py-16 md:flex-row md:text-left">
        <Image
          src={profilePic}
          alt="Chase Christensen profile photo"
          width={500}
          height={500}
          className="m-0 w-40 rounded-full sm:w-60"
          priority
        />
        <div className="flex flex-col items-center justify-center gap-8 md:items-start">
          <div className="prose dark:prose-invert md:max-w-[400px]">
            <p className="m-0 text-2xl leading-tight font-semibold">
              Performance by design.
            </p>
            <p className="mt-2 text-lg leading-relaxed">
              A decade shipping scalable products with a focus on performance.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button
              href="/contact"
              target="_self"
              className="group flex items-center gap-2 bg-indigo-600 ring-indigo-300 dark:bg-indigo-500/20 dark:ring-indigo-300/20"
            >
              Let&apos;s talk
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
            <Button
              href={LINKS.RESUME}
              target="_blank"
              className="group flex items-center gap-2 border border-neutral-300 bg-transparent text-neutral-700 ring-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:ring-neutral-600/20 dark:hover:bg-neutral-800/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
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
              Resume
            </Button>
          </div>
        </div>
        <ArrowsLottie />
      </div>
    </div>
  );
}
