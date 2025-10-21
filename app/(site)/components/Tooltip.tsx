"use client";
import { useState } from "react";
import { LinkOutIcon } from "./icons";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export default function Tooltip({
  children,
  content,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      <div
        className={`absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md bg-neutral-100 px-2 py-1 text-xs whitespace-nowrap text-neutral-900 shadow-lg transition-all duration-200 dark:bg-neutral-900 dark:text-white ${
          isVisible
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
        role="tooltip"
        aria-live="polite"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <div className="flex items-center gap-1">
          <span>{content}</span>
          <LinkOutIcon size={12} />
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-100 dark:border-t-neutral-900" />
      </div>
    </div>
  );
}
