import React from "react";
import HeaderMenu from "./components/HeaderMenu";
import LogoDelay from "./components/logo/logo";
import Link from "next/link";
import { BulbOutlineIcon, BulbFilledIcon, SunIcon } from "@sanity/icons";
export default function Loading() {
  return (
    <div className="fixed left-2 right-2 top-2 z-40 md:left-4 md:right-4 md:top-4">
      <header className="header container flex items-center justify-between rounded-full border border-neutral-100/30 bg-neutral-100/30 px-4 py-4 backdrop-blur-md dark:border-neutral-900/30 dark:bg-neutral-900/30 sm:px-6">
        <div className="flex flex-row gap-4">
          <Link
            className="header__title group flex flex-row items-center gap-2"
            href="/"
          >
            {/* <div className="h-6 w-6">
              <JacksLogo />
            </div> */}
            <div className="relative h-6 w-6 text-[1.5rem]">
              <div className="spin-animation relative top-[0.7rem] opacity-70">
                <SunIcon className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 text-[2.4rem] text-yellow-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <BulbFilledIcon
                className="absolute inset-0 text-yellow-500 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  filter: `drop-shadow(-1px 0px 16px yellow)`,
                }}
              />
              <BulbOutlineIcon className="absolute inset-0 opacity-100 group-hover:opacity-100" />
            </div>
            <div className="sr-only">Chase Cee Logo</div>
            {/* <LogoDelay /> */}
            <span className="">Chase Cee</span>
          </Link>

          <span className="hidden opacity-40 sm:block">
            &#47;&#47; Develop and Design
          </span>
        </div>
        <HeaderMenu />
      </header>
    </div>
  );
}
