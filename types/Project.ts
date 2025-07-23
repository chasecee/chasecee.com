import { PortableTextBlock } from "sanity";
import { CodeField, ColorField, LinkField, InternalLinkField } from "./Content";

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
