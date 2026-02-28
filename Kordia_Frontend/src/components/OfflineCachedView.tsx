import { Play, Music, Download } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylists } from '../contexts/PlaylistContext';
import { Song } from '../types';
import { api } from '../services/api';

export default function OfflineCachedView() {
  const { playSong, currentSong } = usePlayer();
  const { downloadedPlaylist } = usePlaylists();
  
  const offlineSongs = downloadedPlaylist?.songs || [];

  const handlePlay = (song: Song) => {
    const songData: Song = {
      ytid: song.ytid,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      url: song.url || api.getOfflineAudioUrl(song.ytid),
    };
    
    playSong(songData, offlineSongs.map(s => ({
      ...s,
      url: s.url || api.getOfflineAudioUrl(s.ytid),
    })));
  };

  const handlePlayAll = () => {
    if (offlineSongs.length > 0) {
      handlePlay(offlineSongs[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-6 text-white overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-purple-900/40 to-gray-900 p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-32 h-32 flex-shrink-0 bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex items-center justify-center overflow-hidden">
            {offlineSongs[0]?.thumbnail ? (
              <img 
                src={offlineSongs[0].thumbnail} 
                alt="Cover" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = ''; 
                  (e.target as HTMLImageElement).className = 'hidden';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
                }}
              />
            ) : (
              <Download size={48} className="text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Modo Sin Conexión</h1>
            <p className="text-gray-400 text-lg mb-4">Estas canciones están guardadas en caché y puedes escucharlas sin internet.</p>
            <button 
              onClick={handlePlayAll}
              disabled={offlineSongs.length === 0}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-purple-600/25 active:scale-95"
            >
              <Play size={20} className="fill-current" /> Reproducir todo
            </button>
          </div>
        </div>

        {/* List of songs */}
        <div className="p-4 sm:p-6 bg-gray-900">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Music size={20} className="text-purple-500" /> Canciones en caché ({offlineSongs.length})
          </h2>
          
          {offlineSongs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-950/50 rounded-xl border border-gray-800/50">
              <Download size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-lg">No hay canciones descargadas</p>
              <p className="text-sm">Conéctate a internet para descargar música.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {offlineSongs.map((song, index) => {
                const isActive = currentSong?.ytid === song.ytid;
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
                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                      <img
                        src={song.thumbnail || `https://i.ytimg.com/vi/${song.ytid}/mqdefault.jpg`}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        onError={e => { 
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'; 
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate transition-colors ${isActive ? 'text-purple-400' : 'text-gray-100 group-hover:text-purple-400'}`}>
                        {song.title}
                      </h4>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
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
