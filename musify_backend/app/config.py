"""
Configuración centralizada de la aplicación Musify Backend
"""
from pathlib import Path
from typing import Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Información de la aplicación
    app_name: str = "Musify API"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # Servidor
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS
    cors_origins: Union[str, list[str]] = "*"
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parsear CORS origins desde string o lista"""
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            # Si es una lista separada por comas
            return [origin.strip() for origin in v.split(',')]
        return v
    
    # Directorios de datos
    data_dir: Path = Path("./musify_data")
    
    @property
    def audio_dir(self) -> Path:
        return self.data_dir / "audio"
    
    @property
    def artwork_dir(self) -> Path:
        return self.data_dir / "artwork"
    
    @property
    def db_path(self) -> Path:
        return self.data_dir / "musify.db"
    
    # Configuración de caché
    cache_ttl: int = 5400  # 1.5 horas en segundos
    cache_max_size: int = 500
    cache_cleanup_days: int = 30
    
    # yt-dlp configuración
    ytdlp_quiet: bool = True
    ytdlp_no_warnings: bool = True
    
    # Audio format
    audio_format: str = "m4a"
    audio_codec: str = "m4a"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    def create_directories(self) -> None:
        """Crear directorios necesarios si no existen"""
        self.data_dir.mkdir(exist_ok=True)
        self.audio_dir.mkdir(exist_ok=True)
        self.artwork_dir.mkdir(exist_ok=True)


# Instancia global de configuración
settings = Settings()
