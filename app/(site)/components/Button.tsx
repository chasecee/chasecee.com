import Link from "next/link";
import React from "react";

interface CustomLinkButtonProps {
  href: string;
  target: string;
  className?: string;
  children: React.ReactNode;
}

const CustomLinkButton: React.FC<CustomLinkButtonProps> = ({
  href,
  target,
  className,
  children,
}) => {
  return (
    <Link
      href={href}
      target={target}
      className={`not-prose inline-flex items-center justify-center gap-x-3 rounded-xl border px-5 py-3 text-base text-white no-underline shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${className}`}
    >
      {children}
      {/* {Icon && <Icon size={32} />} */}
    </Link>
  );
};

export default CustomLinkButton;
