import type { PortableTextBlock } from "@portabletext/types";
import type {
  CodeField,
  ColorField,
  LinkField,
  InternalLinkField,
} from "./Content";

export type ProjectAspectRatio = {
  desktop?: string;
  mobile?: string;
};

export type ProjectSiteMini = {
  url?: string;
  embedUrl?: string;
  title?: string;
};

export type Project = {
  _id: string;
  isDraft?: boolean;
  _createdAt: Date;
  name: string;
  slug: string | { current: string };
  subtitle?: string;
  image?: string;
  svgcode?: CodeField;
  color?: ColorField;
  displayType?: "popup" | "background" | "embed";
  embedUrl?: string;
  aspectRatio?: ProjectAspectRatio;
  url?: string;
  siteMini?: ProjectSiteMini;
  type?: "personal" | "client";
  archived?: boolean;
  leadIn?: PortableTextBlock[];
  content?: (PortableTextBlock | LinkField | InternalLinkField)[];
};
