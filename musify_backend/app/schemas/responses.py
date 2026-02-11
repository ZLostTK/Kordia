"""
Modelos de respuesta de la API
"""
from typing import Optional, List, Any, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class SuccessResponse(BaseModel, Generic[T]):
    """Respuesta exitosa genérica"""
    success: bool = Field(True, description="Indica éxito")
    data: Optional[T] = Field(None, description="Datos de respuesta")
    message: Optional[str] = Field(None, description="Mensaje opcional")


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    success: bool = Field(False, description="Indica error")
    error: str = Field(..., description="Mensaje de error")
    detail: Optional[str] = Field(None, description="Detalle adicional")


class StreamResponse(BaseModel):
    """Respuesta de URL de stream"""
    url: str = Field(..., description="URL del stream de audio")
    cached: bool = Field(..., description="Si la URL proviene del caché")


class DownloadResponse(BaseModel):
    """Respuesta de descarga"""
    success: bool = Field(..., description="Indica si fue exitosa")
    message: str = Field(..., description="Mensaje de estado")
    path: Optional[str] = Field(None, description="Ruta del archivo descargado")


class OfflineListResponse(BaseModel):
    """Respuesta de lista de canciones offline"""
    songs: List[dict] = Field(..., description="Lista de canciones offline")


class CleanupResponse(BaseModel):
    """Respuesta de limpieza de caché"""
    success: bool = Field(..., description="Indica éxito")
    deleted: int = Field(..., description="Número de entradas eliminadas")


class HealthResponse(BaseModel):
    """Respuesta de health check"""
    app: str = Field(..., description="Nombre de la aplicación")
    version: str = Field(..., description="Versión")
    status: str = Field(..., description="Estado del servicio")
