import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Playlist, Song } from '../types';
import { api } from '../services/api';
import { isMobileDevice } from '../utils/device';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, persistent?: boolean) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, ytid: string) => Promise<void>;
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
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [offlineSongs, setOfflineSongs] = useState<Song[]>(loadOfflineSongsCache);
  const isMobile = isMobileDevice();

  useEffect(() => {
    if (isMobile) {
      setUserPlaylists(loadPlaylists());
    } else {
      api.getPlaylists().then(setUserPlaylists).catch(e => {
        console.error("No se pudieron cargar las playlists del host", e);
      });
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      savePlaylists(userPlaylists);
    }
  }, [userPlaylists, isMobile]);

  useEffect(() => {
    saveOfflineSongsCache(offlineSongs);
  }, [offlineSongs]);

  useEffect(() => {
    const fetchOffline = async () => {
      if (isMobileDevice()) {
        const localStr = localStorage.getItem('mobile_offline_songs');
        const localSongs = localStr ? JSON.parse(localStr) : [];
        setOfflineSongs(localSongs);
        return;
      }

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
    songs: offlineSongs.map(song => ({
      ...song,
      // Force URL to local cache endpoint so player doesn't fetch YouTube
      url: song.url || api.getOfflineAudioUrl(song.ytid)
    })),
    coverThumbnail: offlineSongs[0]?.thumbnail,
    createdAt: new Date(0).toISOString(),
  };

  const playlists = [downloadedPlaylist, ...userPlaylists];

  const createPlaylist = async (name: string, persistent: boolean = true): Promise<Playlist> => {
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      songs: [],
      createdAt: new Date().toISOString(),
      persistent,
    };
    if (isMobile) {
      setUserPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    } else {
      try {
        const created = await api.createPlaylist(newPlaylist);
        setUserPlaylists(prev => [created, ...prev]);
        return created;
      } catch (e) {
        console.error("Error creating playlist in backend", e);
        throw e;
      }
    }
  };

  const deletePlaylist = async (id: string) => {
    if (id === 'downloaded') return;
    if (isMobile) {
      setUserPlaylists(prev => prev.filter(p => p.id !== id));
    } else {
      try {
        await api.deletePlaylist(id);
        setUserPlaylists(prev => prev.filter(p => p.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const renamePlaylist = async (id: string, name: string) => {
    if (id === 'downloaded') return;
    if (isMobile) {
      setUserPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    } else {
      try {
        await api.renamePlaylist(id, name);
        setUserPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const addSongToPlaylist = async (playlistId: string, song: Song) => {
    if (playlistId === 'downloaded') return;
    if (isMobile) {
      setUserPlaylists(prev => prev.map(p => {
        if (p.id !== playlistId) return p;
        if (p.songs.some(s => s.ytid === song.ytid)) return p;
        return {
          ...p,
          songs: [...p.songs, song],
          coverThumbnail: p.coverThumbnail || song.thumbnail,
        };
      }));
    } else {
      try {
        const updated = await api.addSongToPlaylist(playlistId, song);
        setUserPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
      } catch (e) {
        console.error("Error adding song", e);
      }
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, ytid: string) => {
    if (playlistId === 'downloaded') return;
    if (isMobile) {
      setUserPlaylists(prev => prev.map(p => {
        if (p.id !== playlistId) return p;
        const songs = p.songs.filter(s => s.ytid !== ytid);
        return { ...p, songs, coverThumbnail: songs[0]?.thumbnail };
      }));
    } else {
      try {
        const updated = await api.removeSongFromPlaylist(playlistId, ytid);
        setUserPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
      } catch (e) {
        console.error(e);
      }
    }
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
