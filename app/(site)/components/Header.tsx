import Link from 'next/link'
import Logo from './logo'
import { getPages } from '@/sanity/sanity-utils'

interface Page {
  _id: string;
  title: string;
  slug: string;
  // other fields...
}

export default async function Header() {

    const pages = await getPages();
  const activeClass = 'active border-b header__item'
  const inactiveClass = 'transition-colors inactive border-b border-b-transparent dark:hover:border-b-white/50 hover:border-b-neutral-900'


  return (
    <header className="header py-4 uppercase flex justify-between items-center mb-10 text-sm">
      <div className="header__menu flex flex-row gap-5">
        <Link className="header__title" href="/">
            Work
        </Link>
        {pages.map((page) => (
          <Link key={page._id} href={`/${page.slug}`}>
              {page.title}
          </Link>
        ))}
      </div>
      <Link className="header__title" href="/">
          <div className="sr-only">Chase Cee</div>
          <Logo />
      </Link>
    </header>
  )
}
