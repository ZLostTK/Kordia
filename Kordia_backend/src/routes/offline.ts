import type { FastifyInstance } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { YouTubeService } from '../services/youtube.js';
import { StorageService } from '../services/storage.js';
import { DownloadService } from '../services/download.js';
import { getDb } from '../database/connection.js';
import { OfflineSongsRepository } from '../database/offline-songs.js';

const youtube = new YouTubeService();
const storage = new StorageService();

interface SyncSong { ytid: string; title: string; artist?: string | null; thumbnail?: string | null; }

export async function offlineRoutes(app: FastifyInstance): Promise<void> {
  app.post('/offline/download/:ytid', {
    schema: {
      params: { type: 'object', required: ['ytid'], properties: { ytid: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['ytid', 'title'],
        properties: {
          ytid: { type: 'string' },
          title: { type: 'string' },
          artist: { type: 'string' },
          thumbnail: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { ytid } = req.params as { ytid: string };
    const body = req.body as { ytid: string; title: string; artist?: string; thumbnail?: string };
    if (ytid !== body.ytid) return reply.code(400).send({ error: 'ytid mismatch between URL and body' });
    try {
      const repo = new OfflineSongsRepository(getDb());
      const dl = new DownloadService(youtube, storage, repo);
      const result = await dl.downloadSong(ytid, body.title, body.artist, body.thumbnail);
      if (!result.success) return reply.code(500).send({ success: false, message: result.message });
      return { success: true, message: result.message, path: result.path };
    } catch (e: any) {
      return reply.code(500).send({ success: false, message: `Error en descarga: ${e.message}` });
    }
  });

  app.get('/offline', async () => {
    try {
      const repo = new OfflineSongsRepository(getDb());
      return { songs: repo.getAll() };
    } catch (e: any) {
      throw { statusCode: 500, message: `Error obteniendo canciones: ${e.message}` };
    }
  });

  app.get('/offline/audio/:ytid', async (req, reply) => {
    const { ytid } = req.params as { ytid: string };
    const audioPath = storage.getAudioPath(ytid);
    if (!existsSync(audioPath)) return reply.code(404).send({ error: 'Archivo de audio no encontrado' });
    reply.header('Content-Type', 'audio/mp4');
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Content-Disposition', `attachment; filename="${ytid}.m4a"`);
    return reply.send(createReadStream(audioPath));
  });

  app.get('/offline/artwork/:ytid', async (req, reply) => {
    const { ytid } = req.params as { ytid: string };
    const artPath = storage.getArtworkPath(ytid);
    if (!existsSync(artPath)) return reply.code(404).send({ error: 'Archivo de imagen no encontrado' });
    reply.header('Content-Type', 'image/jpeg');
    return reply.send(createReadStream(artPath));
  });

  app.delete('/offline/:ytid', async (req, reply) => {
    const { ytid } = req.params as { ytid: string };
    try {
      const repo = new OfflineSongsRepository(getDb());
      const dl = new DownloadService(youtube, storage, repo);
      const result = dl.deleteSong(ytid);
      if (!result.success) return reply.code(500).send({ success: false, message: result.message });
      return { success: true, message: result.message };
    } catch (e: any) {
      return reply.code(500).send({ success: false, message: `Error eliminando: ${e.message}` });
    }
  });

  app.post('/offline/sync', async (req, reply) => {
    const body = req.body as { songs: SyncSong[] };
    if (!body?.songs || !Array.isArray(body.songs)) {
      return reply.code(400).send({ error: 'Se requiere un array de canciones en body.songs' });
    }
    const db = getDb();
    try {
      const repo = new OfflineSongsRepository(db);
      let imported = 0;
      db.exec('BEGIN');
      for (const s of body.songs) {
        if (!s.ytid || !s.title) continue;
        const audioPath = storage.getAudioPath(s.ytid);
        if (!existsSync(audioPath)) continue;
        repo.save(s.ytid, s.title, audioPath, s.artist, s.thumbnail, null);
        imported++;
      }
      db.exec('COMMIT');
      return { success: true, imported };
    } catch (e: any) {
      db.exec('ROLLBACK');
      return reply.code(500).send({ success: false, message: `Error en sync: ${e.message}` });
    }
  });

  app.post('/offline/batch-delete', async (req, reply) => {
    const body = req.body as { ytids: string[] };
    if (!body?.ytids || !Array.isArray(body.ytids)) {
      return reply.code(400).send({ error: 'Se requiere un array de ytids en body.ytids' });
    }
    try {
      const repo = new OfflineSongsRepository(getDb());
      const dl = new DownloadService(youtube, storage, repo);
      let deleted = 0;
      for (const ytid of body.ytids) {
        dl.deleteSong(ytid);
        deleted++;
      }
      return { success: true, deleted };
    } catch (e: any) {
      return reply.code(500).send({ success: false, message: `Error en batch-delete: ${e.message}` });
    }
  });
}
