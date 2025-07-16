import Link, { LinkProps } from "next/link";
import React from "react";
interface ButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  className?: string;
}

const layoutStyles =
  "not-prose inline-flex items-center justify-center gap-x-3 rounded-[.25rem] border-0 px-6 py-2 text-base text-black dark:text-white no-underline shadow-xs transition-colors";

const chromaStyles =
  "ring-[.125rem] ring-black/50 dark:ring-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current focus-visible:ring-opacity-60 dark:focus-visible:ring-current dark:focus-visible:ring-opacity-80";

const baseStyles = `${layoutStyles} ${chromaStyles}`;

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
        className={`${baseStyles} ${className}`}
        {...rest}
      >
        {children}
      </Link>
    );
  },
);

Button.displayName = "Button";

export default Button;
