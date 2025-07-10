import Link from "next/link";
import HeaderMenu from "./HeaderMenu";
import ChaseCeeLogo from "./logo/ChaseCeeLogo";
export default function Header() {
  return (
    <div className="fixed top-2 right-2 left-2 z-40 md:top-4 md:right-4 md:left-4">
      <header className="header container flex items-center justify-between rounded-xl border border-neutral-100/30 bg-neutral-100/30 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-neutral-900/30 dark:bg-neutral-900/30">
        <div className="flex flex-row items-center gap-8">
          <Link
            className="header__title group flex flex-row items-center gap-2"
            href="/"
          >
            <div className="sr-only">Chase Cee Logo</div>
            <div className="max-w-[120px]">
              <ChaseCeeLogo />
            </div>
          </Link>

          <span className="hidden opacity-40 sm:inline-block">
            Code & Design
          </span>
        </div>
        <HeaderMenu />
      </header>
    </div>
  );
}
