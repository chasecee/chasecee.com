import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import Script from "next/script";

const font = DM_Sans({
  subsets: ["latin"],
  style: ["normal"],
  display: "swap",
});
const bodyClass =
  " w-full min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white";

export const metadata: Metadata = {
  metadataBase: new URL("https://chasecee.com"),
  title: "Work - Chase Cee",
  description: "Building excellent products front to back.",
  icons: {
    icon: "/icons/site/favicon.ico",
    shortcut: "/icons/site/favicon-96x96.png",
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
      <body className={font.className + bodyClass}>
        {children}
        {/* Defer Vercel analytics and performance scripts until after hydration */}
        <Script strategy="afterInteractive" src="/_vercel/insights/script.js" />
        <Script
          strategy="afterInteractive"
          src="/_vercel/speed-insights/script.js"
        />
      </body>
    </html>
  );
}
