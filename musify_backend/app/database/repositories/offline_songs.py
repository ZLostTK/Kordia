"""
Repositorio para canciones offline
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
import aiosqlite
from app.database.repositories.base import BaseRepository


class OfflineSongsRepository(BaseRepository):
    """Repositorio para gestionar canciones descargadas offline"""
    
    async def get_by_ytid(self, ytid: str) -> Optional[Dict[str, Any]]:
        """
        Obtener canción por ID de YouTube
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            Diccionario con datos de la canción o None
        """
        row = await self.fetchone(
            'SELECT * FROM offline_songs WHERE ytid = ?',
            (ytid,)
        )
        
        if row:
            return self._row_to_dict(row)
        return None
    
    async def exists(self, ytid: str) -> bool:
        """
        Verificar si una canción existe en offline
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            True si existe, False en caso contrario
        """
        row = await self.fetchone(
            'SELECT 1 FROM offline_songs WHERE ytid = ?',
            (ytid,)
        )
        return row is not None
    
    async def get_all(self) -> List[Dict[str, Any]]:
        """
        Obtener todas las canciones offline
        
        Returns:
            Lista de diccionarios con datos de canciones
        """
        rows = await self.fetchall(
            'SELECT * FROM offline_songs ORDER BY date_added DESC'
        )
        
        return [self._row_to_dict(row) for row in rows]
    
    async def save(
        self,
        ytid: str,
        title: str,
        audio_path: str,
        artist: Optional[str] = None,
        thumbnail: Optional[str] = None,
        artwork_path: Optional[str] = None
    ) -> None:
        """
        Guardar canción offline
        
        Args:
            ytid: ID del video de YouTube
            title: Título de la canción
            audio_path: Ruta al archivo de audio
            artist: Artista (opcional)
            thumbnail: URL del thumbnail (opcional)
            artwork_path: Ruta al archivo de artwork (opcional)
        """
        await self.execute(
            '''INSERT OR REPLACE INTO offline_songs 
               (ytid, title, artist, thumbnail, audio_path, artwork_path, date_added)
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (ytid, title, artist, thumbnail, audio_path, artwork_path, 
             datetime.now().isoformat())
        )
        await self.commit()
    
    async def delete(self, ytid: str) -> bool:
        """
        Eliminar canción offline
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            True si se eliminó, False si no existía
        """
        await self.execute(
            'DELETE FROM offline_songs WHERE ytid = ?',
            (ytid,)
        )
        await self.commit()
        
        # Verificar si se eliminó algo
        async with await self.execute('SELECT changes()') as cursor:
            result = await cursor.fetchone()
            return result[0] > 0 if result else False
    
    async def count(self) -> int:
        """
        Contar canciones offline
        
        Returns:
            Número de canciones
        """
        row = await self.fetchone('SELECT COUNT(*) FROM offline_songs')
        return row[0] if row else 0
    
    def _row_to_dict(self, row: tuple) -> Dict[str, Any]:
        """Convertir fila de base de datos a diccionario"""
        return {
            'ytid': row[0],
            'title': row[1],
            'artist': row[2],
            'thumbnail': row[3],
            'audioPath': row[4],
            'artworkPath': row[5],
            'dateAdded': row[6],
            'isOffline': True
        }
