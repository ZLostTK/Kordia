import { execFileSync } from 'child_process';
import { config } from '../config/env.js';

interface SearchEntry { id?: string; title?: string; uploader?: string; channel?: string; thumbnail?: string; thumbnails?: { url: string }[]; duration?: number; }
interface PlaylistMeta { title?: string; entries?: SearchEntry[]; }

export class YouTubeService {
  private baseArgs: string[] = [];
  constructor() {
    if (config.ytdlpQuiet) this.baseArgs.push('--quiet');
    if (config.ytdlpNoWarnings) this.baseArgs.push('--no-warnings');
  }

  search(query: string, maxResults = 10): SearchEntry[] {
    const out = this.run([
      ...this.baseArgs, '--flat-playlist', '--dump-json',
      `ytsearch${maxResults}:${query}`,
    ]);
    return out.trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).filter((e: SearchEntry) => e && e.id && e.title);
  }

  getStreamUrl(ytid: string): string | undefined {
    const out = this.run([
      ...this.baseArgs, '--format', 'bestaudio/best',
      '--get-url', `https://youtube.com/watch?v=${ytid}`,
    ]);
    return out.trim() || undefined;
  }

  downloadAudio(ytid: string, outputPath: string): { title: string; artist: string; thumbnail: string; duration: number } {
    const out = this.run([
      ...this.baseArgs, '--format', 'bestaudio/best',
      '--output', outputPath,
      '--print', '{"title":"%(title)s","artist":"%(uploader)s","thumbnail":"%(thumbnail)s","duration":%(duration)s}',
      '--postprocessor-args', `-acodec ${config.audioCodec}`,
      `https://youtube.com/watch?v=${ytid}`,
    ]);
    const lastLine = out.trim().split('\n').pop()!;
    return JSON.parse(lastLine);
  }

  fastDownloadAudio(ytid: string, outputPath: string): string {
    const out = this.run([
      ...this.baseArgs, '--format', 'bestaudio/best',
      '--output', `${outputPath}.%(ext)s`,
      '--print', '%(ext)s',
      `https://youtube.com/watch?v=${ytid}`,
    ]);
    return out.trim().split('\n').pop() || 'm4a';
  }

  getVideoInfo(ytid: string): { ytid: string; title: string; artist: string; thumbnail: string; duration: number } {
    const out = this.run([
      ...this.baseArgs, '--skip-download', '--dump-json',
      `https://youtube.com/watch?v=${ytid}`,
    ]);
    const info = JSON.parse(out.trim().split('\n').pop()!);
    return { ytid, title: info.title, artist: info.uploader, thumbnail: info.thumbnail, duration: info.duration };
  }

  getPlaylist(urlOrId: string): { title: string; songs: SearchEntry[] } {
    let finalUrl = urlOrId;
    if (!urlOrId.startsWith('http')) {
      const match = urlOrId.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const playlistId = match ? match[1] : urlOrId;
      finalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    }
    // First call: get playlist metadata (title) without --flat-playlist
    const metaOut = this.run([
      ...this.baseArgs, '--skip-download', '--dump-single-json',
      '--playlist-items', '0',
      finalUrl,
    ]);
    const meta = JSON.parse(metaOut.trim().split('\n').pop()!);

    // Second call: get flat song entries
    const songsOut = this.run([
      ...this.baseArgs, '--flat-playlist', '--dump-json',
      finalUrl,
    ]);
    const lines = songsOut.trim().split('\n').filter(Boolean);
    const songs: SearchEntry[] = lines.map(l => {
      const e = JSON.parse(l);
      const thumbnail = e.thumbnail || (e.thumbnails?.[e.thumbnails.length - 1]?.url);
      return { id: e.id, title: e.title, uploader: e.uploader, channel: e.channel, thumbnail, duration: e.duration };
    });

    return { title: meta.title || 'Playlist importada', songs };
  }

  private run(args: string[]): string {
    return execFileSync('yt-dlp', args, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
  }
}
