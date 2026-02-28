import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Song, PlayerState } from '../types';
import { api } from '../services/api';

interface PlayerContextType extends PlayerState {
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playSong = async (song: Song, newQueue?: Song[]) => {
    try {
      const audio = audioRef.current;
      let url = song.url;

      // Solo llamar a la API si no tenemos URL local (canciones offline ya tienen url)
      if (!url) {
        const streamData = await api.getStreamUrl(song.ytid);
        url = streamData.url;
      }

      audio.src = url;
      setCurrentSong({ ...song, url });

      if (newQueue) {
        setQueue(newQueue);
        setCurrentIndex(newQueue.findIndex(s => s.ytid === song.ytid));
      }

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play song:', error);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextSong = queue[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      playSong(nextSong);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      const prevSong = queue[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      playSong(prevSong);
    }
  };

  const setVolume = (newVolume: number) => {
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
  };

  const addToQueue = (song: Song) => {
    setQueue([...queue, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(queue.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const seek = (time: number) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        queue,
        currentIndex,
        playSong,
        togglePlay,
        playNext,
        playPrevious,
        setVolume,
        addToQueue,
        removeFromQueue,
        clearQueue,
        audioRef,
        currentTime,
        duration,
        seek,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
