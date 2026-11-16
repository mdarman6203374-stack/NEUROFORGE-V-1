import { ROADMAP_PHASES } from './roadmapData';
import { Language, StreakState } from '../types';

export type BadgeCategory = 'streak' | 'curriculum';
export type BadgeTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type BadgeIconName =
  | 'Sunrise'
  | 'Zap'
  | 'Flame'
  | 'Crown'
  | 'ShieldCheck'
  | 'Trophy'
  | 'Sparkles'
  | 'Compass'
  | 'Layers'
  | 'Cpu'
  | 'Award'
  | 'GraduationCap';

export interface EvaluatedBadge {
  id: string;
  title: string;
  hinglishTitle: string;
  description: string;
  hinglishDescription: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: BadgeIconName;
  unlocked: boolean;
  currentProgress: number;
  targetProgress: number;
  progressPercent: number;
  progressText: string;
  requirementLabel: string;
}

export const evaluateUserBadges = (
  streakState: StreakState,
  completedConcepts: string[],
  language: Language
): EvaluatedBadge[] => {
  const bestStreak = Math.max(streakState.currentStreak || 0, streakState.longestStreak || 0);
  const loggedDaysCount = streakState.historyDates?.length || 0;
  const totalConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts).length;
  const completedSet = new Set(completedConcepts);
  const masteredCount = completedConcepts.filter((id) =>
    ROADMAP_PHASES.some((p) => p.concepts.some((c) => c.id === id))
  ).length;

  const phase0 = ROADMAP_PHASES[0];
  const phase0Total = phase0 ? phase0.concepts.length : 4;
  const phase0Done = phase0
    ? phase0.concepts.filter((c) => completedSet.has(c.id)).length
    : 0;

  const completedPhasesCount = ROADMAP_PHASES.filter(
    (phase) =>
      phase.concepts.length > 0 &&
      phase.concepts.every((concept) => completedSet.has(concept.id))
  ).length;

  const halfwayTarget = Math.max(1, Math.ceil(totalConcepts * 0.5));

  const pct = (cur: number, target: number) =>
    Math.min(100, Math.round((Math.min(cur, target) / Math.max(1, target)) * 100));

  const earlyBirdProgress = bestStreak > 0 || loggedDaysCount > 0 ? 1 : 0;

  return [
    {
      id: 'early-bird',
      title: 'Early Bird',
      hinglishTitle: 'Early Bird',
      description: 'Log your first active study day in your streak tracker.',
      hinglishDescription: 'Apne study streak tracker mein pehla active study day log karein.',
      category: 'streak',
      tier: 'Bronze',
      icon: 'Sunrise',
      unlocked: earlyBirdProgress >= 1,
      currentProgress: earlyBirdProgress,
      targetProgress: 1,
      progressPercent: pct(earlyBirdProgress, 1),
      progressText: `${earlyBirdProgress} / 1 day`,
      requirementLabel: '1 active study day'
    },
    {
      id: 'spark-ignited',
      title: '3-Day Spark',
      hinglishTitle: '3-Day Spark',
      description: 'Build initial momentum with a 3-day consecutive study streak.',
      hinglishDescription: 'Lagaatar 3 din study karke apni shuruwati momentum pakki karein.',
      category: 'streak',
      tier: 'Bronze',
      icon: 'Zap',
      unlocked: bestStreak >= 3,
      currentProgress: Math.min(bestStreak, 3),
      targetProgress: 3,
      progressPercent: pct(bestStreak, 3),
      progressText: `${Math.min(bestStreak, 3)} / 3 days`,
      requirementLabel: '3-day streak'
    },
    {
      id: 'weekly-warrior',
      title: 'Weekly Warrior',
      hinglishTitle: 'Weekly Warrior',
      description: 'Stay disciplined for a full 7-day consecutive study streak.',
      hinglishDescription: 'Poore 1 hafte (7 din lagaatar) bina break ke AI study complete karein.',
      category: 'streak',
      tier: 'Silver',
      icon: 'Flame',
      unlocked: bestStreak >= 7,
      currentProgress: Math.min(bestStreak, 7),
      targetProgress: 7,
      progressPercent: pct(bestStreak, 7),
      progressText: `${Math.min(bestStreak, 7)} / 7 days`,
      requirementLabel: '7-day streak'
    },
    {
      id: 'consistency-king',
      title: 'Consistency King',
      hinglishTitle: 'Consistency King',
      description: 'Reach a 14-day study streak to prove relentless daily execution.',
      hinglishDescription: '14 din lagaatar study streak hasil karke unstoppable consistency dikhayein.',
      category: 'streak',
      tier: 'Gold',
      icon: 'Crown',
      unlocked: bestStreak >= 14,
      currentProgress: Math.min(bestStreak, 14),
      targetProgress: 14,
      progressPercent: pct(bestStreak, 14),
      progressText: `${Math.min(bestStreak, 14)} / 14 days`,
      requirementLabel: '14-day streak'
    },
    {
      id: 'habit-locked',
      title: 'Habit Architect',
      hinglishTitle: 'Habit Architect',
      description: 'Achieve a 21-day streak to lock deep AI engineering into daily habit.',
      hinglishDescription: '21 din ke streak ke saath AI engineering ko permanent aadat banayein.',
      category: 'streak',
      tier: 'Gold',
      icon: 'ShieldCheck',
      unlocked: bestStreak >= 21,
      currentProgress: Math.min(bestStreak, 21),
      targetProgress: 21,
      progressPercent: pct(bestStreak, 21),
      progressText: `${Math.min(bestStreak, 21)} / 21 days`,
      requirementLabel: '21-day streak'
    },
    {
      id: 'century-titan',
      title: '50-Day Titan',
      hinglishTitle: '50-Day Titan',
      description: 'Reach 50 total streak days of focused AI study and engineering practice.',
      hinglishDescription: '50 din ki dedicated study streak ke saath elite discipline prove karein.',
      category: 'streak',
      tier: 'Platinum',
      icon: 'Trophy',
      unlocked: bestStreak >= 50,
      currentProgress: Math.min(bestStreak, 50),
      targetProgress: 50,
      progressPercent: pct(bestStreak, 50),
      progressText: `${Math.min(bestStreak, 50)} / 50 days`,
      requirementLabel: '50-day streak'
    },
    {
      id: 'first-neuron',
      title: 'First Neuron',
      hinglishTitle: 'First Neuron',
      description: 'Master your very first technical concept on the AI roadmap.',
      hinglishDescription: 'AI Roadmap ka apna pehla technical concept complete mark karein.',
      category: 'curriculum',
      tier: 'Bronze',
      icon: 'Sparkles',
      unlocked: masteredCount >= 1,
      currentProgress: Math.min(masteredCount, 1),
      targetProgress: 1,
      progressPercent: pct(masteredCount, 1),
      progressText: `${Math.min(masteredCount, 1)} / 1 concept`,
      requirementLabel: '1 concept mastered'
    },
    {
      id: 'foundation-architect',
      title: 'Foundation Architect',
      hinglishTitle: 'Foundation Architect',
      description: 'Complete every core concept in Phase 0 (Math & CS Foundations).',
      hinglishDescription: 'Phase 0 (Math & CS Foundations) ke saare concepts complete karein.',
      category: 'curriculum',
      tier: 'Silver',
      icon: 'Compass',
      unlocked: phase0Total > 0 && phase0Done >= phase0Total,
      currentProgress: phase0Done,
      targetProgress: phase0Total,
      progressPercent: pct(phase0Done, phase0Total),
      progressText: `${phase0Done} / ${phase0Total} Phase 0 concepts`,
      requirementLabel: 'Complete Phase 0'
    },
    {
      id: 'deep-learner',
      title: 'Deep Learner',
      hinglishTitle: 'Deep Learner',
      description: 'Master 10 concepts across mathematics, Python, and machine learning.',
      hinglishDescription: 'Math, Python aur Machine Learning ke 10 concepts master karein.',
      category: 'curriculum',
      tier: 'Silver',
      icon: 'Layers',
      unlocked: masteredCount >= 10,
      currentProgress: Math.min(masteredCount, 10),
      targetProgress: 10,
      progressPercent: pct(masteredCount, 10),
      progressText: `${Math.min(masteredCount, 10)} / 10 concepts`,
      requirementLabel: '10 concepts mastered'
    },
    {
      id: 'neural-halfway',
      title: 'Neural Halfway',
      hinglishTitle: 'Neural Halfway',
      description: `Complete 50% of the full curriculum (${halfwayTarget} concepts).`,
      hinglishDescription: `Poore AI curriculum ke aadhe concepts (${halfwayTarget} concepts) complete karein.`,
      category: 'curriculum',
      tier: 'Gold',
      icon: 'Cpu',
      unlocked: masteredCount >= halfwayTarget,
      currentProgress: Math.min(masteredCount, halfwayTarget),
      targetProgress: halfwayTarget,
      progressPercent: pct(masteredCount, halfwayTarget),
      progressText: `${Math.min(masteredCount, halfwayTarget)} / ${halfwayTarget} concepts`,
      requirementLabel: '50% roadmap concepts'
    },
    {
      id: 'phase-champion',
      title: 'Multi-Phase Scholar',
      hinglishTitle: 'Multi-Phase Scholar',
      description: 'Finish every concept across at least 3 complete roadmap phases.',
      hinglishDescription: 'Kam se kam 3 poore roadmap phases ke saare concepts complete karein.',
      category: 'curriculum',
      tier: 'Gold',
      icon: 'Award',
      unlocked: completedPhasesCount >= 3,
      currentProgress: Math.min(completedPhasesCount, 3),
      targetProgress: 3,
      progressPercent: pct(completedPhasesCount, 3),
      progressText: `${Math.min(completedPhasesCount, 3)} / 3 phases`,
      requirementLabel: '3 complete phases'
    },
    {
      id: 'roadmap-master',
      title: 'Roadmap Master',
      hinglishTitle: 'Roadmap Master',
      description:
        language === 'hinglish'
          ? `Master all ${totalConcepts} concepts across every phase from Foundations to Frontier AI.`
          : `Master all ${totalConcepts} concepts across every phase from Foundations to Frontier AI.`,
      hinglishDescription: `Foundations se Frontier AI tak saare ${totalConcepts} concepts master karein.`,
      category: 'curriculum',
      tier: 'Platinum',
      icon: 'GraduationCap',
      unlocked: totalConcepts > 0 && masteredCount >= totalConcepts,
      currentProgress: masteredCount,
      targetProgress: totalConcepts,
      progressPercent: pct(masteredCount, totalConcepts),
      progressText: `${masteredCount} / ${totalConcepts} concepts`,
      requirementLabel: '100% roadmap concepts'
    }
  ];
};
