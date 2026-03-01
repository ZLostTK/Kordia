# --- STAGE 1: Build the React Frontend ---
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder
WORKDIR /app/Kordia_Frontend

COPY Kordia_Frontend/package*.json ./
RUN npm install
COPY Kordia_Frontend/ ./

# Crear el directorio donde Vite espera dejar el build según vite.config.ts
WORKDIR /app
RUN mkdir -p Kordia_backend

WORKDIR /app/Kordia_Frontend
RUN npm run build

# --- STAGE 2: Run the FastAPI Backend ---
FROM python:3.11-alpine

# Instalar dependencias del sistema optimizadas para ARM y x86
# nss-tools es requerido por mkcert para instalar la CA
RUN apk add --no-cache \
    ffmpeg \
    curl \
    build-base \
    libffi-dev \
    jpeg-dev \
    zlib-dev \
    musl-dev \
    openssl-dev \
    python3-dev \
    nss-tools

WORKDIR /app/backend

# Descargar mkcert binario para Alpine (v1.4.4)
# Detectamos arquitectura automáticamente
RUN curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') -o /usr/local/bin/mkcert && \
    chmod +x /usr/local/bin/mkcert

# Copiar archivos de dependencias e instalar
COPY Kordia_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el backend y el build del frontend
COPY Kordia_backend/app ./app
COPY --from=frontend-builder /app/Kordia_backend/dist ./dist

# Copiar el entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/kordia-entrypoint.sh
RUN chmod +x /usr/local/bin/kordia-entrypoint.sh

# Asegurar directorios
RUN mkdir -p /app/backend/Kordia_data

ENV PORT=8000
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/backend/Kordia_data
ENV STATIC_DIR=/app/backend/dist

EXPOSE 8000

# Usamos el entrypoint para generar certificados antes de arrancar
ENTRYPOINT ["/usr/local/bin/kordia-entrypoint.sh"]

CMD ["python", "-m", "app.main"]
