"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Logo from './logo'
import { getPages } from '@/sanity/sanity-utils'

interface Page {
  _id: string;
  title: string;
  slug: string;
  // other fields...
}

export default function Header() {
  const [pages, setPages] = useState<Page[]>([])
  const router = useRouter()

  const activeClass = 'active border-b header__item'
  const inactiveClass = 'transition-colors inactive border-b border-b-transparent dark:hover:border-b-white/50 hover:border-b-neutral-900'

  useEffect(() => {
    const fetchPages = async () => {
      const pagesData = await getPages()
      setPages(pagesData)
    }
    fetchPages()
  }, [])

  return (
    <header className="header py-3 uppercase flex justify-between items-center mb-10 text-sm">
      <div className="header__menu flex flex-row gap-5">
        {pages.map((page) => (
          <Link key={page._id} href={`/${page.slug}`}>
            <a className={router.pathname === `/${page.slug}` ? activeClass : inactiveClass}>
              {page.title}
            </a>
          </Link>
        ))}
      </div>
      <Link className="header__title" href="/">
        <a>
          <div className="sr-only">Chase Cee</div>
          <Logo />
        </a>
      </Link>
    </header>
  )
}
