"""
Gestión de conexión a la base de datos
"""
import aiosqlite
from app.config import settings
from app.database.models import (
    STREAM_CACHE_SCHEMA,
    OFFLINE_SONGS_SCHEMA,
    PLAYLIST_SCHEMA,
    PLAYLIST_SONG_SCHEMA,
    CREATE_INDEXES
)


async def init_database() -> None:
    """Inicializar la base de datos y crear tablas"""
    async with aiosqlite.connect(settings.db_path) as db:
        # Crear tablas
        await db.execute(STREAM_CACHE_SCHEMA)
        await db.execute(OFFLINE_SONGS_SCHEMA)
        await db.execute(PLAYLIST_SCHEMA)
        await db.execute(PLAYLIST_SONG_SCHEMA)
        
        # Crear índices
        for index_sql in CREATE_INDEXES:
            await db.execute(index_sql)
        
        await db.commit()
        print("✓ Base de datos inicializada")


async def get_connection() -> aiosqlite.Connection:
    """Obtener una nueva conexión a la base de datos"""
    return await aiosqlite.connect(settings.db_path)
