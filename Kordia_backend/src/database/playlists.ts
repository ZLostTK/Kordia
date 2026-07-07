import type Database from 'better-sqlite3';

interface PlaylistRow { id: string; name: string; cover_thumbnail: string | null; created_at: string; }
interface JoinRow extends PlaylistRow { ytid: string | null; title: string | null; artist: string | null; thumbnail: string | null; song_order: number | null; }

interface SongDict { ytid: string; title: string; artist: string | null; thumbnail: string | null; }
interface PlaylistDict { id: string; name: string; coverThumbnail: string | null; createdAt: string; songs: SongDict[]; }

export class PlaylistRepository {
  constructor(private db: Database.Database) {}

  private playlistWithSongs(sql: string, params?: unknown[]): PlaylistDict[] {
    const rows = this.db.prepare(sql).all(...(params ?? [])) as JoinRow[];
    const map = new Map<string, PlaylistDict>();
    for (const r of rows) {
      if (!map.has(r.id)) {
        map.set(r.id, { id: r.id, name: r.name, coverThumbnail: r.cover_thumbnail, createdAt: r.created_at, songs: [] });
      }
      if (r.ytid) {
        map.get(r.id)!.songs.push({ ytid: r.ytid, title: r.title!, artist: r.artist, thumbnail: r.thumbnail });
      }
    }
    return [...map.values()];
  }

  getAllPlaylists(): PlaylistDict[] {
    return this.playlistWithSongs(
      `SELECT p.*, ps.ytid, ps.title, ps.artist, ps.thumbnail, ps.song_order
       FROM playlists p LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       ORDER BY p.created_at DESC, ps.song_order ASC`
    );
  }

  getPlaylist(id: string): PlaylistDict | undefined {
    const all = this.playlistWithSongs(
      `SELECT p.*, ps.ytid, ps.title, ps.artist, ps.thumbnail, ps.song_order
       FROM playlists p LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       WHERE p.id = ? ORDER BY ps.song_order ASC`,
      [id]
    );
    return all[0];
  }

  getPlaylistSongs(playlistId: string): SongDict[] {
    return this.db.prepare(
      'SELECT ytid, title, artist, thumbnail FROM playlist_songs WHERE playlist_id = ? ORDER BY song_order ASC'
    ).all(playlistId) as SongDict[];
  }

  createPlaylist(id: string, name: string): PlaylistDict {
    this.db.prepare('INSERT INTO playlists (id, name, created_at) VALUES (?, ?, ?)').run(id, name, new Date().toISOString());
    return this.getPlaylist(id)!;
  }

  updatePlaylistName(id: string, name: string): boolean {
    const r = this.db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run(name, id);
    return r.changes > 0;
  }

  deletePlaylist(id: string): boolean {
    const r = this.db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
    return r.changes > 0;
  }

  addSong(playlistId: string, song: { ytid: string; title: string; artist?: string; thumbnail?: string }): boolean {
    const existing = this.db.prepare('SELECT 1 FROM playlist_songs WHERE playlist_id = ? AND ytid = ?').get(playlistId, song.ytid);
    if (existing) return false;

    // Atomic: INSERT with subquery for next order
    this.db.prepare(
      `INSERT INTO playlist_songs (playlist_id, ytid, title, artist, thumbnail, song_order)
       SELECT ?, ?, ?, ?, ?, COALESCE(MAX(song_order), 0) + 1 FROM playlist_songs WHERE playlist_id = ?`
    ).run(playlistId, song.ytid, song.title, song.artist ?? '', song.thumbnail ?? '', playlistId);

    const pl = this.db.prepare('SELECT cover_thumbnail FROM playlists WHERE id = ?').get(playlistId) as { cover_thumbnail: string | null } | undefined;
    if (pl && !pl.cover_thumbnail && song.thumbnail) {
      this.db.prepare('UPDATE playlists SET cover_thumbnail = ? WHERE id = ?').run(song.thumbnail, playlistId);
    }
    return true;
  }

  removeSong(playlistId: string, ytid: string): boolean {
    const r = this.db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND ytid = ?').run(playlistId, ytid);
    if (r.changes > 0) {
      const songs = this.getPlaylistSongs(playlistId);
      const newCover = songs.length > 0 && songs[0].thumbnail ? songs[0].thumbnail : null;
      this.db.prepare('UPDATE playlists SET cover_thumbnail = ? WHERE id = ?').run(newCover, playlistId);
    }
    return r.changes > 0;
  }
}
