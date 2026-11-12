import React, { useEffect } from 'react';
import {
  Flame,
  Zap,
  Rocket,
  Brain,
  Gem,
  Trophy,
  Crown,
  Sparkles,
  X,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { StreakMilestone, Language } from '../types';
import { fireMilestoneConfetti } from '../data/streakData';

interface StreakCelebrationModalProps {
  milestone: StreakMilestone | null;
  onClose: () => void;
  language: Language;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  milestone,
  onClose,
  language
}) => {
  useEffect(() => {
    if (milestone) {
      fireMilestoneConfetti();
    }
  }, [milestone]);

  if (!milestone) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-12 h-12 text-amber-400 animate-pulse" />;
      case 'Flame':
        return <Flame className="w-12 h-12 text-orange-500 animate-pulse" />;
      case 'Rocket':
        return <Rocket className="w-12 h-12 text-rose-500 animate-pulse" />;
      case 'Brain':
        return <Brain className="w-12 h-12 text-indigo-400 animate-pulse" />;
      case 'Gem':
        return <Gem className="w-12 h-12 text-cyan-400 animate-pulse" />;
      case 'Trophy':
        return <Trophy className="w-12 h-12 text-amber-400 animate-pulse" />;
      case 'Crown':
        return <Crown className="w-12 h-12 text-yellow-300 animate-pulse" />;
      default:
        return <Sparkles className="w-12 h-12 text-amber-400 animate-pulse" />;
    }
  };

  const handleShare = () => {
    const text = `🔥 Just reached a ${milestone.days}-Day AI Engineering Study Streak on AI Mastery! (${milestone.title}) 🚀`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Achievement copied to clipboard! Share on LinkedIn or X.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-amber-500/40 shadow-2xl p-6 sm:p-8 text-center space-y-5 overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Animated Icon Container */}
        <div className="flex justify-center pt-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-indigo-500/20 border-2 border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              {renderIcon(milestone.rewardIcon)}
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wide shadow-md flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{milestone.days} DAYS</span>
            </div>
          </div>
        </div>

        {/* Milestone Title */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>STREAK MILESTONE UNLOCKED</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100">
            {language === 'hinglish' ? milestone.hinglishTitle : milestone.title}
          </h2>

          <p className="text-xs text-amber-400/90 font-mono tracking-wider">
            {milestone.badge}
          </p>
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm leading-relaxed">
          <p>
            {language === 'hinglish' ? milestone.hinglishDesc : milestone.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              fireMilestoneConfetti();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Celebrate Again 🎉</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Streak</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
