import Link from "next/link";
import LogoDelay from "./logo/logo";
import HeaderMenu from "./HeaderMenu";
import Breakpoints from "./Breakpoints";

export default function Header() {
  return (
    <div className="fixed left-0 right-0 top-4 z-40">
      <header className="header container mb-10 flex items-center justify-between rounded-xl border border-[#FFFFFF]/[0.16] bg-neutral-900/30 px-6 py-4 backdrop-blur-md">
        {/* <Breakpoints /> */}

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
