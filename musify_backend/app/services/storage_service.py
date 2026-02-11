"""
Servicio de almacenamiento de archivos
"""
import aiofiles
import aiohttp
from pathlib import Path
from typing import Optional
from PIL import Image
import io
from app.config import settings


class StorageService:
    """Servicio para gestionar archivos locales"""
    
    def __init__(self):
        self.audio_dir = settings.audio_dir
        self.artwork_dir = settings.artwork_dir
    
    async def save_thumbnail(
        self,
        ytid: str,
        thumbnail_url: str,
        optimize: bool = True
    ) -> Optional[str]:
        """
        Descargar y guardar thumbnail
        
        Args:
            ytid: ID del video de YouTube
            thumbnail_url: URL del thumbnail
            optimize: Si se debe optimizar la imagen con Pillow
            
        Returns:
            Ruta del archivo guardado o None si falla
        """
        try:
            artwork_path = self.artwork_dir / f"{ytid}.jpg"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(thumbnail_url) as resp:
                    if resp.status == 200:
                        content = await resp.read()
                        
                        if optimize:
                            # Optimizar imagen con Pillow
                            img = Image.open(io.BytesIO(content))
                            
                            # Convertir a RGB si es necesario
                            if img.mode in ('RGBA', 'P'):
                                img = img.convert('RGB')
                            
                            # Redimensionar si es muy grande
                            max_size = (800, 800)
                            img.thumbnail(max_size, Image.Resampling.LANCZOS)
                            
                            # Guardar optimizado
                            img.save(artwork_path, 'JPEG', quality=85, optimize=True)
                        else:
                            # Guardar directamente
                            async with aiofiles.open(artwork_path, 'wb') as f:
                                await f.write(content)
                        
                        return str(artwork_path)
            
            return None
        
        except Exception as e:
            print(f"Error guardando thumbnail: {e}")
            return None
    
    async def delete_audio(self, ytid: str) -> bool:
        """
        Eliminar archivo de audio
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            True si se eliminó, False en caso contrario
        """
        audio_path = self.audio_dir / f"{ytid}.{settings.audio_format}"
        
        try:
            if audio_path.exists():
                audio_path.unlink()
                return True
        except Exception as e:
            print(f"Error eliminando audio: {e}")
        
        return False
    
    async def delete_artwork(self, ytid: str) -> bool:
        """
        Eliminar archivo de artwork
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            True si se eliminó, False en caso contrario
        """
        artwork_path = self.artwork_dir / f"{ytid}.jpg"
        
        try:
            if artwork_path.exists():
                artwork_path.unlink()
                return True
        except Exception as e:
            print(f"Error eliminando artwork: {e}")
        
        return False
    
    async def delete_song_files(self, ytid: str) -> dict:
        """
        Eliminar todos los archivos de una canción
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            Diccionario con resultados
        """
        audio_deleted = await self.delete_audio(ytid)
        artwork_deleted = await self.delete_artwork(ytid)
        
        return {
            'audio_deleted': audio_deleted,
            'artwork_deleted': artwork_deleted
        }
    
    def get_audio_path(self, ytid: str) -> Path:
        """Obtener ruta del archivo de audio"""
        return self.audio_dir / f"{ytid}.{settings.audio_format}"
    
    def get_artwork_path(self, ytid: str) -> Path:
        """Obtener ruta del archivo de artwork"""
        return self.artwork_dir / f"{ytid}.jpg"
    
    def audio_exists(self, ytid: str) -> bool:
        """Verificar si existe el archivo de audio"""
        return self.get_audio_path(ytid).exists()
    
    def artwork_exists(self, ytid: str) -> bool:
        """Verificar si existe el archivo de artwork"""
        return self.get_artwork_path(ytid).exists()
    
    async def get_storage_stats(self) -> dict:
        """
        Obtener estadísticas de almacenamiento
        
        Returns:
            Diccionario con estadísticas
        """
        audio_files = list(self.audio_dir.glob(f"*.{settings.audio_format}"))
        artwork_files = list(self.artwork_dir.glob("*.jpg"))
        
        total_audio_size = sum(f.stat().st_size for f in audio_files)
        total_artwork_size = sum(f.stat().st_size for f in artwork_files)
        
        return {
            'audio_count': len(audio_files),
            'artwork_count': len(artwork_files),
            'total_audio_size_mb': round(total_audio_size / (1024 * 1024), 2),
            'total_artwork_size_mb': round(total_artwork_size / (1024 * 1024), 2),
        }
