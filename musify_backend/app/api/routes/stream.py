"""
Rutas de streaming
"""
from fastapi import APIRouter, HTTPException, Depends
import aiosqlite
from app.schemas.responses import StreamResponse
from app.services.youtube_service import YouTubeService
from app.services.cache_service import CacheService
from app.database.repositories.stream_cache import StreamCacheRepository
from app.dependencies import get_youtube_service, get_cache_service, get_db

router = APIRouter(prefix="/stream", tags=["stream"])


@router.get("/{ytid}", response_model=StreamResponse)
async def get_stream_url(
    ytid: str,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Obtener URL de stream de audio para un video de YouTube
    
    - **ytid**: ID del video de YouTube
    
    Returns URL del stream con indicador de si proviene del caché
    """
    try:
        # Crear repositorio
        cache_repo = StreamCacheRepository(db)
        
        # Verificar caché
        cached_url = await cache_service.get_stream_url(ytid, cache_repo)
        if cached_url:
            return StreamResponse(url=cached_url, cached=True)
        
        # Obtener nueva URL
        url = await youtube_service.get_stream_url(ytid)
        
        if not url:
            raise HTTPException(
                status_code=404,
                detail="No se pudo obtener URL de stream"
            )
        
        # Guardar en caché
        await cache_service.save_stream_url(ytid, url, cache_repo)
        
        return StreamResponse(url=url, cached=False)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo stream: {str(e)}"
        )
