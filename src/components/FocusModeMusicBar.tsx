import React, { useMemo, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  Headphones,
  ListMusic,
  ChevronDown,
  ChevronUp,
  Radio,
  Sparkles,
  Check,
} from 'lucide-react';
import { Language } from '../types';
import { FocusStreamCategory } from '../data/focusMusicStreams';
import { useFocusMusic } from '../utils/focusMusicContext';

interface FocusModeMusicBarProps {
  language: Language;
}

const formatAudioTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const FocusModeMusicBar: React.FC<FocusModeMusicBarProps> = ({ language }) => {
  const {
    streams,
    selectedStreamId,
    activeStream,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    togglePlay,
    selectStream,
    stepStream,
    seek,
    setVolume,
    toggleMute,
  } = useFocusMusic();

  const [isStreamDrawerOpen, setIsStreamDrawerOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | FocusStreamCategory>('all');

  const filteredStreams = useMemo(() => {
    if (categoryFilter === 'all') return streams;
    return streams.filter((s) => s.category === categoryFilter);
  }, [streams, categoryFilter]);

  const categoryColor = (cat: FocusStreamCategory) => {
    if (cat === 'lofi') {
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    }
    if (cat === 'ambient') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  };

  return (
    <div
      role="region"
      aria-label="Focus Mode Music Control Bar"
      className="fixed bottom-0 inset-x-0 z-40"
    >
      {/* Upward Curated Stream Browser Drawer */}
      {isStreamDrawerOpen && (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 mb-2">
          <div className="bg-slate-950/95 backdrop-blur-xl text-white border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  {language === 'hinglish'
                    ? 'Focus Mode Curated Streams (Ambient · Lo-Fi · Deep Focus)'
                    : 'Curated Focus Mode Audio Streams'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All Streams' },
                    { id: 'lofi', label: 'Lo-Fi' },
                    { id: 'ambient', label: 'Ambient' },
                    { id: 'deep-focus', label: 'Deep Focus' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      categoryFilter === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsStreamDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1 cursor-pointer"
                  aria-label="Close curated streams drawer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredStreams.map((stream) => {
                const isSelected = stream.id === selectedStreamId;
                return (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() => {
                      selectStream(stream.id, true);
                    }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border ${categoryColor(
                          stream.category
                        )}`}
                      >
                        {stream.categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        {isSelected && isPlaying ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <Sparkles className="w-3 h-3" />
                            LIVE
                          </span>
                        ) : isSelected ? (
                          <Check className="w-3 h-3 text-indigo-400" />
                        ) : (
                          `${stream.bpm} BPM`
                        )}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate">{stream.title}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                      {language === 'hinglish' ? stream.hinglishSubtitle : stream.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Focus Music Bar */}
      <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl text-white shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
          {/* Left: Track Info + Active Badge */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial md:w-72">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isPlaying
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-slate-900 border-slate-800 text-indigo-400'
              }`}
            >
              {isPlaying ? (
                <Disc3 className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              ) : (
                <Headphones className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  {activeStream.title}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded border shrink-0 ${categoryColor(
                    activeStream.category
                  )}`}
                >
                  {activeStream.categoryLabel}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="truncate">
                  {isPlaying ? 'Focus Stream Active' : 'Paused'} · {activeStream.vibeTag}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Transport + Scrubber */}
          <div className="flex items-center gap-3 flex-1 justify-center max-w-md">
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => stepStream(-1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous stream"
                aria-label="Previous focus stream"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => togglePlay()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                  isPlaying
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-white hover:bg-slate-200 text-slate-950'
                }`}
                title={isPlaying ? 'Pause stream' : 'Play stream'}
                aria-label={isPlaying ? 'Pause focus stream' : 'Play focus stream'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => stepStream(1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next stream"
                aria-label="Next focus stream"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-1 text-[10px] font-mono text-slate-400 tabular-nums">
              <span>{formatAudioTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={Math.max(1, duration || 12)}
                step={0.1}
                value={Math.min(currentTime, duration || 12)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek focus audio"
                className="flex-1 h-1 accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span>{formatAudioTime(duration || 12)}</span>
            </div>
          </div>

          {/* Right: Volume + Curated Streams Drawer Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2 w-32">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title={isMuted ? 'Unmute focus audio' : 'Mute focus audio'}
                aria-label={isMuted ? 'Unmute focus audio' : 'Mute focus audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-label="Focus mode music volume"
                className="w-full h-1 accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsStreamDrawerOpen((prev) => !prev)}
              aria-expanded={isStreamDrawerOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isStreamDrawerOpen
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Streams</span>
              {isStreamDrawerOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
