import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  Music2
} from 'lucide-react';
import { Language } from '../types';

interface FocusMusicPlayerProps {
  language: Language;
}

export interface LofiPlaylist {
  id: 'midnight-rhodes' | 'deep-work-tape' | 'rainy-kyoto' | 'alpha-study';
  title: string;
  subtitle: string;
  hinglishSubtitle: string;
  bpm: number;
  vibeTag: string;
  chords: number[][]; // Frequencies in Hz for 4-bar progression
  tempoBpm: number;
  warmthHz: number;
  beatStyle: 'lofi-groove' | 'ambient-pad' | 'rain-jazz' | 'alpha-drone';
}

const LOFI_PLAYLISTS: LofiPlaylist[] = [
  {
    id: 'midnight-rhodes',
    title: 'Midnight Lo-Fi Rhodes',
    subtitle: 'Warm electric piano chords, dusty sub & mellow groove',
    hinglishSubtitle: 'Warm electric piano chords aur soft late-night coding beat',
    bpm: 76,
    vibeTag: 'CODING FLOW',
    // Fmaj7 -> Em7 -> Dm7 -> Cmaj7
    chords: [
      [174.61, 220.0, 261.63, 329.63],
      [164.81, 196.0, 246.94, 293.66],
      [146.83, 174.61, 220.0, 261.63],
      [130.81, 164.81, 196.0, 246.94]
    ],
    tempoBpm: 76,
    warmthHz: 1150,
    beatStyle: 'lofi-groove'
  },
  {
    id: 'deep-work-tape',
    title: 'Deep Work Analog Tape',
    subtitle: 'Floating tape synths & slow harmonic swells for problem solving',
    hinglishSubtitle: 'Deep algorithms & Math solve karne ke liye calm tape swells',
    bpm: 68,
    vibeTag: 'DEEP WORK',
    // Cmaj9 -> Am9 -> Fmaj7 -> G6
    chords: [
      [130.81, 196.0, 246.94, 293.66],
      [110.0, 164.81, 220.0, 246.94],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 329.63]
    ],
    tempoBpm: 68,
    warmthHz: 900,
    beatStyle: 'ambient-pad'
  },
  {
    id: 'rainy-kyoto',
    title: 'Rainy Kyoto Desk Beats',
    subtitle: 'Jazz-hop lo-fi percussion with gentle rain-washed keys',
    hinglishSubtitle: 'Halki barish jaisa texture + relaxing jazz lo-fi rhythm',
    bpm: 80,
    vibeTag: 'CHILL BEATS',
    // Dm9 -> G13 -> Cmaj9 -> A7
    chords: [
      [146.83, 174.61, 220.0, 329.63],
      [196.0, 246.94, 293.66, 329.63],
      [130.81, 164.81, 246.94, 293.66],
      [110.0, 164.81, 207.65, 261.63]
    ],
    tempoBpm: 80,
    warmthHz: 1300,
    beatStyle: 'rain-jazz'
  },
  {
    id: 'alpha-study',
    title: 'Alpha Memory Harmonics',
    subtitle: 'Calming 10Hz alpha-modulated fifths for active recall & reading',
    hinglishSubtitle: 'Reading, notes aur SRS flashcards ke liye gentle alpha drone',
    bpm: 72,
    vibeTag: 'RECALL & READ',
    // Calm consonant fifths/ninths
    chords: [
      [130.81, 196.0, 261.63, 392.0],
      [146.83, 220.0, 293.66, 329.63],
      [164.81, 246.94, 329.63, 392.0],
      [130.81, 196.0, 261.63, 293.66]
    ],
    tempoBpm: 72,
    warmthHz: 820,
    beatStyle: 'alpha-drone'
  }
];

/**
 * Generates a warm, seamless 4-bar stereo 16-bit PCM WAV Blob URL for the HTML5 <audio> element
 * so lo-fi study beats play natively via HTMLAudioElement with zero broken CDN URLs.
 */
