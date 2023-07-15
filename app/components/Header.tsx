'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from "next/navigation"
import Logo from './logo';


export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const activeClass = 'active border-b header__item';
  const inactiveClass = 'transition-colors inactive border-b border-b-transparent dark:hover:border-b-white/50 hover:border-b-neutral-900';

  return (
        <header className="header py-3 uppercase flex justify-between items-center mb-10 text-sm">
            <div className="header__menu flex flex-row gap-5">
                <Link className={pathname == "/" ? activeClass : inactiveClass} href="/">
                <div className="">Sites</div>
                </Link>
                <Link className={pathname == "/products" ? activeClass : inactiveClass} href="/products">
                <div className="">Products</div>
                </Link>
                <Link className={pathname == "/about" ? activeClass : inactiveClass} href="/about">
                <div className="">About</div>
                </Link>
            </div>
            <Link className="header__title" href="/">
                <div className="sr-only">Chase Cee</div>
                <Logo />
            </Link>
        </header>
  )
}