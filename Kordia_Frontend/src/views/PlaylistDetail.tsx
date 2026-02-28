import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Trash2, Music, Shuffle, Download, Loader2 } from 'lucide-react';
import { sileo } from 'sileo';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { Song } from '../types';
import { api } from '../services/api';
import { useState } from 'react';

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { getPlaylist, removeSongFromPlaylist, deletePlaylist } = usePlaylists();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const playlist = getPlaylist(playlistId ?? '');

  if (!playlist) {
    return (
      <div className="p-6 text-center text-gray-400 py-16">
        <Music size={48} className="mx-auto mb-4 opacity-30" />
        <p>Playlist no encontrada</p>
        <button
          onClick={() => navigate('/library')}
          className="mt-4 text-purple-400 hover:text-purple-300 transition"
        >
          Volver a Biblioteca
        </button>
      </div>
    );
  }

  const handlePlay = (song: Song) => {
    playSong(song, playlist.songs);
  };

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    playSong(playlist.songs[0], playlist.songs);
    sileo.info({ 
      title: `Reproduciendo "${playlist.name}"`,
      fill: "#171717",
      styles: { title: "text-white!", description: "text-white/75!" }
    });
  };

  const handleShuffle = () => {
    if (playlist.songs.length === 0) return;
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
    sileo.info({ 
      title: 'Reproducción aleatoria activada',
      fill: "#171717",
      styles: { title: "text-white!", description: "text-white/75!" }
    });
  };

  const handleRemoveSong = (ytid: string, title: string) => {
    removeSongFromPlaylist(playlist.id, ytid);
    sileo.info({ 
      title: `"${title}" eliminada de la playlist`,
      fill: "#171717",
      styles: { title: "text-white!", description: "text-white/75!" }
    });
  };

  const handleDeletePlaylist = () => {
    deletePlaylist(playlist.id);
    sileo.info({ 
      title: `Playlist "${playlist.name}" eliminada`,
      fill: "#171717",
      styles: { title: "text-white!", description: "text-white/75!" }
    });
    navigate('/library');
  };

  const handleDownloadSong = async (song: Song) => {
    if (downloadingIds.has(song.ytid)) return;
    setDownloadingIds(prev => new Set(prev).add(song.ytid));
    try {
      await api.downloadOffline(song);
      sileo.success({ 
        title: `"${song.title}" descargada`,
        fill: "#171717",
        styles: { title: "text-white!", description: "text-white/75!" }
      });
    } catch {
      sileo.error({ 
        title: `Error al descargar "${song.title}"`,
        fill: "#171717",
        styles: { title: "text-white!", description: "text-white/75!" }
      });
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(song.ytid);
        return next;
      });
    }
  };

  const handleDownloadAll = async () => {
    if (isDownloadingAll || playlist.songs.length === 0) return;
    setIsDownloadingAll(true);
    let successCount = 0;
    
    sileo.info({ 
      title: 'Iniciando descarga de la playlist', 
      description: 'Las canciones se descargarán una por una',
      fill: "#171717",
      styles: { title: "text-white!", description: "text-white/75!" }
    });

    await Promise.all(playlist.songs.map(async (song) => {
      try {
        setDownloadingIds(prev => new Set(prev).add(song.ytid));
        await api.downloadOffline(song);
        successCount++;
      } catch (err) {
        console.error(`Failed to download ${song.title}`, err);
      } finally {
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(song.ytid);
          return next;
        });
      }
    }));

    setIsDownloadingAll(false);
    sileo.success({ 
      title: 'Descarga completada', 
      description: `Se descargaron ${successCount} de ${playlist.songs.length} canciones`,
      fill: "#171717",
      styles: { title: "text-white!", description: "text-white/75!" }
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/library')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
      >
        <ArrowLeft size={20} />
        <span>Biblioteca</span>
      </button>

      {/* Header de la playlist */}
      <div className="flex gap-6 mb-8 items-end">
        <div className="w-32 h-32 md:w-44 md:h-44 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
          {playlist.coverThumbnail ? (
            <img src={playlist.coverThumbnail} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <Music size={48} className="text-gray-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Playlist</p>
          <h1 className="text-white font-bold text-3xl md:text-4xl mb-2 truncate">{playlist.name}</h1>
          <p className="text-gray-400 text-sm">{playlist.songs.length} canciones</p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePlayAll}
              disabled={playlist.songs.length === 0}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-full transition font-medium"
            >
              <Play size={18} className="fill-white" /> Reproducir
            </button>
            <button
              onClick={handleShuffle}
              disabled={playlist.songs.length === 0}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-full transition"
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || playlist.songs.length === 0}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-full transition"
              title="Descargar todas"
            >
              {isDownloadingAll ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
            <button
              onClick={handleDeletePlaylist}
              className="flex items-center gap-2 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white px-4 py-2.5 rounded-full transition"
              title="Eliminar playlist"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de canciones */}
      {playlist.songs.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Music size={40} className="mx-auto mb-3 opacity-30" />
          <p>Añade canciones desde la búsqueda</p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.songs.map((song, i) => (
            <div
              key={song.ytid}
              className="flex items-center gap-4 rounded-lg p-3 group hover:bg-gray-800 transition cursor-pointer"
              onClick={() => handlePlay(song)}
            >
              <span className="text-gray-500 text-sm w-5 text-center flex-shrink-0 group-hover:hidden">
                {i + 1}
              </span>
              <Play size={16} className="text-white fill-white hidden group-hover:block flex-shrink-0" />
              <img
                src={song.thumbnail}
                alt={song.title}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{song.title}</p>
                <p className="text-gray-400 text-sm truncate">{song.artist}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={e => { e.stopPropagation(); handleDownloadSong(song); }}
                  disabled={downloadingIds.has(song.ytid)}
                  className="text-gray-400 hover:text-purple-400 transition p-2 disabled:opacity-50"
                  title="Descargar"
                >
                  {downloadingIds.has(song.ytid) ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleRemoveSong(song.ytid, song.title); }}
                  className="text-gray-500 hover:text-red-400 transition p-2"
                  title="Eliminar de playlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
