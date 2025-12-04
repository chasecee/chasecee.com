"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ChaseCeeLogo from "./logo/ChaseCeeLogo";
import Tooltip from "./Tooltip";
import { GithubIcon, LinkedInIcon, ResumeIcon } from "./icons";

export default function Header() {
  const pathname = usePathname();
  const baseClass = "header_item no-underline transition-colors group ";
  const activeClass = "item_active" + " " + baseClass;
  const inactiveClass = "item_inactive" + " " + baseClass;
  const barClass =
    "header_item_bar h-[1px] bg-transparent transition-colors opacity-40";
  return (
    <div className="fixed top-2 right-2 left-2 z-40 md:top-4 md:right-4 md:left-4">
      <header className="header container flex items-center rounded-xl border border-neutral-100/30 bg-neutral-100/10 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-neutral-900/30 dark:bg-neutral-900/20">
        <div className="flex w-1/3 shrink justify-start">
          <Link
            className="header__title group flex flex-row items-center gap-2"
            href="/"
          >
            <div className="sr-only">Chase Cee Logo</div>
            <div className="max-w-[100px]">
              <ChaseCeeLogo />
            </div>
          </Link>
        </div>

        <div className="flex w-1/3 justify-center">
          <div className="header_menu flex flex-row items-center gap-3 sm:gap-5">
            <Link
              href="/"
              className={pathname === "/" ? activeClass : inactiveClass}
            >
              Work<div className={barClass}></div>
            </Link>
            <Link
              href="/about"
              prefetch={false}
              className={pathname === "/about" ? activeClass : inactiveClass}
            >
              About <div className={barClass}></div>
            </Link>
          </div>
        </div>

        <div className="flex w-1/3 shrink justify-end">
          <div className="flex items-center gap-3 pt-px sm:gap-4">
            <Tooltip content="GitHub">
              <Link
                href="https://github.com/chasecee/"
                target="_blank"
                rel="noopener noreferrer"
                className="header_item transition-colors hover:opacity-30"
              >
                <GithubIcon size={20} />
              </Link>
            </Tooltip>
            <Tooltip content="LinkedIn">
              <Link
                href="https://www.linkedin.com/in/chasechristensen-1/"
                target="_blank"
                rel="noopener noreferrer"
                className="header_item transition-colors hover:opacity-30"
              >
                <LinkedInIcon size={20} />
              </Link>
            </Tooltip>
            <Tooltip content="Resume">
              <Link
                href="/ChaseChristensen-Resume-2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="header_item transition-colors hover:opacity-30"
              >
                <ResumeIcon size={20} />
              </Link>
            </Tooltip>
          </div>
        </div>
      </header>
    </div>
  );
}
