"""
Kordia Backend - FastAPI Application Factory
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import init_database
from app.core.middleware import LoggingMiddleware
from app.api.routes import search, stream, offline, maintenance
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def create_app() -> FastAPI:
    """
    Factory para crear la aplicación FastAPI
    
    Returns:
        Instancia configurada de FastAPI
    """
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API REST para reproducción y gestión de música desde YouTube",
        docs_url="/docs"
    )
    
    # Configurar CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Agregar middleware personalizado
    app.add_middleware(LoggingMiddleware)
    
    # Registrar routers
    app.include_router(maintenance.router)
    app.include_router(search.router)
    app.include_router(stream.router)
    app.include_router(offline.router)
    
    # Eventos de startup y shutdown
    @app.on_event("startup")
    async def startup_event():
        """Inicialización al arrancar la aplicación"""
        # Crear directorios necesarios
        settings.create_directories()
        
        # Inicializar base de datos
        await init_database()
        
        print(f"✓ {settings.app_name} v{settings.app_version} iniciado")
        print(f"✓ Directorio de datos: {settings.data_dir.absolute()}")
        print(f"✓ Documentación API: http://{settings.host}:{settings.port}/docs")
    
    @app.on_event("shutdown")
    async def shutdown_event():
        """Limpieza al cerrar la aplicación"""
        print(f"✓ {settings.app_name} detenido")
    
    return app


# Crear instancia de la aplicación
app = create_app()
