import { PortableTextBlock } from "sanity";

export type CodeField = {
  _type: string;
  language: string;
  highlightedLines: number[];
  code: string;
  filename: string;
};

export type ColorField = {
  _type: string;
  hex: string;
};

export type LinkField = {
  _type: string;
  href: string;
  blank: boolean;
};

export type InternalLinkField = {
  _type: string;
  reference: {
    _type: string;
    _ref: string;
  };
};

export type Project = {
  _id: string;
  _createdAt: Date;
  name: string;
  slug: string | { current: string };
  subtitle?: string;
  image?: string;
  svgcode?: CodeField;
  color?: ColorField;
  displayType?: "popup" | "background";
  url?: string;
  type?: "personal" | "client";
  archived?: boolean;
  content?: (PortableTextBlock | LinkField | InternalLinkField)[];
};
