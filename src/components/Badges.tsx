import React, { useEffect, useMemo, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
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
  Play,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BadgeIconName, BadgeTier, EvaluatedBadge } from '../data/badgesData';
import { Language } from '../types';

interface BadgesProps {
  badges: EvaluatedBadge[];
  language: Language;
  onNavigateTab: (tab: string) => void;
}

type BadgeFilter = 'all' | 'unlocked' | 'locked' | 'streak' | 'curriculum';

const SEEN_BADGES_STORAGE_KEY = 'ai_mastery_seen_unlocked_badges_v1';

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
    ringStroke: string;
    emblemBg: string;
    iconText: string;
    cardBorder: string;
    tierText: string;
    orbitColor: string;
  }
> = {
  Bronze: {
    ringStroke: '#d97706',
    emblemBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/70',
    iconText: 'text-amber-600 dark:text-amber-400',
    cardBorder: 'border-amber-200/90 dark:border-amber-800/60',
    tierText: 'text-amber-700 dark:text-amber-400',
    orbitColor: 'border-amber-400/50'
  },
  Silver: {
    ringStroke: '#0284c7',
    emblemBg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/70',
    iconText: 'text-sky-600 dark:text-sky-400',
    cardBorder: 'border-sky-200/90 dark:border-sky-800/60',
    tierText: 'text-sky-700 dark:text-sky-400',
    orbitColor: 'border-sky-400/50'
  },
  Gold: {
    ringStroke: '#4f46e5',
    emblemBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/70',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    cardBorder: 'border-indigo-200/90 dark:border-indigo-700/70',
    tierText: 'text-indigo-700 dark:text-indigo-400',
    orbitColor: 'border-indigo-400/55'
  },
  Platinum: {
    ringStroke: '#059669',
    emblemBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    cardBorder: 'border-emerald-300/80 dark:border-emerald-700/70',
    tierText: 'text-emerald-700 dark:text-emerald-400',
    orbitColor: 'border-emerald-400/55'
  }
};

// Unique per-icon motion signature when unlocked
function getIconMotionProps(icon: BadgeIconName, unlocked: boolean, replayNonce: number) {
  if (!unlocked) {
    return { animate: { scale: 1, rotate: 0, y: 0 }, transition: { duration: 0.2 } };
  }

  switch (icon) {
    case 'Flame':
      return {
        key: `flame-${replayNonce}`,
        animate: { scale: [1, 1.12, 0.96, 1.08, 1], rotate: [-4, 4, -3, 3, 0], y: [0, -2, 0] },
        transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const }
      };
    case 'Zap':
      return {
        key: `zap-${replayNonce}`,
        animate: { scale: [1, 1.18, 1, 1.1, 1], rotate: [0, -8, 6, 0] },
        transition: { duration: 1.9, repeat: Infinity, repeatDelay: 1.1, ease: 'easeOut' as const }
      };
    case 'Sunrise':
      return {
        key: `sunrise-${replayNonce}`,
        animate: { y: [2, -3, 2], scale: [0.97, 1.06, 0.97] },
        transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' as const }
      };
    case 'Crown':
      return {
        key: `crown-${replayNonce}`,
        animate: { y: [0, -3, 0], rotate: [-3, 3, -3] },
        transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const }
      };
    case 'Compass':
      return {
        key: `compass-${replayNonce}`,
        animate: { rotate: [-18, 22, -12, 16, -18] },
        transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' as const }
      };
    case 'Cpu':
      return {
        key: `cpu-${replayNonce}`,
        animate: { scale: [1, 1.09, 1], rotate: [0, 90, 180, 270, 360] },
        transition: {
          scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const },
          rotate: { duration: 10, repeat: Infinity, ease: 'linear' as const }
        }
      };
    case 'Sparkles':
      return {
        key: `sparkles-${replayNonce}`,
        animate: { scale: [1, 1.14, 0.95, 1.14, 1], rotate: [0, 12, -12, 0] },
        transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }
      };
    case 'Trophy':
    case 'GraduationCap':
      return {
        key: `trophy-${replayNonce}`,
        animate: { y: [0, -3.5, 0], scale: [1, 1.08, 1] },
        transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }
      };
    case 'ShieldCheck':
    case 'Layers':
    case 'Award':
    default:
      return {
        key: `default-${replayNonce}`,
        animate: { scale: [1, 1.08, 1], y: [0, -2, 0] },
        transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }
      };
  }
}

