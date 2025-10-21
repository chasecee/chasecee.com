import React from "react";
import ChaseCeeLogo from "./components/logo/ChaseCeeLogo";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="fixed top-2 right-2 left-2 z-40 md:top-4 md:right-4 md:left-4">
      <header className="header container flex items-center rounded-xl border border-neutral-100/30 bg-neutral-100/30 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-neutral-900/30 dark:bg-neutral-900/30">
        <div className="flex w-1/3 justify-start">
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
          <div className="header_menu flex flex-row items-center gap-4 sm:gap-5">
            <Link
              href="/"
              className="header_item group item_active no-underline transition-colors"
            >
              Work
              <div className="header_item_bar h-[1px] bg-transparent opacity-40 transition-colors"></div>
            </Link>
            <Link
              href="/about"
              prefetch={false}
              className="header_item group item_inactive no-underline transition-colors"
            >
              About{" "}
              <div className="header_item_bar h-[1px] bg-transparent opacity-40 transition-colors"></div>
            </Link>
          </div>
        </div>

        <div className="flex w-1/3 justify-end">
          <div className="flex items-center gap-4 pt-[1px]">
            <div className="h-5 w-5 animate-pulse rounded-sm bg-neutral-300 dark:bg-neutral-600"></div>
            <div className="h-5 w-5 animate-pulse rounded-sm bg-neutral-300 dark:bg-neutral-600"></div>
            <div className="h-5 w-5 animate-pulse rounded-sm bg-neutral-300 dark:bg-neutral-600"></div>
          </div>
        </div>
      </header>
    </div>
  );
}
