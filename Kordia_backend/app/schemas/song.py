"""
Modelos Pydantic para canciones
"""
from typing import Optional
from pydantic import BaseModel, Field


class SongBase(BaseModel):
    """Modelo base de canción"""
    ytid: str = Field(..., description="ID del video de YouTube")
    title: str = Field(..., description="Título de la canción")
    artist: Optional[str] = Field(None, description="Artista")
    thumbnail: Optional[str] = Field(None, description="URL del thumbnail")
    duration: Optional[int] = Field(None, description="Duración en segundos")


class Song(SongBase):
    """Modelo de canción completo"""
    isOffline: bool = Field(False, description="Si está disponible offline")


class SearchResult(SongBase):
    """Resultado de búsqueda"""
    pass


class OfflineSong(SongBase):
    """Canción offline con información adicional"""
    audioPath: str = Field(..., description="Ruta al archivo de audio")
    artworkPath: Optional[str] = Field(None, description="Ruta al artwork")
    dateAdded: str = Field(..., description="Fecha de descarga")
    isOffline: bool = Field(True, description="Siempre True para offline")


class DownloadRequest(BaseModel):
    """Solicitud de descarga"""
    ytid: str = Field(..., description="ID del video de YouTube")
    title: str = Field(..., description="Título de la canción")
    artist: Optional[str] = Field(None, description="Artista")
    thumbnail: Optional[str] = Field(None, description="URL del thumbnail")
