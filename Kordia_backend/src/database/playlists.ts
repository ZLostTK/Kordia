import type Database from 'better-sqlite3';

interface PlaylistRow { id: string; name: string; cover_thumbnail: string | null; created_at: string; }
interface SongRow { ytid: string; title: string; artist: string | null; thumbnail: string | null; }

interface PlaylistDict { id: string; name: string; coverThumbnail: string | null; createdAt: string; songs: SongDict[]; }
interface SongDict { ytid: string; title: string; artist: string | null; thumbnail: string | null; }

export class PlaylistRepository {
  constructor(private db: Database.Database) {}

  getAllPlaylists(): PlaylistDict[] {
    const playlists = this.db.prepare('SELECT id, name, cover_thumbnail, created_at FROM playlists ORDER BY created_at DESC').all() as PlaylistRow[];
    return playlists.map(p => ({ ...this.toPlaylistDict(p), songs: this.getPlaylistSongs(p.id) }));
  }

  getPlaylist(id: string): PlaylistDict | undefined {
    const row = this.db.prepare('SELECT id, name, cover_thumbnail, created_at FROM playlists WHERE id = ?').get(id) as PlaylistRow | undefined;
    if (!row) return undefined;
    return { ...this.toPlaylistDict(row), songs: this.getPlaylistSongs(id) };
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

    const maxOrder = this.db.prepare('SELECT MAX(song_order) FROM playlist_songs WHERE playlist_id = ?').get(playlistId) as { 'MAX(song_order)': number | null };
    const nextOrder = (maxOrder?.['MAX(song_order)'] ?? 0) + 1;

    this.db.prepare(
      'INSERT INTO playlist_songs (playlist_id, ytid, title, artist, thumbnail, song_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(playlistId, song.ytid, song.title, song.artist ?? '', song.thumbnail ?? '', nextOrder);

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

  private toPlaylistDict(r: PlaylistRow): Omit<PlaylistDict, 'songs'> {
    return { id: r.id, name: r.name, coverThumbnail: r.cover_thumbnail, createdAt: r.created_at };
  }
}
