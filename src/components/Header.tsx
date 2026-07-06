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
    <div className="fixed top-2 right-2 left-2 z-40 md:top-4 md:right-4 md:left-4">
      <header className="header container flex items-center rounded-xl border border-neutral-100/30 bg-neutral-100/10 px-4 py-2 backdrop-blur-md sm:px-6 dark:border-neutral-900/30 dark:bg-neutral-900/20">
        <div className="flex w-1/3 shrink justify-start">
          <a
            onClick={handleLogoClick}
            className="header__title group flex flex-row items-center gap-2"
            href="/"
          >
            <div className="sr-only">Chase Cee Logo</div>
            <div
              ref={logoKapowRef}
              className="logo-kapow-container relative isolate max-w-[100px]"
            >
              <LogoKapowBackground />
              <div className="logo-wordmark relative z-10">
                <ChaseCeeLogo />
              </div>
            </div>
          </a>
        </div>

        <div className="flex w-1/3 justify-center">
          <div className="header_menu flex flex-row items-center gap-3 sm:gap-5 md:gap-10">
            <a
              href="/"
              className={activePath === "/" ? activeClass : inactiveClass}
            >
              Work<div className={barClass}></div>
            </a>
            <a
              href="/about"
              className={activePath === "/about" ? activeClass : inactiveClass}
            >
              About <div className={barClass}></div>
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
                <LucideIcon icon={LUCIDE_ICONS.fileText} size={16} />
              </a>
            </Tooltip>
          </div>
        </div>
      </header>
    </div>
  );
}
