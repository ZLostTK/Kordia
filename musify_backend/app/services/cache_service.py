"""
Servicio de caché usando cachetools
"""
import cachetools
from typing import Optional
from app.config import settings
from app.database.repositories.stream_cache import StreamCacheRepository


class CacheService:
    """Servicio de caché de dos niveles (memoria + SQLite)"""
    
    def __init__(self):
        # Caché en memoria con TTL
        self.memory_cache: cachetools.TTLCache = cachetools.TTLCache(
            maxsize=settings.cache_max_size,
            ttl=settings.cache_ttl
        )
    
    async def get_stream_url(
        self,
        ytid: str,
        db_repo: Optional[StreamCacheRepository] = None
    ) -> Optional[str]:
        """
        Obtener URL de stream del caché
        
        Args:
            ytid: ID del video de YouTube
            db_repo: Repositorio de base de datos (opcional)
            
        Returns:
            URL si existe en caché, None en caso contrario
        """
        # Primero verificar caché en memoria
        if ytid in self.memory_cache:
            return self.memory_cache[ytid]
        
        # Si no está en memoria, verificar en base de datos
        if db_repo:
            url = await db_repo.get_cached_url(ytid, settings.cache_ttl)
            if url:
                # Guardar en memoria para acceso rápido
                self.memory_cache[ytid] = url
                return url
        
        return None
    
    async def save_stream_url(
        self,
        ytid: str,
        url: str,
        db_repo: Optional[StreamCacheRepository] = None
    ) -> None:
        """
        Guardar URL en caché
        
        Args:
            ytid: ID del video de YouTube
            url: URL del stream
            db_repo: Repositorio de base de datos (opcional)
        """
        # Guardar en memoria
        self.memory_cache[ytid] = url
        
        # Guardar en base de datos para persistencia
        if db_repo:
            await db_repo.save_url(ytid, url)
    
    def clear_memory_cache(self) -> None:
        """Limpiar caché en memoria"""
        self.memory_cache.clear()
    
    def get_cache_stats(self) -> dict:
        """
        Obtener estadísticas del caché
        
        Returns:
            Diccionario con estadísticas
        """
        return {
            'memory_size': len(self.memory_cache),
            'memory_maxsize': self.memory_cache.maxsize,
            'ttl': self.memory_cache.ttl
        }
