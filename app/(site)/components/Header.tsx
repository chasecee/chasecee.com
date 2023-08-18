import Link from "next/link";
import LogoDelay from "./logo/logo";
import HeaderMenu from "./HeaderMenu";
import Breakpoints from "./Breakpoints";

export default function Header() {
  return (
    <div className="fixed left-2 right-2 top-2 z-40 md:left-4 md:right-4 md:top-4">
      <header className="header container flex items-center justify-between rounded-full border border-neutral-100/30 bg-neutral-100/30 px-6 py-4 backdrop-blur-md dark:border-neutral-900/30 dark:bg-neutral-900/30">
        <Breakpoints />

        <HeaderMenu />
        <Link className="header__title" href="/">
          <div className="sr-only">Chase Cee Logo</div>
          {/* <LogoDelay /> */}
          <span className="">Chase Cee</span>
        </Link>
      </header>
    </div>
  );
}
