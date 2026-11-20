import React, { useMemo } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { Language, StreakState } from '../types';
import { evaluateUserBadges } from '../data/badgesData';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { Badges } from './Badges';

interface AchievementsViewProps {
  streakState: StreakState;
  completedConcepts: string[];
  completedDaysCount: number;
  language: Language;
  onNavigateTab: (tab: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  streakState,
  completedConcepts,
  completedDaysCount,
  language,
  onNavigateTab
}) => {
  const badges = useMemo(
    () => evaluateUserBadges(streakState, completedConcepts, language, completedDaysCount),
    [streakState, completedConcepts, language, completedDaysCount]
  );

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const overallPercent = Math.round((unlockedCount / (badges.length || 1)) * 100);
  const totalConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts).length;

  return (
    <div className="space-y-8">
      {/* Header Summary Card */}
      <section className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Trophy className="w-4 h-4" />
              <span>ACHIEVEMENTS & MASTERY BADGES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {language === 'hinglish'
                ? 'Aapke Study Milestones aur Achievement Badges'
                : 'Your Study Milestones & Achievement Badges'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {language === 'hinglish'
                ? 'Daily study streaks (jaise 7-day streak) aur Roadmap concepts complete karne par yeh animated badges automatically unlock hote hain.'
                : 'Animated milestone badges unlock automatically as you hit daily study streaks (such as 7-day streak) and master concepts across the roadmap.'}
            </p>
          </div>

          {/* Quick Jump Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('daily-planner')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Extend Streak</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('roadmap')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Master Concepts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Badges Unlocked
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {unlockedCount} / {badges.length}{' '}
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ({overallPercent}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Current / Best Streak
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {streakState.currentStreak}d{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                (Best: {streakState.longestStreak}d)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Concepts Mastered
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {completedConcepts.length} / {totalConcepts}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Daily Sessions Logged
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {completedDaysCount} Days
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Visual Animated Badges Component */}
      <Badges badges={badges} language={language} onNavigateTab={onNavigateTab} />
    </div>
  );
};
