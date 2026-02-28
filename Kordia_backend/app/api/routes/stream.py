"""
Rutas de streaming
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
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

@router.get("/proxy/{ytid}")
async def proxy_stream(
    ytid: str,
    youtube_service: YouTubeService = Depends(get_youtube_service),
    cache_service: CacheService = Depends(get_cache_service),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Proxy directo del stream de audio para guardado local en clientes móviles.
    Evita guardar el achivo en el servidor host de PC.
    """
    try:
        cache_repo = StreamCacheRepository(db)
        
        # Verificar caché
        url = await cache_service.get_stream_url(ytid, cache_repo)
        if not url:
            url = await youtube_service.get_stream_url(ytid)
            if not url:
                raise HTTPException(status_code=404, detail="No se pudo obtener URL de stream")
            await cache_service.save_stream_url(ytid, url, cache_repo)
            
        # Para obtener el Content-Length antes de empezar a transmitir,
        # necesitaríamos hacer una petición HEAD o la primera petición fuera del generador
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                content_length = response.headers.get('Content-Length')
                
                # Definir cabeceras iniciales
                headers = {
                    "Accept-Ranges": "bytes",
                }
                if content_length:
                    headers["Content-Length"] = content_length

                return StreamingResponse(
                    response.content.iter_any(),
                    media_type="audio/webm",
                    headers=headers
                )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
