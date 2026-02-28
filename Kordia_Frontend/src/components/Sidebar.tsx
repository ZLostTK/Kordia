import { Home, Search, Library, Settings, X, Music } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlaylists } from '../contexts/PlaylistContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Buscar' },
  { path: '/library', icon: Library, label: 'Biblioteca' },
  { path: '/settings', icon: Settings, label: 'Ajustes' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { playlists } = usePlaylists();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-30
          flex flex-col w-64 bg-gray-900 border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header de la sidebar */}
        <div className="flex items-center justify-between p-6 flex-shrink-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Kordia
          </h1>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-1 transition-all text-left ${
                isActive(path)
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </button>
          ))}

          {/* Mis Playlists */}
          {playlists.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-2 font-semibold">
                Mis Playlists
              </p>
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleNav(`/library/playlist/${pl.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-all text-left ${
                    location.pathname === `/library/playlist/${pl.id}`
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {pl.coverThumbnail ? (
                    <img
                      src={pl.coverThumbnail}
                      alt={pl.name}
                      className="w-7 h-7 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Music size={14} className="text-gray-400" />
                    </div>
                  )}
                  <span className="font-medium truncate text-sm">{pl.name}</span>
                </button>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
