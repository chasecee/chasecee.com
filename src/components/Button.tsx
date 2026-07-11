import React from "react";
import type { ButtonProps } from "@/types/UI";

const layoutStyles =
  "not-prose inline-flex items-center justify-center gap-x-3 rounded-[.5rem] border-0 px-6 py-3 text-base text-black dark:text-white no-underline shadow-xs transition-colors";

const chromaStyles =
  "ring-2 ring-black/30 bg-black/5 dark:bg-white/5 dark:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current focus-visible:ring-opacity-60 dark:focus-visible:ring-current dark:focus-visible:ring-opacity-80";

const baseStyles = `${layoutStyles} ${chromaStyles}`;

const Button = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  ButtonProps
>(({ href, className = "", target, rel, type, children, ...rest }, ref) => {
  const classes = className ? `${baseStyles} ${className}` : baseStyles;

  if (href) {
    const computedRel =
      target === "_blank" && !rel ? "noopener noreferrer" : rel;

    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={computedRel}
        className={classes}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type ?? "button"}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
