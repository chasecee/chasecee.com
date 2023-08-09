import { HeartFilledIcon } from "@sanity/icons";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer mt-10 py-10">
      <p className="footer__text text-uppercase group prose flex flex-row items-center gap-[0.5ch] dark:prose-invert">
        Made with{" "}
        <HeartFilledIcon className="fill-current text-2xl transition group-hover:scale-125 group-hover:text-red-400" />
        by
        <Link href="/about" className="">
          Chase Cee
        </Link>
      </p>
    </footer>
  );
}
