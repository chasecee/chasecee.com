import { getPages } from '@/sanity/sanity-utils';
import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});
const bodyClass = ' w-full min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-normal';

export const metadata: Metadata = {
  title: 'Chase Cee - Work',
  description: 'Web Designer and Developer',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="en">
      <body className={dmSans.className + bodyClass}>{children}</body>
    </html>
  )
}
