import React, { useMemo, useState } from 'react';
import {
  Sunrise,
  Zap,
  Flame,
  Crown,
  ShieldCheck,
  Trophy,
  Sparkles,
  Compass,
  Layers,
  Cpu,
  Award,
  GraduationCap,
  Lock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Language, StreakState } from '../types';
import {
  BadgeIconName,
  BadgeTier,
  EvaluatedBadge,
  evaluateUserBadges
} from '../data/badgesData';
import { ROADMAP_PHASES } from '../data/roadmapData';

interface AchievementsViewProps {
  streakState: StreakState;
  completedConcepts: string[];
  completedDaysCount: number;
  language: Language;
  onNavigateTab: (tab: string) => void;
}

type BadgeFilter = 'all' | 'unlocked' | 'locked' | 'streak' | 'curriculum';

const ICON_MAP: Record<BadgeIconName, React.ComponentType<{ className?: string }>> = {
  Sunrise,
  Zap,
  Flame,
  Crown,
  ShieldCheck,
  Trophy,
  Sparkles,
  Compass,
  Layers,
  Cpu,
  Award,
  GraduationCap
};

const TIER_STYLES: Record<
  BadgeTier,
  {
    iconBg: string;
    iconText: string;
    cardBorder: string;
    tierText: string;
  }
> = {
  Bronze: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/70',
    iconText: 'text-amber-600 dark:text-amber-400',
    cardBorder: 'border-amber-200/80 dark:border-amber-800/60',
    tierText: 'text-amber-700 dark:text-amber-400'
  },
  Silver: {
    iconBg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/70',
    iconText: 'text-sky-600 dark:text-sky-400',
    cardBorder: 'border-sky-200/80 dark:border-sky-800/60',
    tierText: 'text-sky-700 dark:text-sky-400'
  },
  Gold: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/70',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    cardBorder: 'border-indigo-200/90 dark:border-indigo-700/70',
    tierText: 'text-indigo-700 dark:text-indigo-400'
  },
  Platinum: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    cardBorder: 'border-emerald-300/80 dark:border-emerald-700/70',
    tierText: 'text-emerald-700 dark:text-emerald-400'
  }
};

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  streakState,
  completedConcepts,
  completedDaysCount,
  language,
  onNavigateTab
}) => {
  const [filter, setFilter] = useState<BadgeFilter>('all');

  const badges = useMemo(
    () => evaluateUserBadges(streakState, completedConcepts, language),
    [streakState, completedConcepts, language]
  );

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const overallPercent = Math.round((unlockedCount / (badges.length || 1)) * 100);
  const totalConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts).length;

  const filteredBadges = useMemo(() => {
    switch (filter) {
      case 'unlocked':
        return badges.filter((b) => b.unlocked);
      case 'locked':
        return badges.filter((b) => !b.unlocked);
      case 'streak':
        return badges.filter((b) => b.category === 'streak');
      case 'curriculum':
        return badges.filter((b) => b.category === 'curriculum');
      default:
        return badges;
    }
  }, [badges, filter]);

  const filterOptions: Array<{ id: BadgeFilter; label: string; count: number }> = [
    { id: 'all', label: 'All Badges', count: badges.length },
    { id: 'unlocked', label: 'Unlocked', count: unlockedCount },
    { id: 'locked', label: 'Locked', count: badges.length - unlockedCount },
    {
      id: 'streak',
      label: 'Streak & Consistency',
      count: badges.filter((b) => b.category === 'streak').length
    },
    {
      id: 'curriculum',
      label: 'Curriculum Mastery',
      count: badges.filter((b) => b.category === 'curriculum').length
    }
  ];

  const renderBadgeCard = (badge: EvaluatedBadge) => {
    const IconComponent = ICON_MAP[badge.icon];
    const styles = TIER_STYLES[badge.tier];

    return (
      <article
        key={badge.id}
        className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between gap-4 ${
          badge.unlocked
            ? `${styles.cardBorder} shadow-sm`
            : 'border-slate-200 dark:border-slate-800 opacity-90'
        }`}
      >
        <div className="space-y-3.5">
          {/* Top Row: Icon + Status + Tier */}
          <div className="flex items-start justify-between gap-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                badge.unlocked
                  ? styles.iconBg
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
              }`}
            >
              <IconComponent
                className={`w-6 h-6 ${
                  badge.unlocked
                    ? styles.iconText
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  badge.unlocked ? styles.tierText : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {badge.tier} Tier
              </span>

              {badge.unlocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlocked</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </span>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'hinglish' ? badge.hinglishTitle : badge.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'hinglish' ? badge.hinglishDescription : badge.description}
            </p>
          </div>
        </div>

        {/* Bottom Progress & Target */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {badge.requirementLabel}
            </span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                badge.unlocked
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {badge.progressText}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                badge.unlocked
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600 dark:bg-indigo-400'
              }`}
              style={{ width: `${badge.progressPercent}%` }}
            />
          </div>
        </div>
      </article>
    );
  };

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
                ? 'Daily study streaks aur Roadmap concepts complete karne par yeh badges automatically unlock hote hain.'
                : 'Badges unlock automatically as you build daily study streaks and master concepts across the AI Engineering Roadmap.'}
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

      {/* Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Badge Cards Grid */}
      {filteredBadges.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {filter === 'locked'
              ? 'All badges are unlocked!'
              : 'No badges match this filter yet.'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep completing concepts on your Roadmap and logging Daily Planner streaks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map(renderBadgeCard)}
        </div>
      )}
    </div>
  );
};
