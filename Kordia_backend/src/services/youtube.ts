import { YtDlp, type VideoInfo } from 'ytdlp-nodejs';
import { config } from '../config/env.js';

const ytdlp = new YtDlp();

interface SearchEntry { id?: string; title?: string; uploader?: string; channel?: string; thumbnail?: string; duration?: number; }

export class YouTubeService {
  async search(query: string, maxResults = 10): Promise<SearchEntry[]> {
    const info = await ytdlp.getInfoAsync(`ytsearch${maxResults}:${query}`) as any;
    const entries: any[] = info?.entries ?? [];
    return entries
      .filter((e: any) => e && e.id && e.title)
      .map((e: any) => ({
        id: e.id, title: e.title, uploader: e.uploader,
        channel: e.channel, thumbnail: e.thumbnail, duration: e.duration,
      }));
  }

  async getStreamUrl(ytid: string): Promise<string | undefined> {
    const urls = await ytdlp.getDirectUrlsAsync(`https://youtube.com/watch?v=${ytid}`, {
      format: 'bestaudio/best',
    });
    return urls?.[0];
  }

  async getVideoInfo(ytid: string): Promise<{ ytid: string; title: string; artist: string; thumbnail: string; duration: number }> {
    const info = await ytdlp.getInfoAsync(`https://youtube.com/watch?v=${ytid}`) as VideoInfo;
    return {
      ytid: info.id, title: info.title, artist: info.uploader,
      thumbnail: info.thumbnail, duration: info.duration,
    };
  }

  async downloadAudio(ytid: string, outputPath: string): Promise<{ title: string; artist: string; thumbnail: string; duration: number }> {
    const url = `https://youtube.com/watch?v=${ytid}`;
    const info = await ytdlp.getInfoAsync(url) as VideoInfo;

    await ytdlp.download(url)
      .filter('audioonly')
      .type(config.audioFormat as any)
      .audioQuality('0')
      .setOutputTemplate(outputPath)
      .run();

    return {
      title: info.title, artist: info.uploader,
      thumbnail: info.thumbnail, duration: info.duration,
    };
  }

  async fastDownloadAudio(ytid: string, outputPath: string): Promise<string> {
    const url = `https://youtube.com/watch?v=${ytid}`;
    const result = await ytdlp.execBuilder(url)
      .addArgs('--format', 'bestaudio/best')
      .addArgs('--output', `${outputPath}.%(ext)s`)
      .addArgs('--print', '%(ext)s')
      .addArgs('--quiet')
      .exec();
    const lines = result.stdout.trim().split('\n').filter(Boolean);
    return lines[lines.length - 1] || 'm4a';
  }

  async getPlaylist(urlOrId: string): Promise<{ title: string; songs: SearchEntry[] }> {
    let finalUrl = urlOrId;
    if (!urlOrId.startsWith('http')) {
      const match = urlOrId.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const playlistId = match ? match[1] : urlOrId;
      finalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    }

    const info = await ytdlp.getInfoAsync(finalUrl, { flatPlaylist: true }) as any;
    const entries: any[] = info?.entries ?? [];

    return {
      title: info.title || 'Imported playlist',
      songs: entries
        .filter((e: any) => e && e.id && e.title)
        .map((e: any) => ({
          id: e.id, title: e.title, uploader: e.uploader,
          channel: e.channel, thumbnail: e.thumbnail, duration: e.duration,
        })),
    };
  }
}
