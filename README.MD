# Kordia - Music App

![Project Preview](./screenshot.png)

Kordia is a web application for searching, streaming, and downloading music from YouTube. It runs as a Progressive Web App (PWA) with full offline support.

## Architecture

- **Backend:** TypeScript (Fastify 5), yt-dlp audio extraction, SQLite via node:sqlite
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, PWA (Workbox)
- **Database:** SQLite (reads existing Kordia.db from previous Python version)

## Features

- Search YouTube tracks via yt-dlp
- Stream audio directly (direct stream or proxy)
- Download songs for offline playback
- Playlist management (create, rename, delete, add/remove songs)
- Import entire YouTube playlists
- PWA with service worker caching (installable on mobile)
- SSL auto-setup via mkcert (Docker or local)

## Requirements

- **Node.js** 22+ (tested with 26)
- **pnpm** (recommended) or npm
- **FFmpeg** (required by yt-dlp for audio extraction)

> [!NOTE]
> yt-dlp is bundled via the `ytdlp-nodejs` package. No system installation required.

## Installation

### Manual (Development)

> [!NOTE]
> pnpm is required for the backend. Install it via `npm install -g pnpm`.

**1. Backend**

```bash
cd Kordia_backend
pnpm install
cp .env.example .env
npx tsx src/main.ts
```

The server starts on `http://localhost:8000`. The frontend SPA must be built separately (see step 2) or served standalone (step 3).

**2. Frontend (development mode)**

```bash
cd Kordia_Frontend
pnpm install
cp .env.example .env
pnpm dev
```

The Vite dev server starts on `http://localhost:5173` and proxies API calls to the backend.

**3. Frontend (production build, served by backend)**

```bash
cd Kordia_Frontend
pnpm build
# Assets are written to ../Kordia_backend/dist/
# Then restart the backend - it serves the SPA
```

### Docker

> [!WARNING]
> The Dockerfile is currently Python-based (legacy). The TypeScript backend migration is complete but the Dockerfile has not been updated yet. For now, use the manual installation method.

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGINS` | `*` | Allowed origins (comma-separated) |
| `DATA_DIR` | `./Kordia_data` | Data directory (audio, artwork, DB) |
| `CACHE_TTL` | `5400` | Stream cache TTL (seconds) |
| `CACHE_MAX_SIZE` | `500` | Max cached entries |
| `CACHE_CLEANUP_DAYS` | `30` | Stale cache cleanup interval |
| `YTDLP_QUIET` | `true` | Suppress yt-dlp output |
| `YTDLP_NO_WARNINGS` | `true` | Suppress yt-dlp warnings |
| `AUDIO_FORMAT` | `m4a` | Download audio format |
| `AUDIO_CODEC` | `m4a` | Download audio codec |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

## API Routes

### Search & Stream

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=<query>` | Search YouTube |
| GET | `/stream/:ytid` | Direct audio stream URL |
| GET | `/stream/proxy/:ytid` | Server-proxied audio stream |
| GET | `/playlist/import?url=<playlist>` | Import a YouTube playlist |

### Playlists

| Method | Path | Description |
|--------|------|-------------|
| GET | `/playlists` | List all playlists |
| POST | `/playlists` | Create playlist |
| GET | `/playlists/:id` | Get playlist with songs |
| PUT | `/playlists/:id` | Rename playlist |
| DELETE | `/playlists/:id` | Delete playlist |
| POST | `/playlists/:id/songs` | Add song to playlist |
| DELETE | `/playlists/:id/songs/:ytid` | Remove song from playlist |

### Offline / Download

| Method | Path | Description |
|--------|------|-------------|
| POST | `/offline/download/:ytid` | Download song for offline |
| GET | `/offline` | List offline songs |
| GET | `/offline/audio/:ytid` | Serve offline audio file |
| GET | `/offline/artwork/:ytid` | Serve offline artwork |
| DELETE | `/offline/:ytid` | Delete offline song |

### Maintenance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/cleanup` | Clean stale cache and temp files |

## PWA / Mobile Setup

> [!NOTE]
> PWA requires HTTPS. The backend auto-detects `cert.pem` and `key.pem` in the project root and enables HTTPS if both exist. Generate them with mkcert:

```bash
mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 ::1 <your-local-ip>
```

> [!CAUTION]
> Mobile browsers will show an "untrusted" warning for self-signed certificates. You need to install the mkcert root CA on your device to enable the PWA service worker.

1. Locate the mkcert root CA: `mkcert -CAROOT`
2. Copy `rootCA.pem` to your phone
3. Install it as a trusted CA certificate (Settings > Security > Certificate management)
4. On iOS: also enable trust in Settings > General > About > Certificate Trust Settings

Alternatively, use the `chrome://flags/#unsafely-treat-insecure-origin-as-secure` flag on Android/Chrome.

## SSL Certificates

If `cert.pem` and `key.pem` exist in the project root, the server starts in HTTPS mode automatically. Both files are gitignored.

## License

GNU General Public License v3.0
