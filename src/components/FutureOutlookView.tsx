import React, { useState } from 'react';
import { Sparkles, TrendingUp, Cpu, ShieldAlert, Zap, Layers, ArrowRight } from 'lucide-react';
import { FUTURE_AI_TRENDS } from '../data/futureOutlookData';
import { Language } from '../types';

interface FutureOutlookViewProps {
  language: Language;
}

export const FutureOutlookView: React.FC<FutureOutlookViewProps> = ({ language }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Compute', 'Architecture', 'Agents', 'Hardware', 'Security'];

  const filteredTrends =
    selectedCategory === 'All'
      ? FUTURE_AI_TRENDS
      : FUTURE_AI_TRENDS.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl border border-indigo-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>FUTURE AI TECHNOLOGY RADAR</span>
          <span aria-hidden="true">·</span>
          <span>HORIZON 2025 - 2028+</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {language === 'hinglish'
            ? 'AI ka Future: Kaunse Bade Updates aur Changes Aane Wale Hain?'
            : 'The Future of AI: Architectural Shifts & Frontier Updates'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {language === 'hinglish'
            ? 'Pretraining model size badhane ka golden era ab khatam ho raha hai. Future Test-Time Compute (Reasoning models), Edge AI (SLMs on devices), Multi-Agent Swarms, aur Neuro-Symbolic Verification ka hai. Yahan jaaniye ki agle 3 saal mein industry kaise badlegi.'
            : 'Pretraining compute scaling is encountering physical data walls. The next wave of breakthroughs belongs to Test-Time Compute (reasoning models), Edge AI (SLMs on devices), Multi-Agent Swarms, and Neuro-Symbolic Verification. Here is your strategic technical radar.'}
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Trends List */}
      <div className="space-y-6">
        {filteredTrends.map((trend, idx) => (
          <div
            key={trend.id}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    TREND 0{idx + 1}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    Category: {trend.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {trend.title}
                </h2>
              </div>

              <div className="px-3 py-1 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 shrink-0">
                Horizon: {trend.timeframe}
              </div>
            </div>

            {/* Summaries */}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {trend.summary}
            </p>

            {language === 'hinglish' && (
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                <span className="font-bold">Hinglish Breakdown:</span>
                <p className="leading-relaxed">{trend.hinglishSummary}</p>
              </div>
            )}

            {/* Drivers & Implications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              {/* Key Drivers */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Why This Shift Is Happening (Key Drivers)
                </span>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  {trend.keyDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold shrink-0">•</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Engineering Implications */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  What AI Engineers Must Build (Implications)
                </span>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  {trend.engineeringImplications.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold shrink-0">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Item for Learners */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs flex items-start gap-3">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">
                  Action Item to Stay Ahead of 99% of Candidates:
                </span>
                <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  {trend.actionItemForLearners}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
