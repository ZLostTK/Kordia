"""
Rutas de búsqueda y playlist import
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.schemas.song import SearchResult
from app.services.youtube_service import YouTubeService
from app.dependencies import get_youtube_service

router = APIRouter(tags=["search"])


@router.get("/search", response_model=List[SearchResult])
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


@router.get("/playlist/import")
async def import_playlist(
    url: str,
    youtube_service: YouTubeService = Depends(get_youtube_service)
) -> Dict[str, Any]:
    """
    Importar una playlist de YouTube por URL
    
    - **url**: URL completa de la playlist de YouTube
    """
    try:
        result = await youtube_service.get_playlist(url)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error importando playlist: {str(e)}"
        )