function buildLofiWavObjectUrl(playlist: LofiPlaylist): string {
  const sampleRate = 22050;
  const beatsPerBar = 4;
  const numBars = playlist.chords.length; // 4 chords = 16 beats (~12-14s seamless loop)
  const beatDuration = 60 / playlist.tempoBpm;
  const totalSeconds = beatDuration * beatsPerBar * numBars;
  const totalSamples = Math.floor(sampleRate * totalSeconds);

  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // One-pole lowpass state for soothing tape warmth
  const rc = 1 / (2 * Math.PI * playlist.warmthHz);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let lpL = 0;
  let lpR = 0;

  // Pseudo-random seeded generator for gentle repeatable vinyl/rain texture
  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barFloat = t / (beatDuration * beatsPerBar);
    const barIdx = Math.min(numBars - 1, Math.floor(barFloat));
    const barLocalT = t - barIdx * beatDuration * beatsPerBar;
    const barDur = beatDuration * beatsPerBar;

    // Crossfade bar envelope for clickless chord transitions
    const attackEnv = Math.min(1, barLocalT / 0.14);
    const releaseEnv = Math.min(1, (barDur - barLocalT) / 0.18);
    const chordEnv = attackEnv * releaseEnv;

    const chord = playlist.chords[barIdx];

    // Electric piano / warm pad voices with subtle chorus detune across L/R
    let sampleL = 0;
    let sampleR = 0;
    for (let v = 0; v < chord.length; v++) {
      const freq = chord[v];
      // Slight gentle key strike transient at start of each bar for Rhodes presets
      const decay =
        playlist.beatStyle === 'lofi-groove' || playlist.beatStyle === 'rain-jazz'
          ? Math.exp(-barLocalT * 0.42) * 0.72 + 0.28
          : 1;
      const tremolo =
        playlist.beatStyle === 'alpha-drone'
          ? 0.85 + 0.15 * Math.sin(2 * Math.PI * 10 * t) // 10 Hz gentle alpha shimmer
          : 0.92 + 0.08 * Math.sin(2 * Math.PI * 0.35 * t + v);

      const phaseL = 2 * Math.PI * (freq * (1 - 0.0018)) * t;
      const phaseR = 2 * Math.PI * (freq * (1 + 0.0018)) * t;

      // Fundamental + soft 2nd harmonic warmth
      const toneL = (Math.sin(phaseL) + 0.18 * Math.sin(2 * phaseL)) * tremolo * decay;
      const toneR = (Math.sin(phaseR) + 0.18 * Math.sin(2 * phaseR)) * tremolo * decay;

      sampleL += toneL * (v === 0 ? 0.28 : 0.17);
      sampleR += toneR * (v === 0 ? 0.28 : 0.17);
    }

    // Warm sub bass root note (1 octave below chord root)
    const bassFreq = chord[0] * 0.5;
    const bassSub = Math.sin(2 * Math.PI * bassFreq * t) * 0.2 * chordEnv;
    sampleL += bassSub;
    sampleR += bassSub;

    // Soft lo-fi beat pulse (kick on beats 0 & 2, brush snare on beats 1 & 3)
    if (playlist.beatStyle === 'lofi-groove' || playlist.beatStyle === 'rain-jazz') {
      const beatIndexFloat = t / beatDuration;
      const beatInBar = Math.floor(beatIndexFloat) % 4;
      const beatLocalT = (beatIndexFloat - Math.floor(beatIndexFloat)) * beatDuration;

      // Muted warm kick on beats 0 and 2 (and soft syncopated ghost kick)
      if (beatInBar === 0 || beatInBar === 2) {
        const kickEnv = Math.exp(-beatLocalT * 18);
        const kickFreq = 52 + 85 * Math.exp(-beatLocalT * 42);
        const kick = Math.sin(2 * Math.PI * kickFreq * beatLocalT) * kickEnv * 0.34;
        sampleL += kick;
        sampleR += kick;
      }

      // Brushed soft snare puff on beats 1 & 3
      if (beatInBar === 1 || beatInBar === 3) {
        const snareEnv = Math.exp(-beatLocalT * 26);
        const brushNoise = (nextRand() * 2 - 1) * snareEnv * 0.12;
        const rimTone = Math.sin(2 * Math.PI * 185 * beatLocalT) * snareEnv * 0.08;
        sampleL += brushNoise + rimTone;
        sampleR += brushNoise * 0.85 + rimTone;
      }

      // Soft eighth-note hi-hat tick
      const eighthLocalT = ((beatIndexFloat * 2) % 1) * (beatDuration * 0.5);
      const hatEnv = Math.exp(-eighthLocalT * 65);
      const hat = (nextRand() * 2 - 1) * hatEnv * 0.04;
      sampleL += hat * 0.7;
      sampleR += hat;
    }

    // Subtle calming vinyl warmth / rain wash bed
    const vinylNoise = (nextRand() * 2 - 1) * (playlist.beatStyle === 'rain-jazz' ? 0.032 : 0.012);
    sampleL = (sampleL * chordEnv + vinylNoise) * 0.72;
    sampleR = (sampleR * chordEnv + vinylNoise * 0.9) * 0.72;

    // Smooth single-pole lowpass filter
    lpL = lpL + alpha * (sampleL - lpL);
    lpR = lpR + alpha * (sampleR - lpR);

    // Loop boundary crossfade (first/last 40ms) so loop wrap is seamless
    const fadeSamples = Math.floor(sampleRate * 0.04);
    let loopGain = 1;
    if (i < fadeSamples) loopGain = i / fadeSamples;
    else if (i > totalSamples - fadeSamples) loopGain = (totalSamples - i) / fadeSamples;

    left[i] = Math.max(-0.92, Math.min(0.92, lpL * loopGain));
    right[i] = Math.max(-0.92, Math.min(0.92, lpR * loopGain));
  }

  // Encode stereo 16-bit PCM WAV container
  const dataBytes = totalSamples * 2 * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 2, true); // Stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true); // Byte rate
  view.setUint16(32, 4, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const lSample = Math.max(-1, Math.min(1, left[i]));
    const rSample = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, lSample < 0 ? lSample * 0x8000 : lSample * 0x7fff, true);
    view.setInt16(offset + 2, rSample < 0 ? rSample * 0x8000 : rSample * 0x7fff, true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

const formatAudioTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ language }) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<LofiPlaylist['id']>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_focus_music_playlist');
      if (LOFI_PLAYLISTS.some((p) => p.id === saved)) {
        return saved as LofiPlaylist['id'];
      }
    } catch {}
    return 'midnight-rhodes';
  });

  const [volume, setVolume] = useState<number>(() => {
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
  const urlCacheRef = useRef<Partial<Record<LofiPlaylist['id'], string>>>({});

  const activePlaylist = useMemo(
    () => LOFI_PLAYLISTS.find((p) => p.id === selectedPlaylistId) || LOFI_PLAYLISTS[0],
    [selectedPlaylistId]
  );

  // Lazily build and cache WAV object URL for the active playlist
  const activeAudioSrc = useMemo(() => {
    const cached = urlCacheRef.current[activePlaylist.id];
    if (cached) return cached;
    const generated = buildLofiWavObjectUrl(activePlaylist);
    urlCacheRef.current[activePlaylist.id] = generated;
    return generated;
  }, [activePlaylist]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_focus_music_playlist', selectedPlaylistId);
    } catch {}
  }, [selectedPlaylistId]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_focus_music_volume', String(volume));
    } catch {}
  }, [volume]);

  // Keep HTMLAudioElement volume & muted synced
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = isMuted ? 0 : volume;
    el.muted = isMuted;
  }, [volume, isMuted]);

  // Switch playlist track cleanly and auto-resume if already playing
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = activeAudioSrc;
    el.load();
    setCurrentTime(0);
    if (isPlaying) {
      el.play().catch(() => {
        setIsPlaying(false);
        setAudioNotice('Click Play to resume lo-fi beats.');
      });
    }
  }, [activeAudioSrc]);

  // Revoke object URLs cleanly on unmount
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

  const handleTogglePlay = async () => {
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

  const handleStepPlaylist = (dir: -1 | 1) => {
    const idx = LOFI_PLAYLISTS.findIndex((p) => p.id === selectedPlaylistId);
    const nextIdx = (idx + dir + LOFI_PLAYLISTS.length) % LOFI_PLAYLISTS.length;
    setSelectedPlaylistId(LOFI_PLAYLISTS[nextIdx].id);
  };

  const handleSelectPlaylist = (id: LofiPlaylist['id']) => {
    setAudioNotice(null);
    if (id === selectedPlaylistId) {
      handleTogglePlay();
    } else {
      setSelectedPlaylistId(id);
    }
  };

  const handleSeek = (val: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = val;
    setCurrentTime(val);
  };

  return (
    <div
      className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm space-y-4 transition-colors ${
        isPlaying
          ? 'border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Hidden native HTML5 Audio Element */}
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

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isPlaying
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {isPlaying ? (
              <Disc3 className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            ) : (
              <Headphones className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                Focus Music · Lo-Fi Beats
              </h3>
              {isPlaying && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  PLAYING
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {language === 'hinglish'
                ? 'Calming HTML5 Audio lo-fi beats deep study ke liye'
                : 'Calming HTML5 Audio study beats · switch playlists anytime'}
            </p>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleStepPlaylist(-1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Previous playlist"
            aria-label="Previous playlist"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleStepPlaylist(1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Next playlist"
            aria-label="Next playlist"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Now Playing Card + Scrubber */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Music2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {activePlaylist.title}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
            {activePlaylist.bpm} BPM · LOOP
          </span>
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
          {language === 'hinglish' ? activePlaylist.hinglishSubtitle : activePlaylist.subtitle}
        </p>

        {/* Native Audio Scrubber */}
        <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-slate-400 tabular-nums">
          <span>{formatAudioTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(1, duration || 12)}
            step={0.1}
            value={Math.min(currentTime, duration || 12)}
            onChange={(e) => handleSeek(Number(e.target.value))}
            aria-label="Seek audio position"
            className="flex-1 h-1 accent-indigo-600 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
          />
          <span>{formatAudioTime(duration || 12)}</span>
        </div>
      </div>

      {/* Playlist Switcher Grid */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          Study Playlists ({LOFI_PLAYLISTS.length})
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LOFI_PLAYLISTS.map((pl) => {
            const selected = pl.id === selectedPlaylistId;
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => handleSelectPlaylist(pl.id)}
                aria-pressed={selected}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  selected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-800 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                  <span className="font-bold opacity-80">{pl.vibeTag}</span>
                  <span>{pl.bpm}bpm</span>
                </div>
                <div className="text-xs font-semibold leading-tight truncate">{pl.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {audioNotice && (
        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5">
          {audioNotice}
        </div>
      )}

      {/* Volume & Mute Bar */}
      <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
          title={isMuted ? 'Unmute focus music' : 'Mute focus music'}
          aria-label={isMuted ? 'Unmute focus music' : 'Mute focus music'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : Math.round(volume * 100)}
          onChange={(e) => {
            const nextVol = Number(e.target.value) / 100;
            setVolume(nextVol);
            if (isMuted && nextVol > 0) setIsMuted(false);
          }}
          aria-label="Focus music volume"
          className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
        />

        <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 w-9 text-right tabular-nums">
          {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
        </span>
      </div>
    </div>
  );
};
