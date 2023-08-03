import { PortableTextBlock } from "sanity";

export type CodeField = {
  _type: string;
  language: string;
  highlightedLines: number[];
  code: string;
  filename: string;
}

export type ColorField = {
    _type: string;
    hex: string;
}
  

export type Project = {
  _id: string;
  _createdAt: Date;
  name: string;
  slug: string;
  image: string;
  logo: string;
  svgcode: CodeField;
  color: ColorField;
  subtitle: string;
  url: string;
  content: PortableTextBlock[];
}