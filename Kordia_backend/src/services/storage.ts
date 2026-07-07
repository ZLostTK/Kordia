import { writeFile } from 'fs/promises';
import { existsSync, unlinkSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname, join } from 'path';
import { config } from '../config/env.js';
import sharp from 'sharp';

export class StorageService {
  private audioDir = config.audioDir;
  private artworkDir = config.artworkDir;

  async saveThumbnail(ytid: string, thumbnailUrl: string, optimize = true): Promise<string | null> {
    try {
      const resp = await fetch(thumbnailUrl);
      if (!resp.ok) return null;
      const buf = Buffer.from(await resp.arrayBuffer());
      const safeId = ytid.replace(/[^a-zA-Z0-9_-]/g, '');
      const outPath = resolve(this.artworkDir, `${safeId}.jpg`);

      if (optimize) {
        await sharp(buf)
          .resize(800, 800, { fit: 'inside' })
          .jpeg({ quality: 85 })
          .toFile(outPath);
      } else {
        await writeFile(outPath, buf);
      }
      return outPath;
    } catch {
      return null;
    }
  }

  deleteAudio(ytid: string): boolean {
    return this.deleteFile(this.getAudioPath(ytid));
  }

  deleteArtwork(ytid: string): boolean {
    return this.deleteFile(this.getArtworkPath(ytid));
  }

  deleteSongFiles(ytid: string): { audioDeleted: boolean; artworkDeleted: boolean } {
    return { audioDeleted: this.deleteAudio(ytid), artworkDeleted: this.deleteArtwork(ytid) };
  }

  private safeId(ytid: string): string {
    return ytid.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  getAudioPath(ytid: string): string {
    return resolve(this.audioDir, `${this.safeId(ytid)}.${config.audioFormat}`);
  }

  getArtworkPath(ytid: string): string {
    return resolve(this.artworkDir, `${this.safeId(ytid)}.jpg`);
  }

  audioExists(ytid: string): boolean {
    return existsSync(this.getAudioPath(ytid));
  }

  artworkExists(ytid: string): boolean {
    return existsSync(this.getArtworkPath(ytid));
  }

  getStorageStats(): { audioCount: number; artworkCount: number; totalAudioSizeMb: number; totalArtworkSizeMb: number } {
    const glob = (dir: string, ext: string) =>
      readdirSync(dir).filter(f => f.endsWith(ext)).map(f => join(dir, f));
    const audioFiles = glob(this.audioDir, `.${config.audioFormat}`);
    const artworkFiles = glob(this.artworkDir, '.jpg');
    const totalAudioSize = audioFiles.reduce((s, f) => s + statSync(f).size, 0);
    const totalArtworkSize = artworkFiles.reduce((s, f) => s + statSync(f).size, 0);
    return {
      audioCount: audioFiles.length,
      artworkCount: artworkFiles.length,
      totalAudioSizeMb: Math.round(totalAudioSize / (1024 * 1024) * 100) / 100,
      totalArtworkSizeMb: Math.round(totalArtworkSize / (1024 * 1024) * 100) / 100,
    };
  }

  private deleteFile(path: string): boolean {
    try { unlinkSync(path); return true; } catch { return false; }
  }
}
