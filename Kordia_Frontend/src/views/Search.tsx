import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { SearchResult, Song } from '../types';
import { api } from '../services/api';
import SongCard from '../components/SongCard';

export default function Search() {
  const { playSong } = usePlayer();
  const { playlists, addSongToPlaylist } = usePlaylists();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Auto-search cuando hay ?q= en la URL
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams.get('q')]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const searchResults = await api.search(q, 20);
      setResults(searchResults);
    } catch (error) {
      sileo.error({ title: 'Error al buscar', description: 'Verifica tu conexión e intenta de nuevo' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Actualizar la URL para bookmarking / compartir
    navigate(`/search?q=${encodeURIComponent(query.trim())}`, { replace: true });
    await doSearch(query);
  };

  const handlePlay = (result: SearchResult) => {
    const song: Song = {
      ytid: result.ytid,
      title: result.title,
      artist: result.artist,
      thumbnail: result.thumbnail,
      duration: result.duration,
    };
    playSong(song, results.map(r => ({
      ytid: r.ytid,
      title: r.title,
      artist: r.artist,
      thumbnail: r.thumbnail,
      duration: r.duration,
    })));
  };

  const handleDownload = async (result: SearchResult) => {
    if (downloadingIds.has(result.ytid)) return;
    setDownloadingIds(prev => new Set(prev).add(result.ytid));
    sileo.info({ title: 'Descargando...', description: result.title });
    try {
      await api.downloadOffline({
        ytid: result.ytid,
        title: result.title,
        artist: result.artist,
        thumbnail: result.thumbnail,
      });
      sileo.success({ title: 'Descarga completada', description: result.title });
    } catch {
      sileo.error({ title: 'Error al descargar', description: result.title });
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(result.ytid);
        return next;
      });
    }
  };

  const handleAddToPlaylist = (result: SearchResult, playlistId: string) => {
    const song: Song = { ytid: result.ytid, title: result.title, artist: result.artist, thumbnail: result.thumbnail };
    addSongToPlaylist(playlistId, song);
    sileo.success({ title: 'Añadido a la playlist' });
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Buscar</h2>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="¿Qué quieres escuchar?"
            className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map(result => (
            <SongCard
              key={result.ytid}
              song={{ ...result, duration: result.duration ?? undefined }}
              onPlay={() => handlePlay(result)}
              onDownload={() => handleDownload(result)}
              isDownloading={downloadingIds.has(result.ytid)}
              playlists={playlists}
              onAddToPlaylist={(pl) => handleAddToPlaylist(result, pl.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && results.length === 0 && query && (
        <div className="text-center text-gray-400 py-12">
          <SearchIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>No se encontraron resultados para "<span className="text-white">{query}</span>"</p>
        </div>
      )}

      {!query && !isLoading && (
        <div className="text-center text-gray-400 py-12">
          <SearchIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Busca tu música favorita</p>
        </div>
      )}
    </div>
  );
}
