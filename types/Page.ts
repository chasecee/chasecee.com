import { PortableTextBlock } from "sanity";

export type Page = {
    name: string;
    _id: string;
    _createdAt: Date;
    title: string;
    subtitle: string;
    slug: string;
    content: PortableTextBlock[];
}