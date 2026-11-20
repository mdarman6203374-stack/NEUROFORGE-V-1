import React, { useMemo, useState } from 'react';
import {
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  Music2,
} from 'lucide-react';
import { Language } from '../types';
import { FocusStreamCategory } from '../data/focusMusicStreams';
import { useFocusMusic } from '../utils/focusMusicContext';

interface FocusMusicPlayerProps {
  language: Language;
}

const formatAudioTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ language }) => {
  const {
    streams,
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
  } = useFocusMusic();

  const [categoryFilter, setCategoryFilter] = useState<'all' | FocusStreamCategory>('all');

  const filteredStreams = useMemo(() => {
    if (categoryFilter === 'all') return streams;
    return streams.filter((s) => s.category === categoryFilter);
  }, [streams, categoryFilter]);

  return (
    <div
      className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm space-y-4 transition-colors ${
        isPlaying
          ? 'border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
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
                Focus Mode Music
              </h3>
              {isPlaying && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  PLAYING
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {language === 'hinglish'
                ? 'Ambient, Lo-Fi aur Deep Focus audio streams'
                : 'Curated Ambient, Lo-Fi & Deep Focus study streams'}
            </p>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => stepStream(-1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Previous stream"
            aria-label="Previous stream"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => togglePlay()}
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
            onClick={() => stepStream(1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Next stream"
            aria-label="Next stream"
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
              {activeStream.title}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
            {activeStream.categoryLabel.toUpperCase()} · {activeStream.bpm} BPM
          </span>
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
          {language === 'hinglish' ? activeStream.hinglishSubtitle : activeStream.subtitle}
        </p>

        {/* Audio Scrubber */}
        <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-slate-400 tabular-nums">
          <span>{formatAudioTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(1, duration || 12)}
            step={0.1}
            value={Math.min(currentTime, duration || 12)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek audio position"
            className="flex-1 h-1 accent-indigo-600 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
          />
          <span>{formatAudioTime(duration || 12)}</span>
        </div>
      </div>

      {/* Category Filter & Curated Stream Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Curated Streams ({filteredStreams.length})
          </span>
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'lofi', label: 'Lo-Fi' },
                { id: 'ambient', label: 'Ambient' },
                { id: 'deep-focus', label: 'Deep Focus' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
          {filteredStreams.map((pl) => {
            const selected = pl.id === selectedStreamId;
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => selectStream(pl.id, true)}
                aria-pressed={selected}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  selected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-800 dark:text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                  <span className="font-bold opacity-80">{pl.vibeTag}</span>
                  <span>{pl.categoryLabel}</span>
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
          onClick={toggleMute}
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
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
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
