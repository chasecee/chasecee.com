"use client";

import { useEffect, useRef, useState } from "react";
import ChaseCeeLogo from "./logo/ChaseCeeLogo";
import LogoKapowBackground from "./logo/LogoKapowBackground";

export default function HeaderLogo() {
  const logoKapowRef = useRef<HTMLDivElement>(null);
  const explodeTimeoutRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
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
    setIsHovered(false);
    triggerKapowExplode();
  };

  useEffect(() => {
    return () => {
      clearKapowExplodeTimeout();
    };
  }, []);

  return (
    <a
      onClick={handleLogoClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="header__title group flex flex-row items-center gap-2"
      href="/"
    >
      <div className="sr-only">Chase Cee Logo</div>
      <div
        ref={logoKapowRef}
        className="logo-kapow-container relative max-w-[10rem] [--kapow-offset-x:0px] [--kapow-offset-y:2.5%] before:absolute before:-inset-x-[18px] before:-inset-y-[15px] before:content-['']"
      >
        <div
          aria-hidden
          className="logo-bulge pointer-events-none absolute -inset-[1rem] z-[-1] rounded-[1rem] border-site border-solid border-neutral-500/50 [transform:skew(-7deg,-6deg)] dark:border-neutral-600"
        />
        <div className="logo-wordmark relative z-10 -m-[1rem] rounded-[1rem] border-site border-transparent bg-neutral-50 bg-clip-padding p-1.5 [transform:skew(-7deg,-6deg)] dark:bg-neutral-900">
          <ChaseCeeLogo active={isHovered} />
          <LogoKapowBackground />
        </div>
      </div>
    </a>
  );
}
