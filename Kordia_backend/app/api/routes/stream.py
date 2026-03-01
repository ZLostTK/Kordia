"""
Rutas de streaming
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, Response
import aiosqlite
import aiohttp
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
            return StreamResponse(ytid=ytid, url=cached_url, cached=True)
        
        # Obtener nueva URL
        url = await youtube_service.get_stream_url(ytid)
        
        if not url:
            raise HTTPException(
                status_code=404,
                detail="No se pudo obtener URL de stream"
            )
        
        # Guardar en caché
        await cache_service.save_stream_url(ytid, url, cache_repo)
        
        return StreamResponse(ytid=ytid, url=url, cached=False)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo stream: {str(e)}"
        )

from fastapi import BackgroundTasks
import shutil

@router.get("/proxy/{ytid}")
async def proxy_stream(
    ytid: str,
    background_tasks: BackgroundTasks,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Proxy directo del stream de audio para guardado local en clientes móviles.
    Usa yt-dlp para descargar rápido a disco y FileResponse para transferir C++-speed bytes,
    limpiando usando background tasks.
    """
    try:
        import tempfile
        import os
        from fastapi.responses import FileResponse
        
        # Crear un directorio que no se auto-borra inmediatamente
        tmpdir = tempfile.mkdtemp()
        temp_path_base = os.path.join(tmpdir, ytid)
        
        # fast_download_audio descarga el raw a disco SIN pasar por FFmpeg (mucho más rápido)
        ext = await youtube_service.fast_download_audio(ytid, temp_path_base)
        downloaded_file = f"{temp_path_base}.{ext}"
                
        if not os.path.exists(downloaded_file):
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise HTTPException(status_code=500, detail="Error de descarga temporal rápida")
        
        # Aseguramos que se borre UNA VEZ TERMINADO DE SERVIR usando BackgroundTasks
        background_tasks.add_task(shutil.rmtree, tmpdir, ignore_errors=True)
        
        # FileResponse usa los binarios asincrónicos de C más rápidos (sendfile)
        return FileResponse(
            path=downloaded_file,
            media_type="audio/mp4",
            filename=f"{ytid}.{ext}"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
