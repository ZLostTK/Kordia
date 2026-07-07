import type { FastifyInstance } from 'fastify';
import { mkdtempSync, existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { YouTubeService } from '../services/youtube.js';
import { CacheService } from '../services/cache.js';
import { getDb } from '../database/connection.js';
import { StreamCacheRepository } from '../database/stream-cache.js';
import { config } from '../config/env.js';

const youtube = new YouTubeService();
const cache = new CacheService();

export async function streamRoutes(app: FastifyInstance): Promise<void> {
  app.get('/stream/:ytid', async (req, reply) => {
    const { ytid } = req.params as { ytid: string };
    try {
      const db = getDb();
      const repo = new StreamCacheRepository(db);
      const cached = cache.getStreamUrl(ytid, repo);
      if (cached) return { ytid, url: cached, cached: true };

      const url = youtube.getStreamUrl(ytid);
      if (!url) return reply.code(404).send({ error: 'No se pudo obtener URL de stream' });

      cache.saveStreamUrl(ytid, url, repo);
      return { ytid, url, cached: false };
    } catch (e: any) {
      throw { statusCode: 500, message: `Error obteniendo stream: ${e.message}` };
    }
  });

  app.get('/stream/proxy/:ytid', async (req, reply) => {
    const { ytid } = req.params as { ytid: string };
    try {
      const tmpdirPath = mkdtempSync(join(tmpdir(), 'kordia-'));
      const basePath = join(tmpdirPath, ytid);
      const ext = youtube.fastDownloadAudio(ytid, basePath);
      const filePath = `${basePath}.${ext}`;

      if (!existsSync(filePath)) {
        await rm(tmpdirPath, { recursive: true, force: true });
        return reply.code(500).send({ error: 'Error de descarga temporal' });
      }

      reply.header('Content-Type', 'audio/mp4');
      reply.header('Content-Disposition', `attachment; filename="${ytid}.${ext}"`);
      const stream = require('fs').createReadStream(filePath);
      reply.send(stream);

      // Cleanup after response
      reply.then(() => rm(tmpdirPath, { recursive: true, force: true }).catch(() => {}), () => {});
    } catch (e: any) {
      throw { statusCode: 500, message: e.message };
    }
  });
}
