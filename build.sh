#!/bin/bash
# ============================================================
# Kordia - Build & Run Script
# Genera el build del frontend y lo sirve desde el backend.
# Uso: ./build.sh [--no-start]
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/Kordia_Frontend"
BACKEND_DIR="$SCRIPT_DIR/Kordia_backend"

echo "🎵 Kordia Build Script"
echo "======================"

# 1. Build del frontend
echo ""
echo "📦 [1/2] Construyendo frontend React..."
cd "$FRONTEND_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias npm..."
    npm install
fi

npm run build
echo "   ✓ Build completado → $BACKEND_DIR/dist/"

# 2. Arrancar el backend (a menos que se pase --no-start)
if [ "$1" != "--no-start" ]; then
    echo ""
    echo "🚀 [2/2] Iniciando backend FastAPI..."
    cd "$BACKEND_DIR"

    # Activar venv si existe
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi

    echo ""
    echo "   → Abre http://localhost:8000 en tu navegador"
    echo "   → API docs en http://localhost:8000/docs"
    echo "   → Presiona Ctrl+C para detener"
    echo ""
    python3 -m app.main
fi
