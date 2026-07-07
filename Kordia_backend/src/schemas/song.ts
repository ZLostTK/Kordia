import { Type, type Static } from '@sinclair/typebox';

export const SongBase = Type.Object({
  ytid: Type.String(),
  title: Type.String(),
  artist: Type.Optional(Type.String()),
  thumbnail: Type.Optional(Type.String()),
  duration: Type.Optional(Type.Number()),
});

export type SongBaseType = Static<typeof SongBase>;

export const Song = Type.Composite([SongBase, Type.Object({
  isOffline: Type.Boolean({ default: false }),
})]);

export const SearchResult = SongBase;

export const OfflineSong = Type.Composite([SongBase, Type.Object({
  audioPath: Type.String(),
  artworkPath: Type.Optional(Type.String()),
  dateAdded: Type.String(),
  isOffline: Type.Boolean({ default: true }),
})]);

export const DownloadRequest = Type.Object({
  ytid: Type.String(),
  title: Type.String(),
  artist: Type.Optional(Type.String()),
  thumbnail: Type.Optional(Type.String()),
});

export type OfflineSongType = Static<typeof OfflineSong>;
export type DownloadRequestType = Static<typeof DownloadRequest>;
