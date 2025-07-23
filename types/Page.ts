import { PortableTextBlock } from "sanity";
import { Skills, ImageBlock } from "./Content";

export type Page = {
  name: string;
  _id: string;
  _createdAt: Date;
  title: string;
  subtitle: string;
  slug: string;
  content: (PortableTextBlock | Skills | ImageBlock)[];
};
