"""
Servicio de descarga que orquesta YouTube, Storage y Database
"""
from typing import Dict, Any
from app.services.youtube_service import YouTubeService
from app.services.storage_service import StorageService
from app.database.repositories.offline_songs import OfflineSongsRepository
from app.config import settings


class DownloadService:
    """Servicio para orquestar descargas de canciones"""
    
    def __init__(
        self,
        youtube_service: YouTubeService,
        storage_service: StorageService,
        offline_repo: OfflineSongsRepository
    ):
        self.youtube = youtube_service
        self.storage = storage_service
        self.offline_repo = offline_repo
    
    async def download_song(
        self,
        ytid: str,
        title: str,
        artist: str = None,
        thumbnail: str = None
    ) -> Dict[str, Any]:
        """
        Descargar canción completa (audio + artwork)
        
        Args:
            ytid: ID del video de YouTube
            title: Título de la canción
            artist: Artista (opcional)
            thumbnail: URL del thumbnail (opcional)
            
        Returns:
            Diccionario con resultado de la descarga
        """
        # Verificar si ya existe
        if await self.offline_repo.exists(ytid):
            audio_path = self.storage.get_audio_path(ytid)
            if audio_path.exists():
                return {
                    'success': True,
                    'message': 'Ya está descargada',
                    'path': str(audio_path),
                    'already_exists': True
                }
        
        try:
            # Preparar ruta de salida (sin extensión, yt-dlp la añade)
            audio_path = self.storage.get_audio_path(ytid)
            output_path = str(audio_path.with_suffix(''))
            
            # Descargar audio
            info = await self.youtube.download_audio(ytid, output_path)
            
            # Descargar thumbnail si está disponible
            artwork_path = None
            if thumbnail:
                artwork_path = await self.storage.save_thumbnail(
                    ytid,
                    thumbnail,
                    optimize=True
                )
            
            # Guardar en base de datos
            await self.offline_repo.save(
                ytid=ytid,
                title=title or info.get('title', 'Unknown'),
                artist=artist or info.get('artist'),
                thumbnail=thumbnail,
                audio_path=str(audio_path),
                artwork_path=artwork_path
            )
            
            return {
                'success': True,
                'message': 'Descarga completada',
                'path': str(audio_path),
                'artwork_path': artwork_path,
                'already_exists': False
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error en descarga: {str(e)}',
                'error': str(e)
            }
    
    async def delete_song(self, ytid: str) -> Dict[str, Any]:
        """
        Eliminar canción offline
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            Diccionario con resultado
        """
        try:
            # Eliminar archivos
            file_results = await self.storage.delete_song_files(ytid)
            
            # Eliminar de base de datos
            db_deleted = await self.offline_repo.delete(ytid)
            
            return {
                'success': True,
                'message': 'Canción eliminada',
                'files_deleted': file_results,
                'db_deleted': db_deleted
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error eliminando: {str(e)}',
                'error': str(e)
            }
    
    async def get_download_info(self, ytid: str) -> Dict[str, Any]:
        """
        Obtener información sobre una descarga
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            Información de la descarga
        """
        exists = await self.offline_repo.exists(ytid)
        
        if exists:
            song_data = await self.offline_repo.get_by_ytid(ytid)
            return {
                'exists': True,
                'data': song_data,
                'audio_exists': self.storage.audio_exists(ytid),
                'artwork_exists': self.storage.artwork_exists(ytid)
            }
        
        return {
            'exists': False,
            'data': None
        }
