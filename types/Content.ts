import { TypedObject, PortableTextBlock } from "@portabletext/types";

export interface LinkField {
  _type: string;
  href: string;
  blank: boolean;
}

export interface InternalLinkField {
  _type: string;
  reference: {
    _type: string;
    _ref: string;
  };
}

export interface InternalLinkValue extends TypedObject {
  _type: "internalLink";
  slug: string;
  refType: "project" | "page";
}

export interface ExternalLinkValue extends TypedObject {
  _type: "link";
  blank: boolean;
  href: string;
}

export interface CodeField {
  _type: string;
  language: string;
  highlightedLines: number[];
  code: string;
  filename: string;
}

export interface ColorField {
  _type: string;
  hex: string;
}

export interface Skills {
  _type: "skills";
  placeholder: string;
}

export interface ImageBlock {
  _type: "image";
  imageUrl: string;
  alt: string;
}

export type ContentBlock =
  | PortableTextBlock
  | LinkField
  | InternalLinkField
  | Skills
  | ImageBlock;
