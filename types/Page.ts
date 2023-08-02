import { PortableTextBlock } from "sanity";

type Skills = {
  _type: 'skills';
  placeholder: string;
};

export type Page = {
  name: string;
  _id: string;
  _createdAt: Date;
  title: string;
  subtitle: string;
  slug: string;
  content: (PortableTextBlock | Skills)[];
};