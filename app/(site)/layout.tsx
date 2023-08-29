import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";

// const font = DM_Sans({
//   weight: ["400", "700"],
//   style: ["normal", "italic"],
//   subsets: ["latin"],
// });
const font = Inter({
  subsets: ["latin"],
  style: ["normal"],
  display: "swap",
});
const bodyClass =
  " w-full min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white";

export const metadata: Metadata = {
  title: "Work - Chase Cee",
  description: "Web Designer and Developer",
  icons: {
    icon: "/icons/site/favicon.ico",
    shortcut: "/icons/site/favicon-32x32.png",
    apple: "/icons/site/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className + bodyClass}>{children}</body>
    </html>
  );
}
