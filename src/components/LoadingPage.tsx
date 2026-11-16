import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface LoadingPageProps {
  isAuthLoading: boolean;
  language: Language;
  completedConceptsCount: number;
  currentStreak: number;
  onComplete: () => void;
}

const STAGES_EN = [
  { threshold: 0, label: 'Loading curriculum & daily planner' },
  { threshold: 35, label: 'Restoring study milestones & streak' },
  { threshold: 70, label: 'Connecting AI Tutor & Neural Lab' },
  { threshold: 96, label: 'Workspace ready' }
];

const STAGES_HINGLISH = [
  { threshold: 0, label: 'Curriculum aur daily planner load ho raha hai' },
  { threshold: 35, label: 'Study milestones aur streak restore ho rahi hai' },
  { threshold: 70, label: 'AI Tutor aur Neural Lab tayyar ho raha hai' },
  { threshold: 96, label: 'Workspace tayyar hai' }
];

export const LoadingPage: React.FC<LoadingPageProps> = ({
  isAuthLoading,
  language,
  completedConceptsCount,
  currentStreak,
  onComplete
}) => {
  const [progress, setProgress] = useState<number>(12);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);
  const isAuthLoadingRef = useRef<boolean>(isAuthLoading);

  useEffect(() => {
    isAuthLoadingRef.current = isAuthLoading;
  }, [isAuthLoading]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const triggerExit = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setProgress(100);
    setIsExiting(true);
    window.setTimeout(
      () => {
        onComplete();
      },
      prefersReducedMotion ? 80 : 320
    );
  };

  useEffect(() => {
    const startTime = performance.now();
    const minDurationMs = prefersReducedMotion ? 260 : 1250;
    let rafId = 0;

    const tick = (now: number) => {
      if (completedRef.current) return;
      const elapsed = now - startTime;
      const timeRatio = Math.min(1, elapsed / minDurationMs);

      // Ease out cubic curve up to 88% while auth is settling, or 100% once auth resolves (or 3.2s safety cap)
      const authReady = !isAuthLoadingRef.current || elapsed >= 3200;
      const eased = 1 - Math.pow(1 - timeRatio, 3);
      const ceiling = authReady ? 100 : 88;
      const nextValue = Math.min(ceiling, Math.round(12 + eased * (ceiling - 12)));

      setProgress((prev) => (nextValue > prev ? nextValue : prev));

      if (nextValue >= 100 && authReady && elapsed >= minDurationMs) {
        window.setTimeout(() => {
          triggerExit();
        }, 160);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [prefersReducedMotion]);

  // Allow instant keyboard skip with Escape or Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stages = language === 'hinglish' ? STAGES_HINGLISH : STAGES_EN;
  const activeStage =
    [...stages].reverse().find((stage) => progress >= stage.threshold) || stages[0];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading NeuroForge AI workspace"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-[opacity,transform] duration-300 ease-out select-none ${
        isExiting ? 'opacity-0 scale-[0.985] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle geometric background radial wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center"
      >
        <div className="w-[34rem] h-[34rem] rounded-full bg-indigo-500/8 dark:bg-indigo-500/12 blur-3xl" />
      </div>

      {/* Centered Editorial Boot Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Custom Geometric Neural Lattice Emblem */}
        <div className="relative mb-8 flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/60 dark:shadow-black/40">
          <svg
            viewBox="0 0 64 64"
            className="w-11 h-11"
            fill="none"
            aria-hidden="true"
          >
            {/* Outer hexagon lattice */}
            <path
              d="M32 6L54 19V45L32 58L10 45V19L32 6Z"
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            {/* Inner neural signal pathways */}
            <path
              d="M32 15L46 23V41L32 49L18 41V23L32 15Z"
              className="stroke-indigo-600 dark:stroke-indigo-400"
              strokeWidth="2"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 140,
                strokeDashoffset: prefersReducedMotion ? 0 : Math.max(0, 140 - (progress / 100) * 140),
                transition: 'stroke-dashoffset 180ms ease-out'
              }}
            />
            {/* Cross connections */}
            <path
              d="M32 15V49M18 23L46 41M46 23L18 41"
              className="stroke-indigo-500/40 dark:stroke-indigo-400/35"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Central core & nodes */}
            <circle cx="32" cy="32" r="4.5" className="fill-amber-500" />
            <circle cx="32" cy="15" r="2.5" className="fill-indigo-600 dark:fill-indigo-400" />
            <circle cx="46" cy="23" r="2.5" className="fill-indigo-600 dark:fill-indigo-400" />
            <circle cx="46" cy="41" r="2.5" className="fill-indigo-600 dark:fill-indigo-400" />
            <circle cx="32" cy="49" r="2.5" className="fill-indigo-600 dark:fill-indigo-400" />
            <circle cx="18" cy="41" r="2.5" className="fill-indigo-600 dark:fill-indigo-400" />
            <circle cx="18" cy="23" r="2.5" className="fill-indigo-600 dark:fill-indigo-400" />
          </svg>
        </div>

        {/* Brand Identity */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          NeuroForge AI
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
          {language === 'hinglish'
            ? 'AI Engineering Mastery OS & 24/7 Study Copilot'
            : 'Interactive AI Engineering Mastery OS & Copilot'}
        </p>

        {/* Hairline Progress Module */}
        <div className="mt-9 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 text-xs mb-3">
            <span className="text-slate-700 dark:text-slate-300 font-medium text-left truncate">
              {activeStage.label}
            </span>
            <span className="font-mono font-semibold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
              {progress}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 rounded-full origin-left transition-transform duration-150 ease-out"
              style={{
                transform: `scaleX(${Math.max(0.04, progress / 100)})`
              }}
            />
          </div>

          {/* Grounded Learner Summary Row */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              {completedConceptsCount} {language === 'hinglish' ? 'concepts seekhe' : 'concepts mastered'}
            </span>
            <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
              {currentStreak} {language === 'hinglish' ? 'din streak' : 'day streak'}
            </span>
          </div>
        </div>

        {/* Immediate Enter / Skip Action */}
        <button
          type="button"
          onClick={triggerExit}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{language === 'hinglish' ? 'Seedha Workspace Kholein' : 'Enter Workspace'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
