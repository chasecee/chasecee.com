import Link from "next/link";
import LogoDelay from "./logo/logo";
import HeaderMenu from "./HeaderMenu";

export default function Header() {
  return (
    <header className="header mb-10 flex items-center justify-between py-4 text-sm">
      <HeaderMenu />
      <Link className="header__title" href="/">
        <div className="sr-only">Chase Cee Logo</div>
        <LogoDelay />
      </Link>
    </header>
  );
}
