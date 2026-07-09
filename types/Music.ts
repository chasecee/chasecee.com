export type MusicLink = {
  _key?: string;
  label: string;
  url: string;
};

export type MusicEmbed = {
  _key?: string;
  _type: "embed";
  url: string;
  title?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
};

export type MusicGalleryImage = {
  _key?: string;
  url?: string;
  alt?: string;
};

export type Music = {
  _id: string;
  _createdAt: Date;
  slug: string | { current: string };
  bandName: string;
  albumName: string;
  releaseYear?: number;
  albumArt?: string;
  albumArtAlt?: string;
  gallery?: MusicGalleryImage[];
  links?: MusicLink[];
  embeds?: MusicEmbed[];
};
