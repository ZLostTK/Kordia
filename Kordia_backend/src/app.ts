import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from './config/env.js';
import { maintenanceRoutes } from './routes/maintenance.js';
import { searchRoutes } from './routes/search.js';
import { streamRoutes } from './routes/stream.js';
import { offlineRoutes } from './routes/offline.js';
import { playlistRoutes } from './routes/playlists.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.debug ? 'debug' : 'info',
      transport: { target: 'pino/file', options: { destination: 1 } },
    },
  });

  // CORS
  const isWildcard = config.corsOrigins.includes('*');
  await app.register(cors, {
    origin: isWildcard ? true : config.corsOrigins,
    credentials: !isWildcard,
  });

  // Global error handler
  app.setErrorHandler((error, req, reply) => {
    const err = error as any;
    const statusCode = err.statusCode ?? 500;
    const message = err.message ?? 'Internal server error';
    if (statusCode >= 500) {
      req.log.error({ err: error, url: req.url }, message);
    }
    return reply.code(statusCode).send({ error: message });
  });

  // Routes
  await app.register(maintenanceRoutes);
  await app.register(searchRoutes);
  await app.register(streamRoutes);
  await app.register(offlineRoutes);
  await app.register(playlistRoutes);

  // Static files (SPA)
  const staticDir = resolve(config.staticDir);
  if (existsSync(staticDir)) {
    const assetsDir = resolve(staticDir, 'assets');
    if (existsSync(assetsDir)) {
      await app.register(staticFiles, {
        root: assetsDir,
        prefix: '/assets/',
      });
    }

    // Catch-all for SPA
    app.setNotFoundHandler(async (req, reply) => {
      if (req.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      const filePath = resolve(staticDir, req.url.slice(1));
      if (existsSync(filePath)) {
        return reply.sendFile(req.url.slice(1), staticDir);
      }
      return reply.sendFile('index.html', staticDir);
    });
  }

  return app;
}
