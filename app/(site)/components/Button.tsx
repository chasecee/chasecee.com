import Link, { LinkProps } from "next/link";
import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  className?: string;
}

const layoutStyles =
  "not-prose inline-flex items-center justify-center gap-x-3 rounded-[.25rem] border-0 px-6 py-3 text-base text-black dark:text-white no-underline shadow-xs transition-colors";

const chromaStyles =
  "ring-[.125rem] ring-black/30 bg-black/5 dark:bg-white/5 dark:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current focus-visible:ring-opacity-60 dark:focus-visible:ring-current dark:focus-visible:ring-opacity-80";

const baseStyles = clsx(layoutStyles, chromaStyles);

const Button = React.forwardRef<HTMLAnchorElement, ButtonProps>(
  ({ href, className = "", target, rel, children, ...rest }, ref) => {
    const computedRel =
      target === "_blank" && !rel ? "noopener noreferrer" : rel;

    return (
      <Link
        ref={ref}
        href={href}
        target={target}
        rel={computedRel}
        className={twMerge(baseStyles, className)}
        {...rest}
      >
        {children}
      </Link>
    );
  },
);

Button.displayName = "Button";

export default Button;
