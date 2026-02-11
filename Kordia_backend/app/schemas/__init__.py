"""
Esquemas Pydantic
"""
from app.schemas.song import (
    Song,
    SongBase,
    SearchResult,
    OfflineSong,
    DownloadRequest
)
from app.schemas.responses import (
    SuccessResponse,
    ErrorResponse,
    StreamResponse,
    DownloadResponse,
    OfflineListResponse,
    CleanupResponse,
    HealthResponse
)

__all__ = [
    "Song",
    "SongBase",
    "SearchResult",
    "OfflineSong",
    "DownloadRequest",
    "SuccessResponse",
    "ErrorResponse",
    "StreamResponse",
    "DownloadResponse",
    "OfflineListResponse",
    "CleanupResponse",
    "HealthResponse"
]
