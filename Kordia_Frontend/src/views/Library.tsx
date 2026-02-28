import { useState, useEffect } from 'react';
import { Play, Trash2, Download, Plus, List, Link, X, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sileo } from 'sileo';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { OfflineSong, Song } from '../types';
import { api } from '../services/api';

type Tab = 'songs' | 'playlists';

export default function Library() {
  const { playSong } = usePlayer();
  const { playlists, createPlaylist, deletePlaylist, addSongToPlaylist } = usePlaylists();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('songs');
  const [offlineSongs, setOfflineSongs] = useState<OfflineSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadOfflineSongs();
  }, []);

  const loadOfflineSongs = async () => {
    setIsLoading(true);
    try {
      const songs = await api.getOfflineSongs();
      setOfflineSongs(songs);
    } catch {
      sileo.error({ 
        title: 'Error al cargar la biblioteca',
        fill: "#171717",
        styles: { 
          title: "!text-[#FFFFFF]", 
          description: "!text-[#D1D5DB]"
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = (song: OfflineSong | Song) => {
    const songData: Song = {
      ytid: song.ytid,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      url: 'url' in song ? song.url : api.getOfflineAudioUrl(song.ytid),
    };
    
    // Si estamos en la pestaña de canciones (Descargadas)
    if (tab === 'songs') {
      playSong(songData, offlineSongs.map(s => ({
        ytid: s.ytid,
        title: s.title,
        artist: s.artist,
        thumbnail: s.thumbnail,
        url: api.getOfflineAudioUrl(s.ytid),
      })));
    } else {
      // Si venimos de un clic en playlist card, el llamador ya se encarga o usamos esto
      playSong(songData);
    }
  };

  const handleDelete = async (ytid: string) => {
    try {
      await api.deleteOfflineSong(ytid);
      setOfflineSongs(prev => prev.filter(s => s.ytid !== ytid));
      sileo.info({ 
        title: 'Canción eliminada de la biblioteca',
        fill: "#171717",
        styles: { 
          title: "!text-[#FFFFFF]", 
          description: "!text-[#D1D5DB]"
        }
      });
    } catch {
      sileo.error({ 
        title: 'Error al eliminar la canción',
        fill: "#171717",
        styles: { 
          title: "!text-[#FFFFFF]", 
          description: "!text-[#D1D5DB]"
        }
      });
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    sileo.success({ 
      title: `Playlist "${newPlaylistName}" creada`,
      fill: "#171717",
      styles: { 
        title: "!text-[#FFFFFF]", 
        description: "!text-[#D1D5DB]" 
      }
    });
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    deletePlaylist(id);
    sileo.info({ 
      title: `Playlist "${name}" eliminada`,
      fill: "#171717",
      styles: { 
        title: "!text-[#FFFFFF]", 
        description: "!text-[#D1D5DB]" 
      }
    });
  };
  const handlePlayPlaylist = (playlist: { name: string; songs: Song[] }) => {
    if (playlist.songs.length === 0) return;
    playSong(playlist.songs[0], playlist.songs);
    sileo.info({ 
      title: `Reproduciendo "${playlist.name}"`,
      fill: "#171717",
      styles: { 
        title: "!text-[#FFFFFF]", 
        description: "!text-[#D1D5DB]" 
      }
    });
  };
  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    try {
      const response = await fetch(`/playlist/import?url=${encodeURIComponent(importUrl.trim())}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      const pl = createPlaylist(data.title || 'Playlist importada', false);
      
      // Añadir las canciones importadas a la nueva playlist de manera asíncrona (aunque addSong es síncrono en state)
      if (data.songs && data.songs.length > 0) {
        data.songs.forEach((song: Song) => {
          addSongToPlaylist(pl.id, song);
        });
      }
      
      sileo.success({ 
        title: `Playlist "${pl.name}" importada con ${data.songs?.length ?? 0} canciones`,
        fill: "#171717",
        styles: { 
          title: "!text-[#FFFFFF]", 
          description: "!text-[#D1D5DB]"
        }
      });
      setImportUrl('');
      setShowImportModal(false);
    } catch {
      sileo.error({ 
        title: 'No se pudo importar la playlist', 
        description: 'Verifica la URL e intenta de nuevo',
        fill: "#171717",
        styles: { 
          title: "!text-[#FFFFFF]", 
          description: "!text-[#D1D5DB]"
        }
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Biblioteca</h2>
          <p className="text-gray-400 text-sm">
            {offlineSongs.length} canciones · {playlists.length} playlists
          </p>
        </div>
        {tab === 'playlists' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition text-sm"
            >
              <Link size={16} /> Importar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition text-sm"
            >
              <Plus size={16} /> Nueva
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('songs')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'songs' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Descargadas
        </button>
        <button
          onClick={() => setTab('playlists')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'playlists' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Playlists
        </button>
      </div>

      {/* Tab: Canciones descargadas */}
      {tab === 'songs' && (
        <>
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && offlineSongs.length === 0 && (
            <div className="text-center text-gray-400 py-16">
              <Download size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-1">No hay canciones descargadas</p>
              <p className="text-sm">Descarga canciones desde la búsqueda</p>
            </div>
          )}
          {!isLoading && offlineSongs.length > 0 && (
            <div className="space-y-2">
              {offlineSongs.map(song => (
                <div
                  key={song.ytid}
                  className="flex items-center gap-4 bg-gray-800 hover:bg-gray-750 rounded-lg p-3 group transition cursor-pointer"
                  onClick={() => handlePlay(song)}
                >
                  <img
                    src={song.thumbnail || `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`}
                    alt={song.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{song.title}</h4>
                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={e => { e.stopPropagation(); handlePlay(song); }}
                      className="bg-purple-600 hover:bg-purple-700 rounded-full p-2 transition"
                    >
                      <Play size={16} className="text-white fill-white" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(song.ytid); }}
                      className="text-gray-400 hover:text-red-500 transition p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Playlists */}
      {tab === 'playlists' && (
        <>
          {playlists.length === 0 && (
            <div className="text-center text-gray-400 py-16">
              <List size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-1">Sin playlists todavía</p>
              <p className="text-sm mb-4">Crea tu primera playlist o importa una de YouTube</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                Crear playlist
              </button>
            </div>
          )}
          {playlists.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map(pl => (
                <div
                  key={pl.id}
                  className="group relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition"
                  onClick={() => navigate(`/library/playlist/${pl.id}`)}
                >
                  <div className="aspect-square bg-gray-700 flex items-center justify-center relative">
                    {pl.coverThumbnail ? (
                      <img src={pl.coverThumbnail} alt={pl.name} className="w-full h-full object-cover" />
                    ) : (
                      <Music size={40} className="text-gray-500" />
                    )}
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(pl); }}
                        className="bg-purple-600 rounded-full p-3 transform scale-90 group-hover:scale-100 transition shadow-lg"
                      >
                        <Play size={20} className="text-white fill-white" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-medium truncate">{pl.name}</h3>
                    <p className="text-gray-400 text-sm">{pl.songs.length} canciones</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeletePlaylist(pl.id, pl.name); }}
                    className="absolute top-2 right-2 bg-gray-900 bg-opacity-80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  >
                    <Trash2 size={14} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal: Crear playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Nueva playlist</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              placeholder="Nombre de la playlist..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 mb-4"
              onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar playlist */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Importar playlist de YouTube</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <input
              type="url"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 mb-4 text-sm"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!importUrl.trim() || isImporting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Importar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
