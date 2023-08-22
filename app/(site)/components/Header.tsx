import Link from "next/link";
import LogoDelay from "./logo/logo";
import HeaderMenu from "./HeaderMenu";
import Breakpoints from "./Breakpoints";
import JacksLogo from "./logo/JacksLogo";
import { BulbOutlineIcon, BulbFilledIcon } from "@sanity/icons";
export default function Header() {
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
