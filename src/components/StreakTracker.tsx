import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Zap,
  Rocket,
  Brain,
  Gem,
  Trophy,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Calendar,
  Award
} from 'lucide-react';
import { StreakMilestone, Language, StreakState } from '../types';
import {
  STREAK_MILESTONES,
  getNextMilestone,
  fireMilestoneConfetti,
  playMilestoneFanfare
} from '../data/streakData';

interface StreakTrackerProps {
  streakState: StreakState;
  onToggleTodayGoal: () => void;
  isTodayCompleted: boolean;
  onTriggerMilestoneCelebration: (milestone: StreakMilestone) => void;
  language: Language;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  streakState,
  onToggleTodayGoal,
  isTodayCompleted,
  onTriggerMilestoneCelebration,
  language
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentStreak = streakState.currentStreak;
  const nextMilestone = getNextMilestone(currentStreak);

  // Progress towards next milestone
  const prevMilestoneDays =
    [...STREAK_MILESTONES]
      .reverse()
      .find((m) => m.days <= currentStreak)?.days || 0;

  const nextTargetDays = nextMilestone ? nextMilestone.days : 100;
  const progressPercent = nextMilestone
    ? Math.min(
        100,
        Math.round(
          ((currentStreak - prevMilestoneDays) /
            (nextTargetDays - prevMilestoneDays)) *
            100
        )
      )
    : 100;

  const daysUntilNext = nextMilestone ? nextMilestone.days - currentStreak : 0;

  const renderMilestoneIcon = (icon: string, isUnlocked: boolean) => {
    const baseClass = isUnlocked ? 'w-4 h-4 text-amber-500' : 'w-4 h-4 text-slate-400';
    switch (icon) {
      case 'Zap':
        return <Zap className={baseClass} />;
      case 'Flame':
        return <Flame className={baseClass} />;
      case 'Rocket':
        return <Rocket className={baseClass} />;
      case 'Brain':
        return <Brain className={baseClass} />;
      case 'Gem':
        return <Gem className={baseClass} />;
      case 'Trophy':
        return <Trophy className={baseClass} />;
      case 'Crown':
        return <Crown className={baseClass} />;
      default:
        return <Sparkles className={baseClass} />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Header Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer ${
          currentStreak > 0
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/70 shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="View your daily study streak and unlockable milestones"
        aria-label="Daily study streak"
      >
        <div className="relative flex items-center justify-center">
          <Flame
            className={`w-4 h-4 transition-transform duration-300 ${
              currentStreak > 0
                ? 'text-orange-500 fill-orange-500 animate-pulse group-hover:scale-115'
                : 'text-slate-400'
            }`}
          />
        </div>
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {currentStreak}
        </span>
        <span className="hidden sm:inline font-semibold">
          {currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
        </span>
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 text-slate-900 dark:text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Top Streak Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Flame className="w-7 h-7 fill-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {currentStreak}
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {currentStreak === 1 ? 'Day Active' : 'Days Streak'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'hinglish'
                    ? 'Daily 2 ghante study goals continuous complete'
                    : 'Consecutive daily study goals completed'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Best Record
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {streakState.longestStreak} Days
              </span>
            </div>
          </div>

          {/* Today's Goal Action Widget */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isTodayCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {language === 'hinglish' ? "Aaj Ka Study Goal" : "Today's Study Goal"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isTodayCompleted ? 'Completed (Streak maintained! 🔥)' : '2 Hours Daily Deep Practice'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onToggleTodayGoal();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                isTodayCompleted
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs'
              }`}
            >
              {isTodayCompleted ? 'Mark Undone' : 'Complete Today ✓'}
            </button>
          </div>

          {/* Next Milestone Progress */}
          {nextMilestone && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {language === 'hinglish' ? 'Next Milestone' : 'Next Milestone'}:
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {nextMilestone.days} Days ({nextMilestone.title})
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{currentStreak} Days</span>
                <span>
                  {daysUntilNext === 1 ? '1 day left!' : `${daysUntilNext} days left`}
                </span>
                <span>{nextMilestone.days} Days</span>
              </div>
            </div>
          )}

          {/* Milestone Trophies Gallery */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Milestones Journey
              </span>
              <span className="text-[10px] text-slate-400">
                {STREAK_MILESTONES.filter((m) => currentStreak >= m.days).length} / {STREAK_MILESTONES.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {STREAK_MILESTONES.map((m) => {
                const isUnlocked = currentStreak >= m.days;
                return (
                  <button
                    key={m.days}
                    onClick={() => {
                      playMilestoneFanfare();
                      onTriggerMilestoneCelebration(m);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer group ${
                      isUnlocked
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 hover:scale-105 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                    title={`${m.title} (${m.days} Days) - Click to view`}
                  >
                    <div className="p-1 rounded-md">
                      {isUnlocked ? (
                        renderMilestoneIcon(m.rewardIcon, true)
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono font-bold mt-1 text-slate-700 dark:text-slate-300">
                      {m.days}d
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Milestone Celebration Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                const target =
                  STREAK_MILESTONES.find((m) => currentStreak >= m.days) ||
                  STREAK_MILESTONES[0];
                playMilestoneFanfare();
                onTriggerMilestoneCelebration(target);
              }}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Preview Celebration Animation 🎉</span>
            </button>

            <span className="text-[10px] text-slate-400 font-mono">
              Daily habit
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
