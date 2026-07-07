export const SCHEMAS = [
  `CREATE TABLE IF NOT EXISTS stream_cache (
    ytid TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    timestamp DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS offline_songs (
    ytid TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    thumbnail TEXT,
    audio_path TEXT NOT NULL,
    artwork_path TEXT,
    date_added DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cover_thumbnail TEXT,
    created_at DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id TEXT NOT NULL,
    ytid TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    thumbnail TEXT,
    song_order INTEGER NOT NULL,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, ytid)
  )`,
];

export const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_stream_cache_timestamp ON stream_cache(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_offline_songs_date ON offline_songs(date_added)',
  'CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id)',
  'CREATE INDEX IF NOT EXISTS idx_playlists_created ON playlists(created_at)',
];
