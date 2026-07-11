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
  width?: "content" | "full";
  ratio?: {
    desktop?: string;
    mobile?: string;
  };
  aspectRatio?: string;
};

export type MusicSpotify = {
  _key?: string;
  _type: "spotify";
  url: string;
  title?: string;
  size?: "compact" | "default";
  theme?: "dark" | "light";
};

export type MusicGalleryImage = {
  _key?: string;
  url?: string;
  alt?: string;
  caption?: string;
};

export type MusicGallery = {
  columns?: number;
  images?: MusicGalleryImage[];
};

export type Music = {
  _id: string;
  isDraft?: boolean;
  _createdAt: Date;
  slug: string | { current: string };
  bandName: string;
  albumName: string;
  releaseYear?: number;
  albumArt?: string;
  albumArtAlt?: string;
  gallery?: MusicGallery;
  links?: MusicLink[];
  embeds?: (MusicEmbed | MusicSpotify)[];
};
