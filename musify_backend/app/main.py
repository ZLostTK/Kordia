"""
Musify Backend - Punto de entrada de la aplicación
"""
import uvicorn
from app import app
from app.config import settings


def setup_ffmpeg():
    """Configurar FFmpeg automáticamente si no está disponible"""
    try:
        import subprocess
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        print("✓ FFmpeg ya está instalado")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚙️  Descargando FFmpeg automáticamente...")
        try:
            from static_ffmpeg import run
            run.add_paths()
            print("✓ FFmpeg descargado y configurado")
        except ImportError:
            print("⚠️  Advertencia: FFmpeg no está disponible. Instala 'static-ffmpeg' o FFmpeg manualmente.")


def main():
    """Función principal para ejecutar el servidor"""
    # Configurar FFmpeg automáticamente
    setup_ffmpeg()
    
    print("🎵 Iniciando Musify Backend...")
    print(f"📝 Documentación API: http://{settings.host}:{settings.port}/docs")
    
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )


if __name__ == "__main__":
    main()
