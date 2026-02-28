import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PlayerProvider } from './contexts/PlayerContext';
import { PlaylistProvider } from './contexts/PlaylistContext';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Queue from './components/Queue';
import Header from './components/Header';
import Home from './views/Home';
import Search from './views/Search';
import Library from './views/Library';
import Settings from './views/Settings';
import PlaylistDetail from './views/PlaylistDetail';

function App() {
  const [showQueue, setShowQueue] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PlayerProvider>
      <PlaylistProvider>
        <div className="min-h-screen bg-gray-950 flex">
          {/* Overlay oscuro en móvil cuando el sidebar está abierto */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-60 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="flex-1 flex flex-col min-w-0">
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <div className="flex-1 overflow-y-auto pb-24">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/library/playlist/:playlistId" element={<PlaylistDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </div>
          </main>

          <Player onShowQueue={() => setShowQueue(true)} />
          <Queue isOpen={showQueue} onClose={() => setShowQueue(false)} />
        </div>
      </PlaylistProvider>
    </PlayerProvider>
  );
}

export default App;
