"""
Rutas de mantenimiento
"""
from fastapi import APIRouter, Depends
from datetime import timedelta
import aiosqlite
from app.schemas.responses import HealthResponse, CleanupResponse
from app.config import settings
from app.database.repositories.stream_cache import StreamCacheRepository
from app.dependencies import get_db

router = APIRouter(tags=["maintenance"])


@router.get("/", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns información básica de la aplicación
    """
    return HealthResponse(
        app=settings.app_name,
        version=settings.app_version,
        status="running"
    )


@router.post("/cleanup", response_model=CleanupResponse)
async def cleanup_old_cache(
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Limpiar entradas viejas del caché
    
    Elimina entradas de caché más antiguas que el período configurado
    """
    try:
        cache_repo = StreamCacheRepository(db)
        deleted = await cache_repo.delete_old_entries(settings.cache_cleanup_days)
        
        return CleanupResponse(
            success=True,
            deleted=deleted
        )
    
    except Exception as e:
        return CleanupResponse(
            success=False,
            deleted=0
        )
