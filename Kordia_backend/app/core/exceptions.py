"""
Excepciones personalizadas
"""
from fastapi import HTTPException, status


class KordiaException(Exception):
    """Excepción base de Kordia"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class YouTubeException(KordiaException):
    """Excepción relacionada con YouTube"""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE)


class CacheException(KordiaException):
    """Excepción relacionada con caché"""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class StorageException(KordiaException):
    """Excepción relacionada con almacenamiento"""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotFoundException(KordiaException):
    """Recurso no encontrado"""
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class AlreadyExistsException(KordiaException):
    """Recurso ya existe"""
    def __init__(self, message: str = "Recurso ya existe"):
        super().__init__(message, status.HTTP_409_CONFLICT)
