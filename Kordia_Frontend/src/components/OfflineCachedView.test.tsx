import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflineCachedView from './OfflineCachedView';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';

// Mock contexts
vi.mock('../contexts/PlayerContext', () => ({
  usePlayer: vi.fn(),
}));

vi.mock('../contexts/PlaylistContext', () => ({
  usePlaylists: vi.fn(),
}));

describe('OfflineCachedView', () => {
  const mockPlaySong = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePlayer as any).mockReturnValue({
      playSong: mockPlaySong,
    });
    // Mock caches Match returning a response so tests show songs
    (global.caches.open as any).mockResolvedValue({
      match: vi.fn().mockResolvedValue({} as Response), // Simulate found
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly when there are downloaded songs', async () => {
    (usePlaylists as any).mockReturnValue({
      downloadedPlaylist: {
        songs: [
          { ytid: '1', title: 'Song 1', artist: 'Artist A', thumbnail: 'thumb1.jpg' },
          { ytid: '2', title: 'Song 2', artist: 'Artist B', thumbnail: 'thumb2.jpg', url: '/offline/audio/2' }
        ]
      }
    });

    render(<OfflineCachedView />);

    expect(screen.getByText('Modo Sin Conexión')).toBeInTheDocument();
    expect(screen.getByText(/Canciones en caché/)).toBeInTheDocument();
    
    // Check that songs render after async effect
    expect(await screen.findByText('Song 1')).toBeInTheDocument();
    expect(await screen.findByText('Artist B')).toBeInTheDocument();
  });

  it('shows empty state when there are no downloaded songs', async () => {
    (usePlaylists as any).mockReturnValue({
      downloadedPlaylist: {
        songs: []
      }
    });

    render(<OfflineCachedView />);

    expect(await screen.findByText('No hay canciones descargadas')).toBeInTheDocument();
  });

  it('plays all songs starting from the first one when clicking "Reproducir todo"', async () => {
    const mockSongs = [
      { ytid: '1', title: 'Song 1', artist: 'Artist A' }
    ];
    (usePlaylists as any).mockReturnValue({
      downloadedPlaylist: { songs: mockSongs }
    });

    render(<OfflineCachedView />);

    const playAllBtn = await screen.findByRole('button', { name: /Reproducir todo/i });
    fireEvent.click(playAllBtn);

    expect(mockPlaySong).toHaveBeenCalledTimes(1);
    // Should be called with the first song
    expect(mockPlaySong.mock.calls[0][0]).toMatchObject({ title: 'Song 1' });
  });
});