const AnimatedBadgeEmblem: React.FC<{
  badge: EvaluatedBadge;
  size?: 'md' | 'lg';
  replayNonce?: number;
}> = ({ badge, size = 'md', replayNonce = 0 }) => {
  const IconComponent = ICON_MAP[badge.icon];
  const styles = TIER_STYLES[badge.tier];
  const isLarge = size === 'lg';
  const boxSize = isLarge ? 'w-16 h-16' : 'w-14 h-14';
  const iconSize = isLarge ? 'w-7 h-7' : 'w-6 h-6';
  const svgSize = isLarge ? 64 : 56;
  const radius = isLarge ? 28 : 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - badge.progressPercent / 100);
  const motionProps = getIconMotionProps(badge.icon, badge.unlocked, replayNonce);

  return (
    <div className={`relative ${boxSize} flex items-center justify-center shrink-0`}>
      {/* Progress / Completion SVG Ring */}
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="absolute inset-0 -rotate-90 pointer-events-none"
        aria-hidden="true"
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={badge.unlocked ? styles.ringStroke : '#6366f1'}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
      </svg>

      {/* Subtle Rotating Dashed Orbit for Unlocked Badges */}
      {badge.unlocked && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-1.5 rounded-full border border-dashed ${styles.orbitColor} pointer-events-none`}
          aria-hidden="true"
        />
      )}

      {/* Center Medallion Circle */}
      <div
        className={`${isLarge ? 'w-11 h-11' : 'w-10 h-10'} rounded-full border flex items-center justify-center ${
          badge.unlocked
            ? styles.emblemBg
            : 'bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
        }`}
      >
        <motion.div {...motionProps} className="flex items-center justify-center">
          <IconComponent
            className={`${iconSize} ${
              badge.unlocked ? styles.iconText : 'text-slate-400 dark:text-slate-500'
            }`}
          />
        </motion.div>
      </div>
    </div>
  );
};

export const Badges: React.FC<BadgesProps> = ({ badges, language, onNavigateTab }) => {
  const [filter, setFilter] = useState<BadgeFilter>('all');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(() => {
    const firstUnlocked = badges.find((b) => b.unlocked);
    return firstUnlocked?.id || badges[0]?.id || null;
  });
  const [replayNonce, setReplayNonce] = useState<number>(0);
  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<string[]>([]);

  // Track newly unlocked badges compared to last visit
  useEffect(() => {
    const unlockedIds = badges.filter((b) => b.unlocked).map((b) => b.id);
    try {
      const savedRaw = localStorage.getItem(SEEN_BADGES_STORAGE_KEY);
      const seenIds: string[] = savedRaw ? JSON.parse(savedRaw) : [];
      const fresh = unlockedIds.filter((id) => !seenIds.includes(id));
      if (fresh.length > 0) {
        setNewlyUnlockedIds(fresh);
        setSelectedBadgeId(fresh[0]);
      }
      localStorage.setItem(SEEN_BADGES_STORAGE_KEY, JSON.stringify(unlockedIds));
    } catch {}
  }, [badges]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

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

  const inspectedBadge =
    badges.find((b) => b.id === selectedBadgeId) || filteredBadges[0] || badges[0];

  const filterOptions: Array<{ id: BadgeFilter; label: string; count: number }> = [
    { id: 'all', label: 'All Badges', count: badges.length },
    { id: 'unlocked', label: 'Unlocked', count: unlockedCount },
    { id: 'locked', label: 'Locked', count: badges.length - unlockedCount },
    {
      id: 'streak',
      label: 'Streak Milestones',
      count: badges.filter((b) => b.category === 'streak').length
    },
    {
      id: 'curriculum',
      label: 'Concept Mastery',
      count: badges.filter((b) => b.category === 'curriculum').length
    }
  ];

  const triggerCelebrate = () => {
    setReplayNonce((n) => n + 1);
    confetti({
      particleCount: 55,
      spread: 75,
      origin: { y: 0.65 }
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Selected Badge Spotlight Panel */}
        {inspectedBadge && (
          <motion.section
            key={`${inspectedBadge.id}-${replayNonce}`}
            initial={{ opacity: 0.92, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="flex items-start sm:items-center gap-4">
              <AnimatedBadgeEmblem badge={inspectedBadge} size="lg" replayNonce={replayNonce} />
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span
                    className={
                      inspectedBadge.unlocked
                        ? TIER_STYLES[inspectedBadge.tier].tierText
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    {inspectedBadge.tier.toUpperCase()} TIER
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {inspectedBadge.requirementLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                    {inspectedBadge.progressText}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'hinglish' ? inspectedBadge.hinglishTitle : inspectedBadge.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {language === 'hinglish'
                    ? inspectedBadge.hinglishDescription
                    : inspectedBadge.description}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {inspectedBadge.unlocked ? (
                <button
                  type="button"
                  onClick={triggerCelebrate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Replay Unlock Celebration</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateTab(
                      inspectedBadge.category === 'streak' ? 'daily-planner' : 'roadmap'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>
                    {inspectedBadge.category === 'streak'
                      ? 'Log Daily Streak'
                      : 'Complete Concepts'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.section>
        )}

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
                    ? 'bg-indigo-600 text-white border-indigo-600'
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

        {/* Visual Animated Badges Grid */}
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
            {filteredBadges.map((badge, idx) => {
              const styles = TIER_STYLES[badge.tier];
              const isSelected = inspectedBadge?.id === badge.id;
              const isNew = newlyUnlockedIds.includes(badge.id);

              return (
                <motion.button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadgeId(badge.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                  whileHover={{ y: -2 }}
                  className={`w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-colors flex flex-col justify-between gap-4 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-indigo-500/40 border-indigo-400 dark:border-indigo-600'
                      : badge.unlocked
                      ? styles.cardBorder
                      : 'border-slate-200 dark:border-slate-800 opacity-90 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <AnimatedBadgeEmblem badge={badge} replayNonce={replayNonce} />

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
                            <span>{isNew ? 'Newly Unlocked' : 'Unlocked'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {language === 'hinglish' ? badge.hinglishTitle : badge.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {language === 'hinglish' ? badge.hinglishDescription : badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 w-full">
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
                          badge.unlocked ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-400'
                        }`}
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </MotionConfig>
  );
};
