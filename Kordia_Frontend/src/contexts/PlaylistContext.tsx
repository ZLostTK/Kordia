import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Playlist, Song } from '../types';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, persistent?: boolean) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, ytid: string) => void;
  getPlaylist: (id: string) => Playlist | undefined;
  downloadedPlaylist: Playlist;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const STORAGE_KEY = 'kordia_playlists';
const OFFLINE_CACHE_KEY = 'kordia_offline_cache';

function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePlaylists(playlists: Playlist[]) {
  const toSave = playlists.filter(p => p.persistent !== false);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function loadOfflineSongsCache(): Song[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineSongsCache(songs: Song[]) {
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(songs));
}

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>(loadPlaylists);
  const [offlineSongs, setOfflineSongs] = useState<Song[]>(loadOfflineSongsCache);

  useEffect(() => {
    savePlaylists(userPlaylists);
  }, [userPlaylists]);

  useEffect(() => {
    saveOfflineSongsCache(offlineSongs);
  }, [offlineSongs]);

  useEffect(() => {
    const fetchOffline = async () => {
      try {
        const response = await fetch('/offline');
        if (response.ok) {
          const data = await response.json();
          setOfflineSongs(data.songs || []);
        }
      } catch (e) {
        console.error("Failed to fetch offline songs for virtual playlist", e);
      }
    };
    fetchOffline();
    // Refresh every 30s or on demand if we had a trigger
    const interval = setInterval(fetchOffline, 30000);
    return () => clearInterval(interval);
  }, []);

  const downloadedPlaylist: Playlist = {
    id: 'downloaded',
    name: 'Descargadas',
    songs: offlineSongs,
    coverThumbnail: offlineSongs[0]?.thumbnail,
    createdAt: new Date(0).toISOString(),
  };

  const playlists = [downloadedPlaylist, ...userPlaylists];

  const createPlaylist = (name: string, persistent: boolean = true): Playlist => {
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      songs: [],
      createdAt: new Date().toISOString(),
      persistent,
    };
    setUserPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const deletePlaylist = (id: string) => {
    if (id === 'downloaded') return;
    setUserPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const renamePlaylist = (id: string, name: string) => {
    if (id === 'downloaded') return;
    setUserPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    if (playlistId === 'downloaded') return;
    setUserPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      if (p.songs.some(s => s.ytid === song.ytid)) return p;
      return {
        ...p,
        songs: [...p.songs, song],
        coverThumbnail: p.coverThumbnail || song.thumbnail,
      };
    }));
  };

  const removeSongFromPlaylist = (playlistId: string, ytid: string) => {
    if (playlistId === 'downloaded') return;
    setUserPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      const songs = p.songs.filter(s => s.ytid !== ytid);
      return { ...p, songs, coverThumbnail: songs[0]?.thumbnail };
    }));
  };

  const getPlaylist = (id: string) => playlists.find(p => p.id === id);

  return (
    <PlaylistContext.Provider value={{
      playlists,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      getPlaylist,
      downloadedPlaylist,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylists must be used within PlaylistProvider');
  return ctx;
}
