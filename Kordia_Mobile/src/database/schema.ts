import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateIfNeeded(db: SQLiteDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ v: number }>('PRAGMA user_version');
  const current = version?.v ?? 0;
  if (current >= 1) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS offline_songs (
      ytid TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT,
      thumbnail TEXT,
      audio_path TEXT NOT NULL,
      artwork_path TEXT,
      date_added TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      song_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id TEXT NOT NULL,
      ytid TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      thumbnail TEXT,
      duration INTEGER,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, ytid)
    );
    PRAGMA user_version = 1;
  `);
}
