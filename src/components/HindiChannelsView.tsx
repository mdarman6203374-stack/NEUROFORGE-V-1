import React, { useMemo, useState } from 'react';
import {
  Youtube,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  ArrowUpRight,
  ListOrdered,
  Users
} from 'lucide-react';
import { HINDI_CHANNELS_DATA, HINDI_LEARNING_PRO_TIPS } from '../data/hindiChannelsData';
import { Language } from '../types';

interface HindiChannelsViewProps {
  language: Language;
}

const getPhaseOrder = (phaseMapped: string): number => {
  const match = phaseMapped.match(/Phase\s+(\d+)/i);
  return match ? Number(match[1]) : 99;
};

export const HindiChannelsView: React.FC<HindiChannelsViewProps> = ({ language }) => {
  const [viewMode, setViewMode] = useState<'serial' | 'by-channel'>('serial');
  const [selectedPhase, setSelectedPhase] = useState<string>('All');

  const phaseOptions = [
    'All',
    'Phase 0',
    'Phase 1',
    'Phase 2',
    'Phase 3',
    'Phase 4',
    'Phase 5',
    'Phase 6',
    'Phase 7'
  ];

  const serialPlaylists = useMemo(() => {
    const flattened = HINDI_CHANNELS_DATA.flatMap((channel) =>
      channel.playlists.map((pl) => ({
        ...pl,
        phaseOrder: getPhaseOrder(pl.phaseMapped),
        channelName: channel.name,
        creator: channel.creator,
        avatarText: channel.avatarText,
        channelUrl: channel.channelUrl
      }))
    );

    const sorted = flattened.sort((a, b) => a.phaseOrder - b.phaseOrder);
    if (selectedPhase === 'All') return sorted;
    return sorted.filter((item) =>
      item.phaseMapped.toLowerCase().includes(selectedPhase.toLowerCase())
    );
  }, [selectedPhase]);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-red-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
          <Youtube className="w-4 h-4 text-red-500" />
          <span>CURATED HINDI YOUTUBE DIRECTORY</span>
          <span aria-hidden="true">·</span>
          <span>CAMPUSX · KRISH NAIK · CHAI AUR CODE</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {language === 'hinglish'
            ? 'Top Hindi YouTube Channels aur Unki Best Playlists'
            : 'Curated Hindi YouTube Playlists for AI Engineering'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {language === 'hinglish'
            ? 'AI seekhne ke liye hazaron videos dekh kar confuse hone ki zaroorat nahi hai. Humne best Hindi creators ke un specific playlists ko schedule ke hisab se serialwise organize kiya hai.'
            : 'Stop wasting hours scrolling random tutorials. Every Hindi YouTube playlist below is mapped serialwise from Phase 0 to Phase 7 of your AI Engineering schedule.'}
        </p>

        {/* Pro-Tips Callout Bar */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-red-900/30 text-xs">
          {HINDI_LEARNING_PRO_TIPS.slice(0, 2).map((tip, idx) => (
            <div
              key={idx}
              className="p-3 bg-red-950/40 rounded-lg border border-red-900/40 space-y-1"
            >
              <div className="font-bold text-red-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {tip.title}
              </div>
              <p className="text-slate-300 leading-relaxed">{tip.hinglishNote}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Sequence Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-500" />
          <span>The Optimal Hindi Learning Sequence</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Step 1: Python & Math</span>
            <p className="text-slate-600 dark:text-slate-300">CodeWithHarry for Python, CampusX for Linear Algebra & Derivatives.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Step 2: ML & Deep Learning</span>
            <p className="text-slate-600 dark:text-slate-300">CampusX 100 Days of ML & Deep Learning whiteboard derivations.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Step 3: GenAI & RAG</span>
            <p className="text-slate-600 dark:text-slate-300">Krish Naik for LangChain, Vector DBs, Fine-Tuning & LlamaIndex.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Step 4: Agents & MLOps</span>
            <p className="text-slate-600 dark:text-slate-300">Krish Naik & Sunny Bhaveen for LangGraph, CrewAI, Docker & AWS.</p>
          </div>
        </div>
      </div>

      {/* Compact Controls: Serial Schedule vs Creator + Small Phase Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setViewMode('serial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'serial'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Serial Schedule (Phase 0 → 7)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('by-channel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'by-channel'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>By Channel</span>
          </button>
        </div>

        {viewMode === 'serial' && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {phaseOptions.map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => setSelectedPhase(phase)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                  selectedPhase === phase
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Serialwise Schedule Playlist View OR Creators Grouped View */}
      {viewMode === 'serial' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serialPlaylists.map((pl, idx) => (
            <div
              key={`${pl.channelName}-${pl.title}`}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold tabular-nums px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                      {pl.phaseMapped}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
                    {pl.totalVideos} Videos
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {pl.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-5 h-5 rounded bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {pl.avatarText}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {pl.channelName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{pl.level}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pl.description}
                </p>

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Must-Watch Episodes:
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                    {pl.mustWatchEpisodes.map((ep, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-red-500 text-[10px]">▶</span>
                        <span>{ep}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a
                href={pl.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Open Playlist on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {HINDI_CHANNELS_DATA.map((channel) => (
          <div
            key={channel.id}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
          >
            {/* Creator Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                  {channel.avatarText}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {channel.name}
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      by {channel.creator}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs font-mono font-semibold text-red-600 dark:text-red-400">
                      {channel.subscribers}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {channel.tagline}
                  </p>
                </div>
              </div>

              <a
                href={channel.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg border border-red-200 dark:border-red-900 transition-colors cursor-pointer shrink-0"
              >
                <span>Visit YouTube Channel</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Why Recommended Hinglish Review */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-white">
                Review & Best Way to Watch:
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {channel.hinglishReview}
              </p>
            </div>

            {/* Curated Playlists Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top Handpicked Playlists by {channel.creator}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channel.playlists.map((pl, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {pl.phaseMapped}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {pl.totalVideos} Videos
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {pl.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pl.description}
                      </p>

                      {/* Must-watch episodes */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Must-Watch Episodes:
                        </span>
                        <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                          {pl.mustWatchEpisodes.map((ep, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-red-500 text-[10px]">▶</span>
                              <span>{ep}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <a
                      href={pl.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Open Playlist on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
