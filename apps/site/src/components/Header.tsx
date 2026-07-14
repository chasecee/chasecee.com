"use client";

import { useEffect, useRef } from "react";
import ChaseCeeLogo from "./logo/ChaseCeeLogo";
import LogoKapowBackground from "./logo/LogoKapowBackground";
import Tooltip from "./Tooltip";
import LucideIcon from "./icons/LucideIcon";
import { GithubIcon, LinkedInIcon } from "./icons";
import { LUCIDE_ICONS } from "./icons/lucide";

interface HeaderProps {
  activePath: string;
}

export default function Header({ activePath }: HeaderProps) {
  const logoKapowRef = useRef<HTMLDivElement>(null);
  const explodeTimeoutRef = useRef<number | null>(null);
  const normalizedActivePath =
    activePath !== "/" && activePath.endsWith("/")
      ? activePath.slice(0, -1)
      : activePath;
  const isMusicPath =
    normalizedActivePath === "/music" ||
    normalizedActivePath.startsWith("/music/");
  const baseClass = "header_item no-underline transition-colors group ";
  const activeClass = "item_active" + " " + baseClass;
  const inactiveClass = "item_inactive" + " " + baseClass;
  const barClass =
    "header_item_bar h-[1px] bg-transparent transition-colors opacity-40";
  const KAPOW_EXPLODE_DURATION_MS = 440;
  const clearKapowExplodeTimeout = () => {
    if (explodeTimeoutRef.current === null) return;
    window.clearTimeout(explodeTimeoutRef.current);
    explodeTimeoutRef.current = null;
  };
  const triggerKapowExplode = () => {
    const target = logoKapowRef.current;
    if (!target) return;
    clearKapowExplodeTimeout();
    target.classList.remove("logo-kapow-exploding");
    void target.offsetWidth;
    target.classList.add("logo-kapow-exploding");
    explodeTimeoutRef.current = window.setTimeout(() => {
      const activeTarget = logoKapowRef.current;
      if (activeTarget) {
        activeTarget.classList.remove("logo-kapow-exploding");
      }
      explodeTimeoutRef.current = null;
    }, KAPOW_EXPLODE_DURATION_MS);
  };
  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    triggerKapowExplode();
  };
  useEffect(() => {
    return () => {
      clearKapowExplodeTimeout();
    };
  }, []);

  return (
    <div className="sticky top-2 inset-x-0 z-40 md:top-4">
      <header className="header container h-(--header-height) flex items-center rounded-xl border-site border-neutral-500/50 bg-neutral-50 py-2 dark:border-neutral-600 dark:bg-neutral-900">
        <div className="flex w-1/3 shrink justify-start">
          <a
            onClick={handleLogoClick}
            className="header__title group flex flex-row items-center gap-2"
            href="/"
          >
            <div className="sr-only">Chase Cee Logo</div>
            <div
              ref={logoKapowRef}
              className="logo-kapow-container relative max-w-[8rem] [--kapow-offset-x:0px] [--kapow-offset-y:2.5%] before:absolute before:-inset-x-[18px] before:-inset-y-[15px] before:content-['']"
            >
              <div
                aria-hidden
                className="logo-bulge pointer-events-none absolute -inset-[1rem] z-[-1] rounded-[1rem] border-site border-solid border-neutral-500/50 [transform:skew(-7deg,-6deg)] dark:border-neutral-600"
              />
              <div className="logo-wordmark relative z-10 -m-[1rem] rounded-[1rem] border-site border-transparent bg-neutral-50 bg-clip-padding p-2 [transform:skew(-7deg,-6deg)] dark:bg-neutral-900">
                <ChaseCeeLogo />
                <LogoKapowBackground />
              </div>
            </div>
          </a>
        </div>

        <div className="flex w-1/3 justify-center">
          <div className="header_menu flex flex-row items-center gap-3 sm:gap-5 md:gap-10">
            <a
              href="/"
              className={normalizedActivePath === "/" ? activeClass : inactiveClass}
            >
              Work<div className={barClass}></div>
            </a>
            <a
              href="/about"
              className={
                normalizedActivePath === "/about" ? activeClass : inactiveClass
              }
            >
              About <div className={barClass}></div>
            </a>
            <a href="/music" className={isMusicPath ? activeClass : inactiveClass}>
              Music <div className={barClass}></div>
            </a>
          </div>
        </div>

        <div className="flex w-1/3 shrink justify-end">
          <div className="flex items-center gap-3 pt-px sm:gap-4">
            <Tooltip content="GitHub">
              <a
                href="https://github.com/chasecee/"
                target="_blank"
                rel="noopener noreferrer"
                className="header_item transition-colors hover:opacity-30"
              >
                <span className="sr-only">GitHub</span>
                <GithubIcon size={16} />
              </a>
            </Tooltip>
            <Tooltip content="LinkedIn">
              <a
                href="https://www.linkedin.com/in/chasechristensen-1/"
                target="_blank"
                rel="noopener noreferrer"
                className="header_item transition-colors hover:opacity-30"
              >
                <span className="sr-only">LinkedIn</span>
                <LinkedInIcon size={16} />
              </a>
            </Tooltip>
            <Tooltip content="Resume">
              <a
                href="/ChaseChristensen-Resume-2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="header_item transition-colors hover:opacity-30 flex"
              >
                <span className="sr-only">Resume</span>
                <LucideIcon icon={LUCIDE_ICONS.fileText} size={16} />
              </a>
            </Tooltip>
          </div>
        </div>
      </header>
    </div>
  );
}
