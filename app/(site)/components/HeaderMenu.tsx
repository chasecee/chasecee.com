"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPages } from "@/sanity/sanity-utils";
import { ContactModal } from "./ContactModal";

interface Page {
  _id: string;
  title: string;
  slug: string;
}

export default function HeaderMenu() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const pathname = usePathname();
  const activeClass = "active border-b header__item no-underline";
  const inactiveClass =
    "transition-colors inactive border-b dark:hover:text-opacity-50 hover:text-opacity-50";

  useEffect(() => {
    getPages().then(setPages);
  }, []);

  if (!pages)
    return (
      <div className="header__menu flex flex-row gap-5">
        <Link
          className={pathname === "/" ? activeClass : inactiveClass}
          href="/"
        >
          Work
        </Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
    );

  return (
    <div className="header__menu flex flex-row gap-5">
      <Link className={pathname === "/" ? activeClass : inactiveClass} href="/">
        Work
      </Link>
      {pages.map((page) => (
        <Link
          className={pathname === `/${page.slug}` ? activeClass : inactiveClass}
          key={page._id}
          href={`/${page.slug}`}
        >
          {page.title}
        </Link>
      ))}
    </div>
  );
}
