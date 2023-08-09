"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPages } from "@/sanity/sanity-utils";

interface Page {
  _id: string;
  title: string;
  slug: string;
}

export default function HeaderMenu() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const pathname = usePathname();
  const baseClass = "header_item no-underline transition-colors group ";
  const activeClass = "item_active" + " " + baseClass;
  const inactiveClass = "item_inactive" + " " + baseClass;
  const barClass =
    "header_item_bar h-px bg-transparent transition-colors duration-1000 opacity-40";

  useEffect(() => {
    getPages().then(setPages);
  }, []);

  if (!pages)
    return (
      <div className="header_menu flex flex-row gap-5">
        <Link href="/" className={baseClass}>
          Work<div className={barClass}></div>
        </Link>
        <Link href="/about" className={baseClass}>
          About <div className={barClass}></div>
        </Link>
        <Link href="/contact" className={baseClass}>
          Contact <div className={barClass}></div>
        </Link>
      </div>
    );

  return (
    <div className="header_menu flex flex-row gap-5">
      {/* <Cursor /> */}
      <Link className={pathname === "/" ? activeClass : inactiveClass} href="/">
        Work
        <div className={barClass}></div>
      </Link>
      {pages.map((page) => (
        <Link
          className={pathname === `/${page.slug}` ? activeClass : inactiveClass}
          key={page._id}
          href={`/${page.slug}`}
        >
          {page.title}
          <div className={barClass}></div>
        </Link>
      ))}
    </div>
  );
}
