import { StreakMilestone } from '../types';
import confetti from 'canvas-confetti';

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    title: 'Spark Ignited',
    hinglishTitle: 'Consistency Ki Shuruwat',
    badge: '⚡ Bronze Spark',
    description: '3 consecutive days of 2-hour deliberate AI study! The hardest step is starting, and your momentum has begun.',
    hinglishDesc: 'Lagaatar 3 din 2 ghante ki study complete! Starting karna sabse mushkil hota hai, ab momentum ban chuka hai.',
    rewardIcon: 'Zap'
  },
  {
    days: 7,
    title: '1-Week Flame',
    hinglishTitle: '1 Week Relentless Flame',
    badge: '🔥 Silver Torch',
    description: '1 full week of relentless daily execution (14 total hours of AI Engineering). You are outpacing 95% of casual learners.',
    hinglishDesc: 'Pura 1 hafta (14 ghante) deep study! Aap 95% casual learners se aage nikal chuke ho.',
    rewardIcon: 'Flame'
  },
  {
    days: 14,
    title: 'Two-Week Fortitude',
    hinglishTitle: '2 Weeks Ki Solid Pakad',
    badge: '🚀 Gold Rocket',
    description: '14 consecutive days (28 hours). Core neural networks and mathematics are crystallizing in your muscle memory.',
    hinglishDesc: '14 din continuous study! Neural networks aur Python code ab aapke dimag mein settle hone laga hai.',
    rewardIcon: 'Rocket'
  },
  {
    days: 21,
    title: 'Habit Locked',
    hinglishTitle: 'Permanent Habit Locked',
    badge: '🧠 Platinum Synapse',
    description: 'Neuroscience says 21 continuous days hardwires a cognitive habit. Coding AI every day is now your default nature!',
    hinglishDesc: '21 din lagane se habit permanent ban jaati hai. Daily 2 ghante AI seekhna ab aapki natural aadat ban chuka hai!',
    rewardIcon: 'Brain'
  },
  {
    days: 30,
    title: '1-Month AI Architect',
    hinglishTitle: '1 Month Master Architect',
    badge: '💎 Diamond Core',
    description: '60 full hours of hands-on code! You have shipped end-to-end models and production implementations.',
    hinglishDesc: 'Pura 1 mahina aur 60 ghante complete! Real models train kiye aur portfolio projects create kiye.',
    rewardIcon: 'Gem'
  },
  {
    days: 50,
    title: 'Half-Century Titan',
    hinglishTitle: '50-Day Titan Milestone',
    badge: '🏆 Ruby Trophy',
    description: '100 hours of deliberate mastery! Deep understanding of Transformers, Attention mechanisms, and Vector databases.',
    hinglishDesc: '100 ghante ki deep practice! Transformers, RAG aur Vector DBs par aapki command ho chuki hai.',
    rewardIcon: 'Trophy'
  },
  {
    days: 100,
    title: 'Century Legend',
    hinglishTitle: '100 Din Ka Toofan',
    badge: '👑 Crown of Mastery',
    description: '100 days (200 hours) of continuous engineering discipline! You possess the work ethic and skills of top-tier AI Engineers.',
    hinglishDesc: '100 din lagatar! Top 1% engineers wali discipline aur skills ab aapke paas hain.',
    rewardIcon: 'Crown'
  }
];

export const getNextMilestone = (currentStreak: number): StreakMilestone | null => {
  return STREAK_MILESTONES.find((m) => m.days > currentStreak) || null;
};

export const getMatchedMilestone = (days: number): StreakMilestone | undefined => {
  return STREAK_MILESTONES.find((m) => m.days === days);
};

// Play a triumphant musical fanfare using Web Audio API (zero external assets needed)
export const playMilestoneFanfare = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Triumphant ascending arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.15 },
      { freq: 659.25, time: 0.14, dur: 0.15 },
      { freq: 783.99, time: 0.28, dur: 0.18 },
      { freq: 1046.5, time: 0.44, dur: 0.8 }
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

      gain.gain.setValueAtTime(0, ctx.currentTime + note.time);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + note.dur);
    });
  } catch {
    // Graceful fallback if Web Audio is blocked or unsupported
  }
};

// Multi-stage celebration fireworks using canvas-confetti
export const fireMilestoneConfetti = () => {
  // Stage 1: Central explosion
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#F59E0B', '#EF4444', '#10B981', '#6366F1', '#EC4899']
  });

  // Stage 2: Left cannon after 150ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#F59E0B', '#FBBF24', '#F43F5E']
    });
  }, 150);

  // Stage 3: Right cannon after 300ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#6366F1', '#8B5CF6', '#3B82F6']
    });
  }, 300);
};
