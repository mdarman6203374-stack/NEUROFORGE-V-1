import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FOCUS_AUDIO_STREAMS,
  FocusAudioStream,
  buildFocusStreamWavUrl,
} from '../data/focusMusicStreams';

interface FocusMusicContextValue {
  streams: FocusAudioStream[];
  selectedStreamId: FocusAudioStream['id'];
  activeStream: FocusAudioStream;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  audioNotice: string | null;
  togglePlay: () => Promise<void>;
  selectStream: (id: FocusAudioStream['id'], autoPlay?: boolean) => void;
  stepStream: (dir: -1 | 1) => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  clearNotice: () => void;
}

const FocusMusicContext = createContext<FocusMusicContextValue | null>(null);

export const FocusMusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStreamId, setSelectedStreamId] = useState<FocusAudioStream['id']>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_focus_music_playlist');
      if (FOCUS_AUDIO_STREAMS.some((s) => s.id === saved)) {
        return saved as FocusAudioStream['id'];
      }
    } catch {}
    return 'midnight-rhodes';
  });

  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('ai_mastery_focus_music_volume'));
      if (Number.isFinite(saved) && saved >= 0 && saved <= 1) return saved;
    } catch {}
    return 0.55;
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Partial<Record<FocusAudioStream['id'], string>>>({});
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const activeStream = useMemo(
    () => FOCUS_AUDIO_STREAMS.find((s) => s.id === selectedStreamId) || FOCUS_AUDIO_STREAMS[0],
    [selectedStreamId]
  );

  const activeAudioSrc = useMemo(() => {
    const cached = urlCacheRef.current[activeStream.id];
    if (cached) return cached;
    const generated = buildFocusStreamWavUrl(activeStream);
    urlCacheRef.current[activeStream.id] = generated;
    return generated;
  }, [activeStream]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_focus_music_playlist', selectedStreamId);
    } catch {}
  }, [selectedStreamId]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_focus_music_volume', String(volume));
    } catch {}
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = isMuted ? 0 : volume;
    el.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = activeAudioSrc;
    el.load();
    setCurrentTime(0);
    if (isPlayingRef.current) {
      el.play().catch(() => {
        setIsPlaying(false);
        setAudioNotice('Click Play to resume focus audio stream.');
      });
    }
  }, [activeAudioSrc]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      Object.values(urlCacheRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    setAudioNotice(null);

    if (!el.paused) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        el.volume = isMuted ? 0 : volume;
        await el.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
        setAudioNotice('Browser blocked autoplay — press Play again to start audio.');
      }
    }
  };

  const selectStream = (id: FocusAudioStream['id'], autoPlay = false) => {
    setAudioNotice(null);
    if (id === selectedStreamId) {
      togglePlay();
      return;
    }
    if (autoPlay) {
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
    setSelectedStreamId(id);
  };

  const stepStream = (dir: -1 | 1) => {
    const idx = FOCUS_AUDIO_STREAMS.findIndex((s) => s.id === selectedStreamId);
    const nextIdx = (idx + dir + FOCUS_AUDIO_STREAMS.length) % FOCUS_AUDIO_STREAMS.length;
    setSelectedStreamId(FOCUS_AUDIO_STREAMS[nextIdx].id);
  };

  const seek = (seconds: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (nextVol: number) => {
    const clamped = Math.max(0, Math.min(1, nextVol));
    setVolumeState(clamped);
    if (isMuted && clamped > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((m) => !m);
  const clearNotice = () => setAudioNotice(null);

  return (
    <FocusMusicContext.Provider
      value={{
        streams: FOCUS_AUDIO_STREAMS,
        selectedStreamId,
        activeStream,
        isPlaying,
        isMuted,
        volume,
        currentTime,
        duration,
        audioNotice,
        togglePlay,
        selectStream,
        stepStream,
        seek,
        setVolume,
        toggleMute,
        clearNotice,
      }}
    >
      {/* Single shared persistent HTML5 audio player across Sidebar Card and Focus Mode Bottom Bar */}
      <audio
        ref={audioRef}
        src={activeAudioSrc}
        loop
        preload="auto"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {children}
    </FocusMusicContext.Provider>
  );
};

export const useFocusMusic = (): FocusMusicContextValue => {
  const ctx = useContext(FocusMusicContext);
  if (!ctx) {
    throw new Error('useFocusMusic must be used inside a FocusMusicProvider');
  }
  return ctx;
};
