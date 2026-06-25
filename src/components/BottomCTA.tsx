"use client";

import Button from "./Button";
import ArrowsLottie from "./about/ArrowsLottie";
import LucideIcon from "./icons/LucideIcon";
import { LUCIDE_ICONS } from "./icons/lucide";
import { LINKS } from "@/src/constants";

export default function BottomCTA() {
  return (
    <div className="relative my-20 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800/50">
      <div className="relative flex flex-col items-center justify-center gap-20 px-4 py-16 md:flex-row md:text-left">
        <img
          src="/me.webp"
          alt="Chase Christensen profile photo"
          width={500}
          height={500}
          className="m-0 w-40 rounded-full sm:w-60"
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
              href="/#contact"
              target="_self"
              className="group flex items-center gap-2 bg-indigo-600 ring-indigo-300 dark:bg-indigo-500/20 dark:ring-indigo-300/20"
            >
              Let&apos;s talk
              <LucideIcon
                icon={LUCIDE_ICONS.chevronRight}
                size={12}
                className="transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1"
              />
            </Button>
            <Button
              href={LINKS.RESUME}
              target="_blank"
              className="group flex items-center gap-2 border border-neutral-300 bg-transparent text-neutral-700 ring-neutral-300 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:ring-neutral-600/20 dark:hover:bg-neutral-800/50"
            >
              <LucideIcon icon={LUCIDE_ICONS.fileText} size={12} />
              Resume
            </Button>
          </div>
        </div>
        <ArrowsLottie />
      </div>
    </div>
  );
}
