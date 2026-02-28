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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3 md:py-4 z-30">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className="w-12 h-12 md:w-14 md:h-14 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium truncate text-sm md:text-base">
                {currentSong.title}
              </h4>
              <p className="text-gray-400 text-xs md:text-sm truncate">
                {currentSong.artist}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center flex-1 max-w-2xl">
            <div className="flex items-center gap-2 md:gap-4 mb-2">
              <button
                onClick={playPrevious}
                className="text-gray-400 hover:text-white transition p-2"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlay}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 md:p-3 transition"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={playNext}
                className="text-gray-400 hover:text-white transition p-2"
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div className="w-full flex items-center gap-2 text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all cursor-pointer"
                  style={{ width: `${progressPercentage}%` }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    seek(percentage * duration);
                  }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
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
                className="w-24 accent-purple-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
