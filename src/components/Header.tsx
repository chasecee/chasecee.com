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
  const logoKapowRectRef = useRef<DOMRect | null>(null);
  const pointerClientRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const lastOffsetRef = useRef({ x: 0, y: 0 });
  const baseClass = "header_item no-underline transition-colors group ";
  const activeClass = "item_active" + " " + baseClass;
  const inactiveClass = "item_inactive" + " " + baseClass;
  const barClass =
    "header_item_bar h-[1px] bg-transparent transition-colors opacity-40";
  const flushKapowPointer = () => {
    const target = logoKapowRef.current;
    const rect = logoKapowRectRef.current;
    if (!target || !rect) return;

    const rawX = pointerClientRef.current.x - rect.left - rect.width / 2;
    const rawY = pointerClientRef.current.y - rect.top - rect.height / 2;
    const clampedX = Math.max(Math.min(rawX, rect.width / 2), -rect.width / 2);
    const clampedY = Math.max(Math.min(rawY, rect.height / 2), -rect.height / 2);
    const quantizedX = Math.round(clampedX * 10) / 10;
    const quantizedY = Math.round(clampedY * 10) / 10;

    if (lastOffsetRef.current.x !== quantizedX) {
      target.style.setProperty("--kapow-offset-x", `${quantizedX.toFixed(1)}px`);
      lastOffsetRef.current.x = quantizedX;
    }
    if (lastOffsetRef.current.y !== quantizedY) {
      target.style.setProperty("--kapow-offset-y", `${quantizedY.toFixed(1)}px`);
      lastOffsetRef.current.y = quantizedY;
    }
    rafIdRef.current = null;
  };
  const scheduleKapowPointerFlush = () => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(flushKapowPointer);
  };
  const handleKapowPointerEnter = () => {
    const target = logoKapowRef.current;
    if (!target) return;
    logoKapowRectRef.current = target.getBoundingClientRect();
  };
  const handleKapowPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerClientRef.current.x = event.clientX;
    pointerClientRef.current.y = event.clientY;
    scheduleKapowPointerFlush();
  };
  const handleKapowPointerLeave = () => {
    const target = logoKapowRef.current;
    if (!target) return;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    logoKapowRectRef.current = null;
    lastOffsetRef.current = { x: 0, y: 0 };
    target.style.setProperty("--kapow-offset-x", "0px");
    target.style.setProperty("--kapow-offset-y", "0px");
  };
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-2 right-2 left-2 z-40 md:top-4 md:right-4 md:left-4">
      <header className="header container flex items-center rounded-xl border border-neutral-100/30 bg-neutral-100/10 px-4 py-2 backdrop-blur-md sm:px-6 dark:border-neutral-900/30 dark:bg-neutral-900/20">
        <div className="flex w-1/3 shrink justify-start">
          <a
            className="header__title group flex flex-row items-center gap-2"
            href="/"
          >
            <div className="sr-only">Chase Cee Logo</div>
            <div
              ref={logoKapowRef}
              onPointerEnter={handleKapowPointerEnter}
              onPointerMove={handleKapowPointerMove}
              onPointerLeave={handleKapowPointerLeave}
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
          <div className="header_menu flex flex-row items-center gap-3 sm:gap-5">
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
