import React from "react";
import type { ButtonProps } from "@/types/UI";

const layoutStyles =
  "not-prose inline-flex items-center justify-center gap-x-3 rounded-[.5rem] border-0 px-6 py-3 text-base text-black dark:text-white no-underline shadow-xs transition-colors";

// `ring-opacity-*` was removed in Tailwind v4 (the slash syntax replaced it),
// so the old focus ring silently rendered at full opacity with no offset color.
const chromaStyles =
  "ring-2 ring-black/30 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 dark:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 dark:focus-visible:ring-current/80 dark:focus-visible:ring-offset-neutral-900";

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
