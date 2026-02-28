export interface Song {
  ytid: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  url?: string;
}

export interface SearchResult {
  ytid: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

export interface OfflineSong {
  ytid: string;
  title: string;
  artist: string;
  thumbnail: string;
  downloaded_at: string;
  audioPath: string;
  artworkPath: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: string;
  coverThumbnail?: string;
}

export interface StreamResponse {
  ytid: string;
  url: string;
  cached: boolean;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  queue: Song[];
  currentIndex: number;
}
