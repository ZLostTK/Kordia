import { YouTubeService } from './youtube.js';
import { StorageService } from './storage.js';
import { OfflineSongsRepository } from '../database/offline-songs.js';

export class DownloadService {
  constructor(
    private youtube: YouTubeService,
    private storage: StorageService,
    private offlineRepo: OfflineSongsRepository,
  ) {}

  async downloadSong(ytid: string, title: string, artist?: string | null, thumbnail?: string | null): Promise<{
    success: boolean; message: string; path?: string; artworkPath?: string | null; alreadyExists?: boolean;
  }> {
    if (this.offlineRepo.exists(ytid) && this.storage.audioExists(ytid)) {
      return { success: true, message: 'Ya esta descargada', path: this.storage.getAudioPath(ytid), alreadyExists: true };
    }

    try {
      const audioPath = this.storage.getAudioPath(ytid);
      const outputPath = audioPath.replace(/\.\w+$/, '');
      const info = this.youtube.downloadAudio(ytid, outputPath);
      const artworkPath = thumbnail ? await this.storage.saveThumbnail(ytid, thumbnail) : null;

      this.offlineRepo.save(ytid, title || info.title, audioPath, artist || info.artist, thumbnail, artworkPath);
      return { success: true, message: 'Descarga completada', path: audioPath, artworkPath };
    } catch (e: any) {
      return { success: false, message: `Error en descarga: ${e.message}` };
    }
  }

  deleteSong(ytid: string): { success: boolean; message: string; filesDeleted: { audioDeleted: boolean; artworkDeleted: boolean }; dbDeleted: boolean } {
    try {
      const filesDeleted = this.storage.deleteSongFiles(ytid);
      const dbDeleted = this.offlineRepo.delete(ytid);
      return { success: true, message: 'Cancion eliminada', filesDeleted, dbDeleted };
    } catch (e: any) {
      return { success: false, message: `Error eliminando: ${e.message}`, filesDeleted: { audioDeleted: false, artworkDeleted: false }, dbDeleted: false };
    }
  }

  getDownloadInfo(ytid: string): { exists: boolean; data?: any; audioExists?: boolean; artworkExists?: boolean } {
    if (this.offlineRepo.exists(ytid)) {
      const data = this.offlineRepo.getByYtid(ytid);
      return { exists: true, data, audioExists: this.storage.audioExists(ytid), artworkExists: this.storage.artworkExists(ytid) };
    }
    return { exists: false };
  }
}
