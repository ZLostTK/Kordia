"""
Repositorio para caché de URLs de stream
"""
from datetime import datetime, timedelta
from typing import Optional
import aiosqlite
from app.database.repositories.base import BaseRepository


class StreamCacheRepository(BaseRepository):
    """Repositorio para gestionar el caché de URLs de stream"""
    
    async def get_cached_url(self, ytid: str, ttl_seconds: int = 5400) -> Optional[str]:
        """
        Obtener URL cacheada si existe y no ha expirado
        
        Args:
            ytid: ID del video de YouTube
            ttl_seconds: Tiempo de vida del caché en segundos
            
        Returns:
            URL si existe y es válida, None en caso contrario
        """
        row = await self.fetchone(
            'SELECT url, timestamp FROM stream_cache WHERE ytid = ?',
            (ytid,)
        )
        
        if row:
            url, timestamp = row
            cached_time = datetime.fromisoformat(timestamp)
            
            # Verificar si el caché sigue siendo válido
            if (datetime.now() - cached_time).total_seconds() < ttl_seconds:
                return url
        
        return None
    
    async def save_url(self, ytid: str, url: str) -> None:
        """
        Guardar URL en el caché
        
        Args:
            ytid: ID del video de YouTube
            url: URL del stream
        """
        await self.execute(
            'INSERT OR REPLACE INTO stream_cache (ytid, url, timestamp) VALUES (?, ?, ?)',
            (ytid, url, datetime.now().isoformat())
        )
        await self.commit()
    
    async def delete_old_entries(self, days: int = 30) -> int:
        """
        Eliminar entradas antiguas del caché
        
        Args:
            days: Número de días para considerar una entrada como antigua
            
        Returns:
            Número de entradas eliminadas
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        await self.execute(
            'DELETE FROM stream_cache WHERE timestamp < ?',
            (cutoff_date.isoformat(),)
        )
        await self.commit()
        
        # Obtener número de cambios
        async with await self.execute('SELECT changes()') as cursor:
            result = await cursor.fetchone()
            return result[0] if result else 0
    
    async def clear_cache(self) -> None:
        """Limpiar todo el caché"""
        await self.execute('DELETE FROM stream_cache')
        await self.commit()
