import type {
  Embed,
  MUSIC_LIST_QUERY_RESULT,
  MUSIC_BY_SLUG_QUERY_RESULT,
  Spotify,
} from "../sanity/sanity.types";

export type Music = MUSIC_LIST_QUERY_RESULT[number];
export type MusicDetail = NonNullable<MUSIC_BY_SLUG_QUERY_RESULT>;
export type MusicLink = NonNullable<Music["links"]>[number];
export type MusicEmbed = Embed & { _key?: string };
export type MusicSpotify = Spotify & { _key?: string };
