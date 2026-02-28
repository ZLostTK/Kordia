import { SkipBack, SkipForward, Play, Pause, Volume2, List } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime } from '../utils/formatTime';

interface PlayerProps {
  onShowQueue: () => void;
}

export default function Player({ onShowQueue }: PlayerProps) {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    volume,
    setVolume,
    currentTime,
    duration,
    seek,
  } = usePlayer();

  if (!currentSong) {
    return null;
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-30 pb-safe">
      {/* Progress Bar (Mobile) - Absolute at top edge */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-1 bg-gray-800" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        seek((e.clientX - rect.left) / rect.width * duration);
      }}>
        <div 
          className="h-full bg-purple-600 transition-all pointer-events-none" 
          style={{ width: `${progressPercentage}%` }} 
        />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-2 lg:py-4">
        <div className="flex items-center justify-between gap-2 lg:gap-4">
          
          {/* Left: Thumbnail & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className="w-10 h-10 lg:w-14 lg:h-14 rounded object-cover shadow-md"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium text-sm lg:text-base truncate">
                {currentSong.title}
              </h4>
              <p className="text-gray-400 text-xs lg:text-sm truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>

          {/* Center: Controls (Desktop) | Right: Controls (Mobile) */}
          <div className="flex flex-col items-end lg:items-center justify-center flex-shrink-0 lg:flex-1 lg:max-w-2xl">
            <div className="flex items-center gap-1 lg:gap-4 lg:mb-2">
              <button
                onClick={playPrevious}
                className="hidden lg:block text-gray-400 hover:text-white transition p-2"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlay}
                className="bg-transparent lg:bg-purple-600 lg:hover:bg-purple-700 text-white lg:rounded-full p-2 lg:p-3 transition-colors"
              >
                {isPlaying ? <Pause size={28} className="lg:w-5 lg:h-5" /> : <Play size={28} className="lg:w-5 lg:h-5 fill-current lg:fill-none" />}
              </button>

              <button
                onClick={playNext}
                className="hidden lg:block text-gray-400 hover:text-white transition p-2"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Progress Bar (Desktop) */}
            <div className="hidden lg:flex w-full items-center gap-2 text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden flex items-center group cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seek((e.clientX - rect.left) / rect.width * duration);
                }}
              >
                <div
                  className="h-full bg-purple-600 transition-all rounded-r-full group-hover:bg-purple-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 justify-end flex-1 min-w-0">
            <button
              onClick={onShowQueue}
              className="text-gray-400 hover:text-white transition p-2"
            >
              <List size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Volume2 size={20} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
