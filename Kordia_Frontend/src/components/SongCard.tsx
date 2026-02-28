import { Play, Loader2, Plus, Check, Smartphone, Server } from 'lucide-react';
import { useState, useRef } from 'react';
import { Song, Playlist } from '../types';
import { isMobileDevice } from '../utils/device';

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  onDownload?: (song: Song) => void;
  isDownloading?: boolean;
  isDownloaded?: boolean;
  showDownload?: boolean;
  playlists?: Playlist[];
  onAddToPlaylist?: (playlist: Playlist) => void;
}

export default function SongCard({
  song,
  onPlay,
  onDownload,
  isDownloading = false,
  isDownloaded = false,
  showDownload = true,
  playlists = [],
  onAddToPlaylist,
}: SongCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isMobile = isMobileDevice();
  const filterPlaylists = playlists.filter(pl => pl.id !== 'downloaded');

  return (
    <div
      className="group relative bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer"
      onClick={() => onPlay(song)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square mb-3 rounded overflow-hidden bg-gray-700">
        <img
          src={song.thumbnail || `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`}
          alt={song.title}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`; }}
        />
        {/* Play button overlay */}
        <button
          onClick={e => { e.stopPropagation(); onPlay(song); }}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition opacity-0 group-hover:opacity-100"
        >
          <div className="bg-purple-600 rounded-full p-3 scale-90 group-hover:scale-100 transition">
            <Play size={22} className="text-white fill-white" />
          </div>
        </button>
      </div>

      <h3 className="text-white font-medium truncate text-sm mb-0.5">{song.title}</h3>
      <p className="text-gray-400 text-xs truncate">{song.artist}</p>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        {/* Add to playlist */}
        {onAddToPlaylist && filterPlaylists.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
              className="bg-gray-900/80 hover:bg-purple-600 p-1.5 rounded-full transition"
              title="Añadir a playlist"
            >
              <Plus size={14} className="text-white" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 min-w-40 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {filterPlaylists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => { onAddToPlaylist(pl); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition truncate"
                  >
                    {pl.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Download */}
        {showDownload && onDownload && (
          <button
            onClick={e => { e.stopPropagation(); onDownload(song); }}
            disabled={isDownloading || isDownloaded}
            className={`bg-gray-900/80 hover:bg-purple-600 disabled:opacity-60 p-1.5 rounded-full transition ${isDownloaded ? 'text-green-500' : 'text-white'}`}
            title={isDownloaded ? "Descargado" : (isMobile ? "Caché Local" : "Descargar al Host")}
          >
            {isDownloading
              ? <Loader2 size={14} className="text-white animate-spin" />
              : isDownloaded 
                ? <Check size={14} />
                : isMobile ? <Smartphone size={14} /> : <Server size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
