import { Play, Music, Download, Smartphone, Server } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { Song } from '../types';
import { api } from '../services/api';
import { useEffect, useState, useMemo } from 'react';

export default function OfflineCachedView() {
  const { playSong, currentSong } = usePlayer();
  const { downloadedPlaylist } = usePlaylists();
  
  const [songStatus, setSongStatus] = useState<Record<string, boolean>>({});

  const originalOfflineSongs = useMemo(() => downloadedPlaylist?.songs || [], [downloadedPlaylist]);

  useEffect(() => {
    const checkCacheStatus = async () => {
      try {
        const audioCache = await caches.open('audio-cache');
        const status: Record<string, boolean> = {};

        for (const song of originalOfflineSongs) {
          const expectedUrl = api.getOfflineAudioUrl(song.ytid);
          const response = await audioCache.match(expectedUrl);
          status[song.ytid] = !!response;
        }
        
        setSongStatus(status);
      } catch (err) {
        console.error('No se pudo verificar el caché', err);
      }
    };

    if (originalOfflineSongs.length > 0) {
      checkCacheStatus();
    }
  }, [originalOfflineSongs]);

  const handlePlay = (song: Song) => {
    const songData: Song = {
      ...song,
      url: song.url || api.getOfflineAudioUrl(song.ytid),
    };
    
    playSong(songData, originalOfflineSongs.map(s => ({
      ...s,
      url: s.url || api.getOfflineAudioUrl(s.ytid),
    })));
  };

  const handlePlayAll = () => {
    if (originalOfflineSongs.length > 0) {
      handlePlay(originalOfflineSongs[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-6 text-white overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-purple-900/40 to-gray-900 p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-32 h-32 flex-shrink-0 bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex items-center justify-center overflow-hidden text-purple-500">
            {originalOfflineSongs[0]?.thumbnail ? (
              <img 
                src={originalOfflineSongs[0].thumbnail} 
                alt="Cover" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Download size={48} />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Biblioteca Offline</h1>
            <p className="text-gray-400 text-lg mb-4">
              Diferencia entre canciones descargadas en la <span className="text-purple-400 font-semibold">PC</span> y en este <span className="text-green-400 font-semibold">teléfono</span>.
            </p>
            <button 
              onClick={handlePlayAll}
              disabled={originalOfflineSongs.length === 0}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-purple-600/25 active:scale-95"
            >
              <Play size={20} className="fill-current" /> Reproducir todo
            </button>
          </div>
        </div>

        {/* List of songs */}
        <div className="p-4 sm:p-6 bg-gray-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Music size={20} className="text-purple-500" /> Todas las descargadas ({originalOfflineSongs.length})
            </h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-400">
                <Smartphone size={14} /> Local
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <Server size={14} /> Server
              </span>
            </div>
          </div>
          
          {originalOfflineSongs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-950/50 rounded-xl border border-gray-800/50">
              <Download size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-lg">No hay canciones descargadas</p>
              <p className="text-sm">Conéctate al servidor para ver tu biblioteca.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {originalOfflineSongs.map((song, index) => {
                const isActive = currentSong?.ytid === song.ytid;
                const isLocal = songStatus[song.ytid];
                return (
                  <div
                    key={song.ytid}
                    onClick={() => handlePlay(song)}
                    className={`flex items-center gap-4 p-3 rounded-xl transition cursor-pointer group border ${
                      isActive 
                        ? 'bg-purple-600/20 border-purple-500/50' 
                        : 'bg-transparent border-transparent hover:bg-gray-800/80 hover:border-gray-700/50'
                    }`}
                  >
                    <div className={`${isActive ? 'text-purple-400' : 'text-gray-500'} font-medium w-6 text-center`}>
                      {index + 1}
                    </div>
                    <div className="relative w-12 h-12 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                      <img
                        src={song.thumbnail || `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Badge in thumbnail corner */}
                      <div className={`absolute top-0 right-0 p-0.5 rounded-bl-md shadow-md ${isLocal ? 'bg-green-500' : 'bg-purple-500'}`}>
                         {isLocal ? <Smartphone size={10} className="text-white" /> : <Server size={10} className="text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate transition-colors ${isActive ? 'text-purple-400' : 'text-gray-100 group-hover:text-purple-400'}`}>
                        {song.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider ${
                          isLocal ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {isLocal ? <Smartphone size={8} /> : <Server size={8} />}
                          {isLocal ? 'Local' : 'Host'}
                        </span>
                      </div>
                    </div>
                    <button className={`${isActive ? 'text-purple-400 opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'} transition-opacity p-2 hover:bg-white/5 rounded-full`}>
                      <Play size={18} className="fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
