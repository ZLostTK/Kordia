const BASE = 'http://192.168.1.39:8000';

export interface SearchResult {
  ytid: string; title: string; artist?: string; thumbnail?: string; duration?: number;
}

export interface OfflineSong {
  ytid: string; title: string; artist: string | null; thumbnail: string;
  audioPath: string; downloaded_at: string; isOffline: true;
}

export const api = {
  async search(query: string, max = 10): Promise<SearchResult[]> {
    const r = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&max_results=${max}`);
    if (!r.ok) throw new Error('Search failed');
    return r.json();
  },

  async downloadOffline(ytid: string, title: string, artist?: string, thumbnail?: string): Promise<string> {
    const r = await fetch(`${BASE}/offline/download/${ytid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ytid, title, artist, thumbnail }),
    });
    if (!r.ok) throw new Error('Download failed');
    const data = await r.json();
    return data.path;
  },

  getAudioUrl(ytid: string): string {
    return `${BASE}/offline/audio/${ytid}`;
  },

  getArtworkUrl(ytid: string): string {
    return `${BASE}/offline/artwork/${ytid}`;
  },

  async getOfflineSongs(): Promise<OfflineSong[]> {
    const r = await fetch(`${BASE}/offline`);
    if (!r.ok) throw new Error('Failed to get offline songs');
    const data = await r.json();
    return data.songs;
  },

  async deleteOfflineSong(ytid: string): Promise<void> {
    const r = await fetch(`${BASE}/offline/${ytid}`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Failed to delete');
  },
};
