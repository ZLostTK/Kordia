import type { FastifyInstance } from 'fastify';
import { config } from '../config/env.js';
import { getDb } from '../database/connection.js';
import { StreamCacheRepository } from '../database/stream-cache.js';

export async function maintenanceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: { app: { type: 'string' }, version: { type: 'string' }, status: { type: 'string' } },
        },
      },
    },
  }, async () => ({
    app: config.appName,
    version: config.appVersion,
    status: 'running',
  }));

  app.post('/cleanup', async () => {
    try {
      const repo = new StreamCacheRepository(getDb());
      const deleted = repo.deleteOldEntries(config.cacheCleanupDays);
      return { success: true, deleted };
    } catch {
      return { success: false, deleted: 0 };
    }
  });
}
