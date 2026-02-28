import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock contexts and sub-components so we only test App's conditional logic
vi.mock('../contexts/PlayerContext', () => ({
  PlayerProvider: ({ children }: any) => <div>{children}</div>,
  usePlayer: () => ({ currentSong: null })
}));

vi.mock('../contexts/PlaylistContext', () => ({
  PlaylistProvider: ({ children }: any) => <div>{children}</div>,
  usePlaylists: () => ({ playlists: [], downloadedPlaylist: { songs: [] } })
}));

vi.mock('./Sidebar', () => ({
  default: () => <aside data-testid="sidebar">Sidebar Mock</aside>
}));

vi.mock('./Header', () => ({
  default: () => <header data-testid="header">Header Mock</header>
}));

vi.mock('./Player', () => ({
  default: () => <div data-testid="player">Player Mock</div>
}));

vi.mock('./Queue', () => ({
  default: () => <div data-testid="queue">Queue Mock</div>
}));

vi.mock('./OfflineCachedView', () => ({
  default: () => <div data-testid="offline-view">OfflineCachedView Mock</div>
}));

describe('App routing and offline logic', () => {

  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });

  it('renders standard layout (Sidebar, Header, Main Route) when online on desktop', () => {
    // Mock Online & Desktop
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders standard layout when offline on DESKTOP (doesn\'t trigger mobile view)', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false); // Offline
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', // Desktop
      configurable: true
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('offline-view')).not.toBeInTheDocument();
  });

  it('renders ONLY OfflineCachedView when OFFLINE on MOBILE', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false); // Offline
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', // Mobile
      configurable: true
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Sidebar and header should be replaced by the Offline View
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.getByTestId('offline-view')).toBeInTheDocument();
  });

  it('dynamically switches to OfflineCachedView when "offline" event fires on mobile', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true); // Starts online
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; SM-S918B)', // Mobile
      configurable: true
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Initial state: Online, shows Sidebar
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();

    // Trigger offline event manually
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Should now show Offline view
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.getByTestId('offline-view')).toBeInTheDocument();
  });

});
