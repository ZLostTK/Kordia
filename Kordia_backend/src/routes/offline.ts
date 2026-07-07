import type { FastifyInstance } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { YouTubeService } from '../services/youtube.js';
import { StorageService } from '../services/storage.js';
import { DownloadService } from '../services/download.js';
import { getDb } from '../database/connection.js';
import { OfflineSongsRepository } from '../database/offline-songs.js';

const youtube = new YouTubeService();
const storage = new StorageService();

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
}
