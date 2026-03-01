"""
Kordia Backend - Punto de entrada de la aplicación
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
    
    # Configuración de SSL (HTTPS)
    from pathlib import Path
    ssl_key = Path("key.pem")
    ssl_cert = Path("cert.pem")
    ssl_kwargs = {}
    
    print("🎵 Iniciando Kordia Backend...")
    protocol = "https" if ssl_key.exists() and ssl_cert.exists() else "http"
    print(f"📝 Documentación API: {protocol}://{settings.host}:{settings.port}/docs")
    
    if ssl_key.exists() and ssl_cert.exists():
        ssl_kwargs = {
            "ssl_keyfile": str(ssl_key),
            "ssl_certfile": str(ssl_cert)
        }
        print(f"🔒 HTTPS habilitado: https://{settings.host}:{settings.port}")
    
    # El arranque se hace con el protocolo detectado
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
        **ssl_kwargs
    )


if __name__ == "__main__":
    main()
