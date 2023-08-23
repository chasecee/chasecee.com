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
    "header_item_bar h-[1px] bg-transparent transition-colors opacity-40";

  useEffect(() => {
    getPages().then(setPages);
  }, []);

  return (
    <div className="header_menu flex flex-row gap-4 sm:gap-5">
      <Link href="/" className={pathname === "/" ? activeClass : inactiveClass}>
        Work<div className={barClass}></div>
      </Link>
      <Link
        href="/about"
        className={pathname === "/about" ? activeClass : inactiveClass}
      >
        About <div className={barClass}></div>
      </Link>
      <Link
        href="/contact"
        className={pathname === "/contact" ? activeClass : inactiveClass}
      >
        Contact <div className={barClass}></div>
      </Link>
    </div>
  );
}
