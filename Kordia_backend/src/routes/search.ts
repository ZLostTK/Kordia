import type { FastifyInstance } from 'fastify';
import { YouTubeService } from '../services/youtube.js';

const youtube = new YouTubeService();

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string' },
          max_results: { type: 'integer', default: 10 },
        },
      },
    },
  }, async (req) => {
    const { q, max_results } = req.query as { q: string; max_results?: number };
    try {
      const results = await youtube.search(q, max_results ?? 10);
      return results.map(e => ({
        ytid: e.id,
        title: e.title,
        artist: e.uploader,
        thumbnail: e.thumbnail || e.thumbnails?.[e.thumbnails.length - 1]?.url,
        duration: e.duration,
      }));
    } catch (e: any) {
      throw { statusCode: 500, message: `Error en busqueda: ${e.message}` };
    }
  });

  app.get('/playlist/import', {
    schema: {
      querystring: {
        type: 'object',
        required: ['url'],
        properties: { url: { type: 'string' } },
      },
    },
  }, async (req) => {
    const { url } = req.query as { url: string };
    try {
      const result = await youtube.getPlaylist(url);
      return {
        title: result.title,
        songs: result.songs.map(e => ({
          ytid: e.id,
          title: e.title,
          artist: e.uploader || e.channel,
          thumbnail: e.thumbnail || e.thumbnails?.[e.thumbnails.length - 1]?.url,
          duration: e.duration,
        })),
      };
    } catch (e: any) {
      throw { statusCode: 500, message: `Error importando playlist: ${e.message}` };
    }
  });
}
