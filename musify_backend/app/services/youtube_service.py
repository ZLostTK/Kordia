"""
Servicio de YouTube usando yt-dlp
"""
import yt_dlp
from typing import List, Dict, Optional, Any
from app.config import settings


class YouTubeService:
    """Servicio para interactuar con YouTube mediante yt-dlp"""
    
    def __init__(self):
        self.base_opts = {
            'quiet': settings.ytdlp_quiet,
            'no_warnings': settings.ytdlp_no_warnings,
        }
    
    async def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Buscar canciones en YouTube
        
        Args:
            query: Término de búsqueda
            max_results: Número máximo de resultados
            
        Returns:
            Lista de resultados de búsqueda
        """
        ydl_opts = {
            **self.base_opts,
            'extract_flat': True,
            'default_search': 'ytsearch',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_results = ydl.extract_info(
                f"ytsearch{max_results}:{query}",
                download=False
            )
            
            results = []
            if search_results and 'entries' in search_results:
                for entry in search_results['entries']:
                    if entry:
                        results.append({
                            'ytid': entry.get('id'),
                            'title': entry.get('title'),
                            'artist': entry.get('uploader'),
                            'thumbnail': entry.get('thumbnail'),
                            'duration': entry.get('duration'),
                        })
            
            return results
    
    async def get_stream_url(self, ytid: str) -> Optional[str]:
        """
        Obtener URL de stream de audio
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            URL del stream o None si no se encuentra
        """
        ydl_opts = {
            **self.base_opts,
            'format': 'bestaudio/best',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://youtube.com/watch?v={ytid}",
                download=False
            )
            
            # Buscar el mejor formato de audio
            url = None
            if 'url' in info:
                url = info['url']
            elif 'formats' in info:
                # Buscar formato solo de audio
                for fmt in reversed(info['formats']):
                    if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                        url = fmt.get('url')
                        break
            
            # Fallback al último formato disponible
            if not url and 'formats' in info:
                url = info['formats'][-1]['url']
            
            return url
    
    async def download_audio(
        self,
        ytid: str,
        output_path: str
    ) -> Dict[str, Any]:
        """
        Descargar audio de YouTube
        
        Args:
            ytid: ID del video de YouTube
            output_path: Ruta de salida (sin extensión)
            
        Returns:
            Información del video descargado
        """
        ydl_opts = {
            **self.base_opts,
            'format': 'bestaudio/best',
            'outtmpl': output_path,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': settings.audio_codec,
            }],
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://youtube.com/watch?v={ytid}",
                download=True
            )
            
            return {
                'title': info.get('title'),
                'artist': info.get('uploader'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
            }
    
    async def get_video_info(self, ytid: str) -> Dict[str, Any]:
        """
        Obtener información de un video sin descargarlo
        
        Args:
            ytid: ID del video de YouTube
            
        Returns:
            Información del video
        """
        ydl_opts = {
            **self.base_opts,
            'skip_download': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://youtube.com/watch?v={ytid}",
                download=False
            )
            
            return {
                'ytid': ytid,
                'title': info.get('title'),
                'artist': info.get('uploader'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
            }
