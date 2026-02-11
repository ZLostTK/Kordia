# Kordia Backend

API REST moderna para reproducción y gestión de música desde YouTube, construida con FastAPI.

## 🎵 Características

- **Búsqueda de música** en YouTube
- **Streaming en tiempo real** con caché inteligente de URLs
- **Descarga offline** de canciones con artwork optimizado
- **Caché de dos niveles** (memoria + SQLite) para rendimiento óptimo
- **API REST completa** con documentación automática
- **Arquitectura modular** con separación de responsabilidades

## 🏗️ Arquitectura

```
Kordia_backend/
├── app/
│   ├── api/              # Rutas de la API
│   ├── core/             # Utilidades core (excepciones, middleware)
│   ├── database/         # Capa de base de datos y repositorios
│   ├── schemas/          # Modelos Pydantic
│   ├── services/         # Lógica de negocio
│   ├── config.py         # Configuración centralizada
│   └── dependencies.py   # Dependency injection
├── requirements.txt
├── .env.example
└── README.md
```

### Capas de la Aplicación

1. **API Layer** (`app/api/routes/`)
   - Endpoints REST
   - Validación de requests
   - Manejo de respuestas

2. **Service Layer** (`app/services/`)
   - `YouTubeService`: Integración con yt-dlp
   - `CacheService`: Caché de dos niveles
   - `StorageService`: Gestión de archivos
   - `DownloadService`: Orquestación de descargas

3. **Repository Layer** (`app/database/repositories/`)
   - `StreamCacheRepository`: Caché de URLs
   - `OfflineSongsRepository`: Canciones descargadas

4. **Core** (`app/core/`)
   - Excepciones personalizadas
   - Middleware de logging y errores

## 📦 Instalación

### Requisitos

- Python 3.8+
- FFmpeg se descarga automáticamente con `static-ffmpeg` (no requiere instalación manual)

### Pasos

1. **Clonar o navegar al directorio**
   ```bash
   cd Kordia_backend
   ```

2. **Crear entorno virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Linux/Mac
   # o
   venv\Scripts\activate  # En Windows
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno** (opcional)
   ```bash
   cp .env.example .env
   # Editar .env según necesidades
   ```

5. **FFmpeg se configura automáticamente**
   - El paquete `static-ffmpeg` descarga automáticamente los binarios de FFmpeg al iniciar el servidor
   - No requiere instalación manual del sistema
   - Si prefieres usar FFmpeg del sistema, instálalo manualmente y el backend lo detectará

## 🚀 Uso

### Iniciar el servidor

```bash
python -m app.main
```

O usando uvicorn directamente:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

El servidor estará disponible en `http://localhost:8000`

### Documentación de la API

- **Swagger UI**: http://localhost:8000/docs

## 📚 Endpoints de la API

### Búsqueda

- `GET /search?q={query}&max_results={n}` - Buscar canciones en YouTube

### Streaming

- `GET /stream/{ytid}` - Obtener URL de stream de audio (con caché)

### Offline

- `POST /offline/download/{ytid}` - Descargar canción para uso offline
- `GET /offline` - Listar canciones descargadas
- `GET /offline/audio/{ytid}` - Servir archivo de audio
- `DELETE /offline/{ytid}` - Eliminar canción offline

### Mantenimiento

- `GET /` - Health check
- `POST /cleanup` - Limpiar caché antiguo

## 🔧 Configuración

Todas las configuraciones se pueden ajustar mediante variables de entorno o el archivo `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `APP_NAME` | Nombre de la aplicación | Kordia API |
| `APP_VERSION` | Versión | 2.0.0 |
| `DEBUG` | Modo debug | false |
| `HOST` | Host del servidor | 0.0.0.0 |
| `PORT` | Puerto del servidor | 8000 |
| `CORS_ORIGINS` | Orígenes CORS permitidos | * |
| `DATA_DIR` | Directorio de datos | ./Kordia_data |
| `CACHE_TTL` | TTL del caché (segundos) | 5400 |
| `CACHE_MAX_SIZE` | Tamaño máximo del caché | 500 |
| `CACHE_CLEANUP_DAYS` | Días para limpieza | 30 |

## 🛠️ Tecnologías Utilizadas

- **FastAPI** - Framework web moderno y rápido
- **yt-dlp** - Descarga de videos/audio de YouTube
- **aiosqlite** - Base de datos SQLite asíncrona
- **cachetools** - Caché en memoria con TTL
- **aiofiles** - Operaciones de archivos asíncronas
- **Pillow** - Procesamiento de imágenes
- **aiohttp** - Cliente HTTP asíncrono
- **Pydantic** - Validación de datos

## 📁 Estructura de Datos

Los datos se almacenan en `./Kordia_data/`:

```
Kordia_data/
├── audio/          # Archivos de audio (.m4a)
├── artwork/        # Imágenes de portada (.jpg)
└── Kordia.db       # Base de datos SQLite
```

## 🔍 Ejemplos de Uso

### Buscar canciones

```bash
curl "http://localhost:8000/search?q=lofi%20music&max_results=5"
```

### Obtener URL de stream

```bash
curl "http://localhost:8000/stream/dQw4w9WgXcQ"
```

### Descargar canción

```bash
curl -X POST "http://localhost:8000/offline/download/dQw4w9WgXcQ" \
  -H "Content-Type: application/json" \
  -d '{
    "ytid": "dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  }'
```

## 🧪 Desarrollo

### Estructura del Código

- **Separation of Concerns**: Cada capa tiene responsabilidades claras
- **Dependency Injection**: Facilita testing y mantenimiento
- **Repository Pattern**: Abstracción de acceso a datos
- **Service Layer**: Lógica de negocio reutilizable
- **Type Safety**: Uso completo de type hints y Pydantic

### Agregar Nuevas Funcionalidades

1. **Nuevo endpoint**: Crear ruta en `app/api/routes/`
2. **Nueva lógica de negocio**: Agregar servicio en `app/services/`
3. **Nuevo modelo de datos**: Definir schema en `app/schemas/`
4. **Nueva tabla**: Agregar en `app/database/models.py` y crear repositorio

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias o mejoras.

## 📧 Contacto

Para preguntas o soporte, por favor abre un issue en el repositorio.

---

**Hecho con ❤️ usando FastAPI y yt-dlp**
