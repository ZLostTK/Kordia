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

echo "Kordia Build Script"
echo "==================="

# 1. Build del frontend
echo ""
echo "[1/2] Construyendo frontend..."

# Preferir pnpm, fallback a npm
if command -v pnpm &>/dev/null; then
  PKG_MGR="pnpm"
else
  PKG_MGR="npm"
fi

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias con $PKG_MGR..."
    $PKG_MGR install
fi

$PKG_MGR run build
echo "  Build completado -> $BACKEND_DIR/dist/"

# 2. Arrancar el backend (a menos que se pase --no-start)
if [ "$1" != "--no-start" ]; then
    echo ""
    echo "[2/2] Iniciando backend TypeScript..."
    cd "$BACKEND_DIR"

    # Preferir pnpm, fallback a npx
    if command -v pnpm &>/dev/null; then
      EXEC="pnpm"
    else
      EXEC="npx"
    fi

    echo ""
    echo "  -> Abre http://localhost:8000 en tu navegador"
    echo "  -> Presiona Ctrl+C para detener"
    echo ""

    if [ ! -d "node_modules" ]; then
      $EXEC install
    fi
    $EXEC tsx src/main.ts
fi
