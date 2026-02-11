"""
Rutas de búsqueda
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.song import SearchResult
from app.services.youtube_service import YouTubeService
from app.dependencies import get_youtube_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=List[SearchResult])
async def search_songs(
    q: str,
    max_results: int = 10,
    youtube_service: YouTubeService = Depends(get_youtube_service)
):
    """
    Buscar canciones en YouTube
    
    - **q**: Término de búsqueda
    - **max_results**: Número máximo de resultados (default: 10)
    """
    try:
        results = await youtube_service.search(q, max_results)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en búsqueda: {str(e)}"
        )
