# Kordia Backend

TypeScript REST API for searching, streaming, and downloading music from YouTube. Built with Fastify 5.

## Features

- YouTube search via yt-dlp (bundled)
- Audio stream (direct URL or server-proxied)
- Offline song download with artwork optimization
- Two-level cache (memory LRU + SQLite) for stream URLs
- Full playlist management (CRUD + import YouTube playlists)
- SQLite via node:sqlite (Node 26 native)

## Architecture

```
Kordia_backend/
├── src/
│   ├── config/          # Environment config (dotenv)
│   ├── core/            # KordiaError hierarchy
│   ├── database/        # SQLite repos (connection, schema, base)
│   │   ├── base.ts              # BaseRepository (execute, fetchOne, fetchAll)
│   │   ├── connection.ts        # DatabaseSync singleton
│   │   ├── schema.ts            # 4 tables + 4 indexes
│   │   ├── stream-cache.ts      # TTL cache repo
│   │   ├── offline-songs.ts     # Offline songs CRUD
│   │   └── playlists.ts         # Playlists CRUD with JOIN
│   ├── routes/          # Fastify route handlers
│   │   ├── index.ts             # Route aggregator
│   │   ├── search.ts            # /search, /playlist/import
│   │   ├── stream.ts            # /stream/:ytid, /stream/proxy/:ytid
│   │   ├── offline.ts           # Offline CRUD
│   │   ├── playlists.ts         # Playlists CRUD
│   │   └── maintenance.ts       # /health, /cleanup
│   ├── schemas/         # TypeBox type definitions
│   │   ├── song.ts
│   │   └── responses.ts
│   ├── services/        # Business logic
│   │   ├── youtube.ts           # yt-dlp via ytdlp-nodejs (no system dep)
│   │   ├── cache.ts             # Two-level cache (memory + SQLite)
│   │   ├── download.ts          # Download orchestrator
│   │   └── storage.ts           # File I/O + sharp thumbnails
│   ├── app.ts           # Fastify factory (CORS, error handler, static, SPA)
│   └── main.ts          # Entry point, SSL auto-detection
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Requirements

- Node.js 22+ (tested with 26)
- pnpm (recommended) or npm
- FFmpeg on PATH (required by yt-dlp for audio extraction)

## Quick Start

```bash
cd Kordia_backend
pnpm install
cp .env.example .env
npx tsx src/main.ts
```

Server starts at `http://localhost:8000`.

> [!NOTE]
> The SPA frontend is served from `../Kordia_backend/dist/` (built from `Kordia_Frontend/`). Run `pnpm build` in the frontend directory first, or use the dev server on port 5173.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `DATA_DIR` | `./Kordia_data` | Data directory |
| `CACHE_TTL` | `5400` | Stream cache TTL (s) |
| `CACHE_MAX_SIZE` | `500` | Max cached entries |
| `CACHE_CLEANUP_DAYS` | `30` | Stale cache cleanup days |
| `YTDLP_QUIET` | `true` | Suppress yt-dlp output |
| `AUDIO_FORMAT` | `m4a` | Download format |

## API Endpoints

### Search & Stream

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=<query>` | Search YouTube |
| GET | `/stream/:ytid` | Direct stream URL (cached) |
| GET | `/stream/proxy/:ytid` | Server-proxied stream |
| GET | `/playlist/import?url=<playlist>` | Import YouTube playlist |

### Playlists

| Method | Path | Description |
|--------|------|-------------|
| GET | `/playlists` | List all playlists |
| POST | `/playlists` | Create playlist |
| GET | `/playlists/:id` | Get playlist with songs |
| PUT | `/playlists/:id` | Rename playlist |
| DELETE | `/playlists/:id` | Delete playlist |
| POST | `/playlists/:id/songs` | Add song |
| DELETE | `/playlists/:id/songs/:ytid` | Remove song |

### Offline

| Method | Path | Description |
|--------|------|-------------|
| POST | `/offline/download/:ytid` | Download song |
| GET | `/offline` | List offline songs |
| GET | `/offline/audio/:ytid` | Serve audio file |
| GET | `/offline/artwork/:ytid` | Serve artwork |
| DELETE | `/offline/:ytid` | Delete offline song |

### Maintenance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/cleanup` | Clean stale cache |

## SSL

If `cert.pem` and `key.pem` exist in the project root (or `Kordia_backend/`), the server starts in HTTPS mode automatically. Generate them:

```bash
mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 ::1
```

## Data

Data is stored in `DATA_DIR` (default `./Kordia_data/`):

```
Kordia_data/
├── audio/       # .m4a audio files
├── artwork/     # .jpg thumbnails
└── Kordia.db    # SQLite database
```

## Tech Stack

- **Fastify 5** — Server framework
- **TypeBox** — Runtime type definitions
- **node:sqlite** — SQLite (native, no deps)
- **yt-dlp** (via ytdlp-nodejs) — Audio extraction (bundled, no system install)
- **sharp** — Thumbnail processing
- **undici** — HTTP client
- **dotenv** — Environment config
- **tsx** — TypeScript executor (dev)

## Scripts

```bash
pnpm dev         # tsx watch src/main.ts
pnpm build       # tsc compile
pnpm start       # node dist/main.js
pnpm typecheck   # tsc --noEmit
