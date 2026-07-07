import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { api } from './api';

interface Track {
  ytid: string; title: string; artist?: string | null; thumbnail?: string;
}

interface PlayerCtx {
  track: Track | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffering: boolean;
  play: (t: Track) => void;
  toggle: () => void;
  seek: (s: number) => void;
}

const Ctx = createContext<PlayerCtx>(null!);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const sourceRef = useRef<string | null>(null);

  const player = useAudioPlayer(null);

  const status = useAudioPlayerStatus(player);
  const playing = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;
  const buffering = status?.isBuffering ?? false;

  const play = useCallback(async (t: Track) => {
    setTrack(t);
    const url = api.getAudioUrl(t.ytid);
    if (sourceRef.current !== url) {
      sourceRef.current = url;
      player.replace(url);
    }
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
    player.setActiveForLockScreen(true, { title: t.title, artist: t.artist ?? undefined });
    player.play();
  }, [player]);

  const toggle = useCallback(() => {
    if (playing) player.pause();
    else player.play();
  }, [player, playing]);

  const seek = useCallback((s: number) => {
    player.seekTo(s);
  }, [player]);

  return (
    <Ctx.Provider value={{ track, playing, currentTime, duration, buffering, play, toggle, seek }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  return useContext(Ctx);
}
