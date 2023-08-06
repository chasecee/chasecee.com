import React from "react";
import { PortableText } from "@portabletext/react";
import { LaunchIcon } from "@sanity/icons";

const components = {
  marks: {
    internalLink: ({ value, children }) => {
      const { slug, refType } = value;
      let href;
      switch (refType) {
        case "project":
          href = slug ? `/projects/${slug}` : "#";
          break;
        case "page":
          href = slug ? `/${slug}` : "#";
          break;
        default:
          href = "#";
      }
      return <a href={href}>{children}</a>;
    },
    link: ({ value, children }) => {
      // Read https://css-tricks.com/use-target_blank/
      const { blank, href } = value;
      return blank ? (
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="link_external group inline-flex items-center gap-1"
        >
          {children}
          <LaunchIcon className="group-hover:scale-125" />
        </a>
      ) : (
        <a href={href}>{children}</a>
      );
    },
  },
};

export const Body = ({ value }) => {
  return <PortableText value={value} components={components} />;
};
