import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

const MOCK_API_BASE_URL = ''; // Matches import.meta.env behavior in test env

describe('api service', () => {
  const originalFetch = global.fetch;
  const originalCaches = global.caches;

  beforeEach(() => {
    // Reset fetch
    global.fetch = vi.fn();
    // Reset caches mock
    global.caches = {
      open: vi.fn(),
      has: vi.fn(),
      keys: vi.fn(),
      delete: vi.fn(),
      match: vi.fn(),
    } as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.caches = originalCaches;
    vi.clearAllMocks();
  });

  it('downloadOffline calls backend API and manually caches the audio', async () => {
    const mockSong = {
      ytid: '12345',
      title: 'Test Song',
      artist: 'Test Artist',
      thumbnail: 'thumb.jpg'
    };

    const mockResponse = { ok: true, json: async () => ({}) } as Response;
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Mock caches.open
    const mockCache = {
      add: vi.fn().mockResolvedValue(undefined)
    };
    (global.caches.open as any).mockResolvedValue(mockCache);

    await api.downloadOffline(mockSong);

    // 1. the backend fetch was called
    expect(global.fetch).toHaveBeenCalledWith(`${MOCK_API_BASE_URL}/offline/download/12345`, expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('12345')
    }));

    // 2. the cache was opened
    expect(global.caches.open).toHaveBeenCalledWith('audio-cache');

    // 3. cache.add was called with the exact offline audio url
    const expectedAudioUrl = api.getOfflineAudioUrl('12345');
    expect(mockCache.add).toHaveBeenCalledWith(expectedAudioUrl);
  });
});
