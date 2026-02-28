import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const titles: Record<string, string> = {
  '/': 'Kordia',
  '/search': 'Buscar',
  '/library': 'Biblioteca',
  '/settings': 'Ajustes',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();

  const title = Object.entries(titles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'Kordia';

  return (
    <header className="md:hidden sticky top-0 bg-gray-900 border-b border-gray-800 px-4 py-3 z-10 flex-shrink-0">
      <div className="flex items-center justify-between">
        <button onClick={onMenuClick} className="text-gray-400 hover:text-white transition">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <div className="w-6" />
      </div>
    </header>
  );
}
