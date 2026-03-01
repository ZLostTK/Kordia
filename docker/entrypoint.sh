#!/bin/sh
set -e

# Configurar mkcert si no están los certificados
if [ ! -f "cert.pem" ] || [ ! -f "key.pem" ]; then
    echo "🔐 Generando certificados SSL con mkcert..."
    
    # Instalar mkcert si no existe (al ser Alpine lo bajamos binario)
    if ! command -v mkcert >/dev/null 2>&1; then
        echo "📥 Descargando mkcert..."
        curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') -o /usr/local/bin/mkcert
        chmod +x /usr/local/bin/mkcert
    fi

    # Intentar instalar la CA (opcional en Docker, pero útil)
    mkcert -install

    # Nombres por defecto
    DOMAINS="localhost 127.0.0.1 ::1 kordia.local"
    
    # Agregar IP del contenedor
    CONTAINER_IP=$(hostname -i)
    DOMAINS="$DOMAINS $CONTAINER_IP"
    
    # Agregar dominios extra si se definen
    if [ -n "$MKCERT_DOMAINS" ]; then
        DOMAINS="$DOMAINS $MKCERT_DOMAINS"
    fi

    echo "📜 Dominios: $DOMAINS"
    mkcert -cert-file cert.pem -key-file key.pem $DOMAINS
fi

# Ejecutar el comando original
exec "$@"
