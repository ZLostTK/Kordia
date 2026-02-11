"""
Definiciones de esquemas de base de datos
"""

# Schema para tabla de caché de streams
STREAM_CACHE_SCHEMA = """
    CREATE TABLE IF NOT EXISTS stream_cache (
        ytid TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        timestamp DATETIME NOT NULL
    )
"""

# Schema para tabla de canciones offline
OFFLINE_SONGS_SCHEMA = """
    CREATE TABLE IF NOT EXISTS offline_songs (
        ytid TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        thumbnail TEXT,
        audio_path TEXT NOT NULL,
        artwork_path TEXT,
        date_added DATETIME NOT NULL
    )
"""

# Índices para mejorar rendimiento
CREATE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_stream_cache_timestamp ON stream_cache(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_offline_songs_date ON offline_songs(date_added)"
]
