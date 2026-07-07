import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/env.js';

const exec = promisify(execFile);

interface SearchEntry { id?: string; title?: string; uploader?: string; channel?: string; thumbnail?: string; thumbnails?: { url: string }[]; duration?: number; }

export class YouTubeService {
  private baseArgs: string[] = ['--no-progress'];
  constructor() {
    if (config.ytdlpQuiet) this.baseArgs.push('--quiet');
    if (config.ytdlpNoWarnings) this.baseArgs.push('--no-warnings');
  }

  /** Find the last valid JSON line in output */
  private lastJson<T>(out: string): T {
    const lines = out.trim().split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try { return JSON.parse(lines[i]); } catch {}
    }
    throw new Error('No valid JSON in yt-dlp output');
  }

  async search(query: string, maxResults = 10): Promise<SearchEntry[]> {
    const out = await this.run([
      ...this.baseArgs, '--flat-playlist', '--dump-json',
      `ytsearch${maxResults}:${query}`,
    ]);
    return out.trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).filter((e: SearchEntry) => e && e.id && e.title);
  }

  async getStreamUrl(ytid: string): Promise<string | undefined> {
    const out = await this.run([
      ...this.baseArgs, '--format', 'bestaudio/best',
      '--get-url', `https://youtube.com/watch?v=${ytid}`,
    ]);
    return out.trim() || undefined;
  }

  async downloadAudio(ytid: string, outputPath: string): Promise<{ title: string; artist: string; thumbnail: string; duration: number }> {
    const out = await this.run([
      ...this.baseArgs, '--format', 'bestaudio/best',
      '--output', outputPath,
      '--print', '{"title":"%(title)s","artist":"%(uploader)s","thumbnail":"%(thumbnail)s","duration":%(duration)s}',
      '--postprocessor-args', `-acodec ${config.audioCodec}`,
      `https://youtube.com/watch?v=${ytid}`,
    ]);
    return this.lastJson(out);
  }

  async fastDownloadAudio(ytid: string, outputPath: string): Promise<string> {
    const out = await this.run([
      ...this.baseArgs, '--format', 'bestaudio/best',
      '--output', `${outputPath}.%(ext)s`,
      '--print', '%(ext)s',
      `https://youtube.com/watch?v=${ytid}`,
    ]);
    const lines = out.trim().split('\n').filter(Boolean);
    return lines[lines.length - 1] || 'm4a';
  }

  async getVideoInfo(ytid: string): Promise<{ ytid: string; title: string; artist: string; thumbnail: string; duration: number }> {
    const out = await this.run([
      ...this.baseArgs, '--skip-download', '--dump-json',
      `https://youtube.com/watch?v=${ytid}`,
    ]);
    const info = this.lastJson<Record<string, any>>(out);
    return { ytid, title: info.title, artist: info.uploader, thumbnail: info.thumbnail, duration: info.duration };
  }

  async getPlaylist(urlOrId: string): Promise<{ title: string; songs: SearchEntry[] }> {
    let finalUrl = urlOrId;
    if (!urlOrId.startsWith('http')) {
      const match = urlOrId.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const playlistId = match ? match[1] : urlOrId;
      finalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    }
    const metaOut = await this.run([
      ...this.baseArgs, '--skip-download', '--dump-single-json',
      '--playlist-items', '0',
      finalUrl,
    ]);
    const meta = this.lastJson<{ title?: string }>(metaOut);

    const songsOut = await this.run([
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

  private async run(args: string[]): Promise<string> {
    const { stdout } = await exec('yt-dlp', args, { maxBuffer: 50 * 1024 * 1024 });
    return stdout;
  }
}
