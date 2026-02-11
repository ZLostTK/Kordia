"""
Dependency injection para FastAPI
"""
from typing import AsyncGenerator
import aiosqlite
from app.config import settings
from app.services.youtube_service import YouTubeService
from app.services.cache_service import CacheService
from app.services.storage_service import StorageService
from app.services.download_service import DownloadService
from app.database.repositories.stream_cache import StreamCacheRepository
from app.database.repositories.offline_songs import OfflineSongsRepository


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Obtener conexión a la base de datos"""
    async with aiosqlite.connect(settings.db_path) as db:
        yield db


async def get_youtube_service() -> YouTubeService:
    """Obtener instancia del servicio de YouTube"""
    return YouTubeService()


async def get_cache_service() -> CacheService:
    """Obtener instancia del servicio de caché"""
    return CacheService()


async def get_storage_service() -> StorageService:
    """Obtener instancia del servicio de almacenamiento"""
    return StorageService()


async def get_stream_cache_repo(
    db: aiosqlite.Connection = None
) -> StreamCacheRepository:
    """Obtener repositorio de caché de streams"""
    if db is None:
        async with aiosqlite.connect(settings.db_path) as db:
            return StreamCacheRepository(db)
    return StreamCacheRepository(db)


async def get_offline_songs_repo(
    db: aiosqlite.Connection = None
) -> OfflineSongsRepository:
    """Obtener repositorio de canciones offline"""
    if db is None:
        async with aiosqlite.connect(settings.db_path) as db:
            return OfflineSongsRepository(db)
    return OfflineSongsRepository(db)


async def get_download_service(
    youtube_service: YouTubeService = None,
    storage_service: StorageService = None,
    offline_repo: OfflineSongsRepository = None
) -> DownloadService:
    """Obtener instancia del servicio de descarga"""
    if youtube_service is None:
        youtube_service = await get_youtube_service()
    if storage_service is None:
        storage_service = await get_storage_service()
    if offline_repo is None:
        offline_repo = await get_offline_songs_repo()
    
    return DownloadService(youtube_service, storage_service, offline_repo)
