import { BaseRepository } from './base.js';

interface OfflineRow {
  ytid: string; title: string; artist: string | null;
  thumbnail: string | null; audio_path: string;
  artwork_path: string | null; date_added: string;
}

export interface OfflineSongDict {
  ytid: string; title: string; artist: string | null;
  thumbnail: string; audioPath: string;
  artworkPath: string | null; downloaded_at: string;
  isOffline: true;
}

export class OfflineSongsRepository extends BaseRepository {
  getByYtid(ytid: string): OfflineSongDict | undefined {
    const row = this.fetchOne<OfflineRow>(
      'SELECT * FROM offline_songs WHERE ytid = ?', [ytid]
    );
    return row ? this.rowToDict(row) : undefined;
  }

  exists(ytid: string): boolean {
    const row = this.fetchOne<{ '1': number }>('SELECT 1 FROM offline_songs WHERE ytid = ?', [ytid]);
    return !!row;
  }

  getAll(): OfflineSongDict[] {
    return this.fetchAll<OfflineRow>(
      'SELECT * FROM offline_songs ORDER BY date_added DESC'
    ).map(r => this.rowToDict(r));
  }

  save(ytid: string, title: string, audioPath: string, artist?: string | null, thumbnail?: string | null, artworkPath?: string | null): void {
    this.execute(
      `INSERT OR REPLACE INTO offline_songs (ytid, title, artist, thumbnail, audio_path, artwork_path, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ytid, title, artist ?? null, thumbnail ?? null, audioPath, artworkPath ?? null, new Date().toISOString()]
    );
  }

  delete(ytid: string): boolean {
    const result = this.execute('DELETE FROM offline_songs WHERE ytid = ?', [ytid]);
    return result.changes > 0;
  }

  count(): number {
    const row = this.fetchOne<{ 'COUNT(*)': number }>('SELECT COUNT(*) FROM offline_songs');
    return row ? row['COUNT(*)'] : 0;
  }

  private rowToDict(r: OfflineRow): OfflineSongDict {
    return {
      ytid: r.ytid,
      title: r.title,
      artist: r.artist,
      thumbnail: r.artwork_path ? `/offline/artwork/${r.ytid}` : r.thumbnail ?? '',
      audioPath: r.audio_path,
      artworkPath: r.artwork_path,
      downloaded_at: r.date_added,
      isOffline: true,
    };
  }
}
