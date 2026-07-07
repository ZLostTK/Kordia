import type { FastifyInstance } from 'fastify';
import { getDb } from '../database/connection.js';
import { PlaylistRepository } from '../database/playlists.js';

export async function playlistRoutes(app: FastifyInstance): Promise<void> {
  app.get('/playlists', async () => {
    return new PlaylistRepository(getDb()).getAllPlaylists();
  });

  app.post('/playlists', {
    schema: {
      body: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const { id, name } = req.body as { id: string; name: string };
    return new PlaylistRepository(getDb()).createPlaylist(id, name);
  });

  app.get('/playlists/:playlistId', async (req, reply) => {
    const { playlistId } = req.params as { playlistId: string };
    const pl = new PlaylistRepository(getDb()).getPlaylist(playlistId);
    if (!pl) return reply.code(404).send({ error: 'Playlist not found' });
    return pl;
  });

  app.put('/playlists/:playlistId', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const { playlistId } = req.params as { playlistId: string };
    const { name } = req.body as { name: string };
    const ok = new PlaylistRepository(getDb()).updatePlaylistName(playlistId, name);
    if (!ok) return reply.code(404).send({ error: 'Playlist not found' });
    return { status: 'success' };
  });

  app.delete('/playlists/:playlistId', async (req, reply) => {
    const { playlistId } = req.params as { playlistId: string };
    const ok = new PlaylistRepository(getDb()).deletePlaylist(playlistId);
    if (!ok) return reply.code(404).send({ error: 'Playlist not found' });
    return { status: 'success' };
  });

  app.post('/playlists/:playlistId/songs', {
    schema: {
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
    const { playlistId } = req.params as { playlistId: string };
    const song = req.body as { ytid: string; title: string; artist?: string; thumbnail?: string };
    const repo = new PlaylistRepository(getDb());
    if (!repo.getPlaylist(playlistId)) return reply.code(404).send({ error: 'Playlist not found' });
    repo.addSong(playlistId, song);
    return repo.getPlaylist(playlistId);
  });

  app.delete('/playlists/:playlistId/songs/:ytid', async (req, reply) => {
    const { playlistId, ytid } = req.params as { playlistId: string; ytid: string };
    const repo = new PlaylistRepository(getDb());
    const ok = repo.removeSong(playlistId, ytid);
    if (!ok) return reply.code(404).send({ error: 'Song or Playlist not found' });
    return repo.getPlaylist(playlistId);
  });
}
