"""
Rutas de canciones offline
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
import aiosqlite
from app.schemas.song import DownloadRequest
from app.schemas.responses import DownloadResponse, OfflineListResponse
from app.services.youtube_service import YouTubeService
from app.services.storage_service import StorageService
from app.services.download_service import DownloadService
from app.database.repositories.offline_songs import OfflineSongsRepository
from app.dependencies import get_youtube_service, get_storage_service, get_db

router = APIRouter(prefix="/offline", tags=["offline"])


@router.post("/download/{ytid}", response_model=DownloadResponse)
async def download_song(
    ytid: str,
    request: DownloadRequest,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    storage_service: StorageService = Depends(get_storage_service),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Descargar una canción para reproducción offline
    
    - **ytid**: ID del video de YouTube
    - **request**: Datos de la canción a descargar
    """
    try:
        offline_repo = OfflineSongsRepository(db)
        download_service = DownloadService(
            youtube_service,
            storage_service,
            offline_repo
        )
        
        result = await download_service.download_song(
            ytid=ytid,
            title=request.title,
            artist=request.artist,
            thumbnail=request.thumbnail
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('message', 'Error en descarga')
            )
        
        return DownloadResponse(
            success=True,
            message=result['message'],
            path=result.get('path')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en descarga: {str(e)}"
        )


@router.get("", response_model=OfflineListResponse)
async def get_offline_songs(
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Obtener lista de canciones offline
    """
    try:
        offline_repo = OfflineSongsRepository(db)
        songs = await offline_repo.get_all()
        
        return OfflineListResponse(songs=songs)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo canciones: {str(e)}"
        )


@router.get("/audio/{ytid}")
async def serve_audio(
    ytid: str,
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Servir archivo de audio offline
    
    - **ytid**: ID del video de YouTube
    """
    audio_path = storage_service.get_audio_path(ytid)
    
    if not audio_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Archivo de audio no encontrado"
        )
    
    return FileResponse(
        audio_path,
        media_type="audio/mp4",
        headers={"Accept-Ranges": "bytes"}
    )


@router.delete("/{ytid}")
async def delete_offline_song(
    ytid: str,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    storage_service: StorageService = Depends(get_storage_service),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Eliminar canción offline
    
    - **ytid**: ID del video de YouTube
    """
    try:
        offline_repo = OfflineSongsRepository(db)
        download_service = DownloadService(
            youtube_service,
            storage_service,
            offline_repo
        )
        
        result = await download_service.delete_song(ytid)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('message', 'Error eliminando')
            )
        
        return {
            "success": True,
            "message": result['message']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error eliminando: {str(e)}"
        )
