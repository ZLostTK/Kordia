"""
Kordia Backend - FastAPI Application Factory
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database.connection import init_database
from app.core.middleware import LoggingMiddleware
from app.api.routes import search, stream, offline, maintenance, playlists
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
    
    # Registrar routers de la API
    app.include_router(maintenance.router)
    app.include_router(search.router)
    app.include_router(stream.router)
    app.include_router(offline.router)
    app.include_router(playlists.router)
    
    # Servir el frontend React (build dist) si existe
    static_dir = settings.static_dir
    if static_dir.exists() and static_dir.is_dir():
        # Montar los assets de Vite (js, css, imágenes, etc.)
        assets_dir = static_dir / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
        
        # Catch-all: sirve archivos reales desde static_dir o index.html si no existen
        # Esto permite servir manifest.webmanifest, registerSW.js y manejar React Router
        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str = ""):
            # Si se pide una ruta de la API, dejamos que pase (esto no debería ocurrir por el orden de registro)
            if full_path.startswith("api/"):
                return None
                
            # Intentar servir el archivo real desde la raíz de dist (ej: manifest.webmanifest, registerSW.js)
            file_path = static_dir / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
                
            # Por defecto, servir index.html para que React Router maneje la navegación
            index_file = static_dir / "index.html"
            return FileResponse(str(index_file))
        
        print(f"✓ Frontend servido desde: {static_dir.absolute()}")
    else:
        print(f"⚠️  Carpeta dist no encontrada en: {static_dir.absolute()}")
        print("   Ejecuta 'npm run build' en Kordia_Frontend/ para generar el build.")
    
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

