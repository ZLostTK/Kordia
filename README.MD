# 🎵 Kordia - Music App

Kordia es una aplicación web moderna diseñada para buscar, transmitir y descargar música de YouTube con soporte completo para uso sin conexión (PWA).

---

> [!CAUTION]
> Querido Programador:  \
> Cuando escribí este código, sólo Dios y yo \
> sabíamos cómo funcionaba. Ahora, sólo Dios lo sabe. \
> Así que si está tratando de 'optimizar' \
> esta rutina y fracasa (seguramente), \
> por favor, incremente el siguiente contador: \
> como advertencia para el siguiente colega \
> 
> Bugs encontrados: 3 \
> Horas perdidas: 912 \
>  :)

## 🚀 Instalación en PC (Manual)

### 1. Requisitos Previos
- **Node.js** (v16 o superior)
- **Python** (v3.8 o superior)
- **FFmpeg** (Se gestiona automáticamente en el backend vía `static-ffmpeg`)

### 2. Configuración del Frontend (npm / pnpm)
1. Entra al directorio del frontend:
   ```bash
   cd Kordia_Frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de que `VITE_API_URL` apunte a tu backend (ej. `http://localhost:8000`).
4. Inicia el desarrollo:
   ```bash
   npm run build
   ```
   *El frontend correrá en el backend*

### 3. Configuración del Backend
1. Entra al directorio del backend:
   ```bash
   cd Kordia_backend
   ```
2. Crea un entorno virtual e instálalo:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Linux/Mac
   venv\Scripts\activate     # En Windows
   ```
3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Inicia el servidor:
   ```bash
   python -m app.main
   ```
   *El backend correrá en `http://localhost:8000`*

---

## 🐳 Instalación con Docker (Windows, Linux, Mac)

Docker es la forma más sencilla de ejecutar Kordia en cualquier sistema operativo.

1. Asegúrate de tener **Docker** y **Docker Compose** instalados.
2. Navega a la carpeta del proyecto y ejecuta:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```
3. La aplicación estará disponible en `https://tu-ip-local:8000`.

> [!IMPORTANT]
> Para que la PWA funcione correctamente en móviles, Docker utiliza **mkcert** para generar certificados SSL automáticos. Asegúrate de configurar la variable `MKCERT_DOMAINS` en el `docker-compose.yml` con la IP local de tu PC.

---

## 📱 Instalación PWA en Móviles (Android / iOS)

Para que Kordia funcione como una aplicación nativa en tu móvil (PWA) y soporte descargas offline, sigue estos pasos:

### 1. Acceso seguro (HTTPS)
Las PWA requieren **HTTPS** por seguridad. 
- Si usas **Docker**: La aplicación ya sirve HTTPS en el puerto `8000`.
- Si usas la instalación **Manual**: Deberás usar un túnel (como Cloudflare Tunnel o Ngrok) o un proxy inverso (como Nginx) para habilitar HTTPS.

### 2. Pasos para instalar:
1. Desde tu móvil, abre el navegador (Chrome en Android, Safari en iOS).
2. Ingresa la dirección IP de tu PC con HTTPS (ej: `https://192.168.1.XX:8000`).
3. **En Android (Chrome):** Toca los tres puntos `⋮` y selecciona **"Instalar aplicación"** o **"Agregar a la pantalla de inicio"**.
4. **En iOS (Safari):** Toca el botón de compartir `⎙` y selecciona **"Añadir a la pantalla de inicio"**.

### 3. Solución al error "Conexión No Segura" (Muy Importante)
Incluso con HTTPS activado vía Docker, el móvil marcará la conexión como **"No Segura"** porque el certificado es de desarrollo (auto-firmado). Esto **bloqueará los Service Workers** y no podrás descargar música.

Tienes dos formas de solucionarlo:

#### Opción A: Instalar el certificado en tu móvil (Recomendado)

Para que tu teléfono confíe en el HTTPS de tu PC y veas el "candado verde" sin advertencias, debes instalar el Certificado Raíz (Root CA) de mkcert en tu móvil.

Aquí tienes los pasos detallados:

1. **Obtén el certificado raíz en tu PC**
   Primero, necesitas localizar el archivo del certificado que mkcert usa para firmar todos los demás:
   ```bash
   # Ejecuta esto en tu terminal para ver dónde está la carpeta
   mkcert -CAROOT
   ```
   *   **En Windows:** `%LocalAppData%\mkcert`
   *   **En Linux:** `~/.local/share/mkcert`
   *   **En Mac:** `~/Library/Application Support/mkcert`
   *   **Si usas Docker:** `docker cp kordia:/root/.local/share/mkcert/rootCA.pem ./rootCA.pem`

   Copia el archivo llamado `rootCA.pem` de esa carpeta a tu teléfono (puedes enviártelo por Telegram, correo, o cable USB).

2. **Genera el certificado de Kordia con tu IP local**
   Para que el teléfono no dé error al entrar por la IP (ej. 192.168.1.50), el certificado debe incluir esa IP. Busca tu IP local con `ip addr` y luego regenera los archivos en `Kordia_backend/`:
   ```bash
   # Reemplaza 192.168.1.XX por tu IP real
   mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 ::1 192.168.1.XX
   ```

3. **Instala el certificado en tu teléfono**
   - **En Android:**
     1. Ve a **Ajustes > Seguridad > Cifrado y credenciales** (o busca "certificados" en la lupa).
     2. Selecciona **Instalar desde el almacenamiento > Certificado de CA**.
     3. El sistema te dará una advertencia (es normal, tú eres el dueño del servidor). Pulsa **Instalar de todas formas**.
     4. Selecciona el archivo `rootCA.pem` que pasaste anteriormente.
   - **En iOS (iPhone):**
     1. Abre el archivo `rootCA.pem` y pulsa **Instalar perfil**.
     2. Ve a **Ajustes > Perfil descargado** e instálalo.
     3. **Paso CRÍTICO en iOS:** Ve a **Ajustes > General > Información > Ajustes de confianza de certificados**.
     4. Activa el interruptor de **mkcert development CA** para darle confianza total.

4. **Verifica y disfruta**
   Reinicia el backend de Kordia. Ahora, cuando entres desde el navegador de tu móvil a `https://<tu-ip>:8000`:
   - Verás el **candado verde**.
   - Podrás instalar la PWA como si fuera una app nativa.
   - Todas las funciones Offline funcionarán correctamente.

¡Con esto ya tienes un entorno de desarrollo profesional en toda tu red local! 🐧🔒📱

#### Opción B: Bypass en Chrome (Solo Android/Desktop)
Si no quieres instalar cerficados, puedes forzar a Chrome a tratar tu IP como segura:
1. Abre `chrome://flags/#unsafely-treat-insecure-origin-as-secure` en Chrome.
2. Activa la opción (**Enabled**).
3. En el cuadro de texto, pega la URL de tu app (ej: `https://192.168.1.XX:8000`).
4. Reinicia Chrome.

### 4. ¡Listo!
Ahora puedes abrir Kordia desde tu menú de aplicaciones, buscar canciones y darle al botón de **descargar** para escucharlas sin internet.


---

## ⚙️ Configuración Útil (Variables de Entorno)

| Variable | Propósito |
|----------|-----------|
| `CORS_ORIGINS` | Dominios que pueden acceder a la API (usa `*` para desarrollo). |
| `DATA_DIR` | Donde se guardan las canciones y la base de datos. |
| `MKCERT_DOMAINS` | IPs o dominios para los que se generará el certificado SSL. |

---
*Hecho con ❤️ para los amantes de la música.*