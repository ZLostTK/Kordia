import { SearchResult, OfflineSong, StreamResponse, Song, Playlist } from '../types';
import { isMobileDevice } from '../utils/device';

// En producción usamos rutas relativas (mismo origen que el backend).
// En desarrollo, Vite proxy redirige al backend en localhost:8000.
const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || '')
  : '';

export const api = {
  async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    const response = await fetch(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&max_results=${maxResults}`
    );
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  async getStreamUrl(ytid: string): Promise<StreamResponse> {
    const response = await fetch(`${API_BASE_URL}/stream/${ytid}`);
    if (!response.ok) throw new Error('Failed to get stream URL');
    return response.json();
  },

  async downloadOffline(song: Song): Promise<void> {
    const isMobile = isMobileDevice();

    if (isMobile) {
      // Lógica Móvil: Descargar directamente el stream proxy a caché y registrar localmente.
      try {
        const proxyResponse = await fetch(`${API_BASE_URL}/stream/proxy/${song.ytid}`);
        if (!proxyResponse.ok) throw new Error('Proxy download failed');
        
        // Optimizamos convirtiendo a Blob antes del cache.put().
        // Esto evita cuellos de botella de I/O en móviles con streams de larga duración.
        const audioBlob = await proxyResponse.blob();
        const audioUrl = api.getOfflineAudioUrl(song.ytid);
        const audioCache = await caches.open('audio-cache');
        await audioCache.put(audioUrl, new Response(audioBlob));

        if (song.thumbnail) {
          const thumbCache = await caches.open('yt-thumbnails');
          await thumbCache.add(song.thumbnail);
        }

        const localStr = localStorage.getItem('mobile_offline_songs');
        const localSongs: Song[] = localStr ? JSON.parse(localStr) : [];
        if (!localSongs.some(s => s.ytid === song.ytid)) {
          // Add `url` explicitly exactly as offline view expects
          const s = { ...song, url: audioUrl };
          localSongs.unshift(s);
          localStorage.setItem('mobile_offline_songs', JSON.stringify(localSongs));
        }
      } catch (err) {
        console.error('Failed to cache resources on mobile:', err);
        throw err;
      }
      return;
    }

    // Lógica PC: Hostear en disco a través del endpoint habitual
    const response = await fetch(`${API_BASE_URL}/offline/download/${song.ytid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ytid: song.ytid,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
      }),
    });
    if (!response.ok) throw new Error('Download failed');
  },

  async getOfflineSongs(): Promise<OfflineSong[]> {
    const response = await fetch(`${API_BASE_URL}/offline`);
    if (!response.ok) throw new Error('Failed to get offline songs');
    const data = await response.json();
    return data.songs;
  },

  async deleteOfflineSong(ytid: string): Promise<void> {
    const isMobile = isMobileDevice();
    if (isMobile) {
      const localStr = localStorage.getItem('mobile_offline_songs');
      const localSongs: Song[] = localStr ? JSON.parse(localStr) : [];
      const filtered = localSongs.filter(s => s.ytid !== ytid);
      localStorage.setItem('mobile_offline_songs', JSON.stringify(filtered));
      
      const audioUrl = api.getOfflineAudioUrl(ytid);
      try {
        const cache = await caches.open('audio-cache');
        await cache.delete(audioUrl);
      } catch (err) {
        console.error('Failed to delete cache on mobile:', err);
      }
      return;
    }

    const response = await fetch(`${API_BASE_URL}/offline/${ytid}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete song');
  },

  getOfflineAudioUrl(ytid: string): string {
    return `${API_BASE_URL}/offline/audio/${ytid}`;
  },

  async importPlaylist(importUrl: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/playlist/import?url=${encodeURIComponent(importUrl.trim())}`);
    if (!response.ok) throw new Error('Failed to import playlist');
    return response.json();
  },

  // Playlists (SQLite Host API)
  async getPlaylists(): Promise<Playlist[]> {
    const response = await fetch(`${API_BASE_URL}/playlists/`);
    if (!response.ok) throw new Error('Failed to fetch playlists');
    return response.json();
  },
  
  async createPlaylist(playlist: Partial<Playlist>): Promise<Playlist> {
    const response = await fetch(`${API_BASE_URL}/playlists/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlist),
    });
    if (!response.ok) throw new Error('Failed to create playlist');
    return response.json();
  },
  
  async deletePlaylist(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete playlist');
  },
  
  async addSongToPlaylist(playlistId: string, song: Song): Promise<Playlist> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(song),
    });
    if (!response.ok) throw new Error('Failed to add song to playlist');
    return response.json();
  },
  
  async removeSongFromPlaylist(playlistId: string, ytid: string): Promise<Playlist> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${ytid}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to remove song from playlist');
    return response.json();
  },
  
  async renamePlaylist(playlistId: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to rename playlist');
  },

  async cleanup(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cleanup`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Cleanup failed');
  },
};
