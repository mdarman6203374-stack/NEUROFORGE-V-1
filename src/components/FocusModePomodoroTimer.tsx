import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Bell,
  Check
} from 'lucide-react';
import { Language } from '../types';
import { PomodoroLiveStatus } from './PomodoroTimer';

interface FocusModePomodoroTimerProps {
  status: PomodoroLiveStatus | null;
  onToggleRun: () => void;
  onReset: () => void;
  onSetCustomMinutes: (minutes: number) => void;
  onToggleSound: () => void;
  onTestChime: () => void;
  language: Language;
}

const QUICK_WORK_INTERVALS = [15, 25, 35, 45, 60, 90];

export const FocusModePomodoroTimer: React.FC<FocusModePomodoroTimerProps> = ({
  status,
  onToggleRun,
  onReset,
  onSetCustomMinutes,
  onToggleSound,
  onTestChime,
  language
}) => {
  const remainingSeconds = status?.remainingSeconds ?? 25 * 60;
  const totalSeconds = status?.totalSeconds ?? 25 * 60;
  const isRunning = status?.isRunning ?? false;
  const isBreak = status?.isBreak ?? false;
  const target = status?.target ?? 'concept';
  const soundEnabled = status?.soundEnabled ?? true;
  const customMinutes = status?.customMinutes ?? 25;
  const justCompleted = Boolean(status?.justCompletedAt);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState<string>(String(customMinutes));
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftMinutes(String(customMinutes));
  }, [customMinutes]);

  // Close interval popover on outside click or Escape
  useEffect(() => {
    if (!isConfigOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsConfigOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isConfigOpen]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const currentTotalMins = Math.max(1, Math.round(totalSeconds / 60));

  const progressPercent =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)))
      : 0;

  const targetLabel = isBreak
    ? 'BREAK'
    : target === 'concept'
    ? 'CONCEPT'
    : target === 'code'
    ? 'CODE'
    : 'QUIZ';

  const handleApplyDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(draftMinutes);
    const clamped = Number.isFinite(parsed)
      ? Math.min(180, Math.max(1, Math.round(parsed)))
      : customMinutes;
    setDraftMinutes(String(clamped));
    onSetCustomMinutes(clamped);
    setIsConfigOpen(false);
  };

  return (
    <div ref={popoverRef} className="relative">
      <div
        className={`focus-mode-pomodoro-timer flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-colors ${
          justCompleted
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600'
            : isRunning
            ? isBreak
              ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
              : 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
        }`}
        aria-label="Focus Mode Pomodoro Countdown Timer"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            justCompleted
              ? 'bg-emerald-600 text-white'
              : isRunning
              ? isBreak
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-[96px] space-y-1">
          <div className="flex items-center justify-between gap-2 leading-none">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {justCompleted ? 'DONE!' : isBreak ? 'REST' : `${targetLabel} · ${currentTotalMins}M`}
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-base sm:text-lg font-mono font-extrabold tracking-tight tabular-nums leading-none ${
                justCompleted
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : isRunning
                  ? isBreak
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {isRunning ? 'left' : 'ready'}
            </span>
          </div>

          <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isBreak || justCompleted
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600 dark:bg-indigo-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action & Custom Interval Controls */}
        <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onToggleRun}
            className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            title={isRunning ? 'Pause Pomodoro timer' : 'Start Pomodoro timer'}
            aria-label={isRunning ? 'Pause Pomodoro timer' : 'Start Pomodoro timer'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset Pomodoro timer"
            aria-label="Reset Pomodoro timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsConfigOpen((prev) => !prev)}
            aria-expanded={isConfigOpen}
            className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              isConfigOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={
              language === 'hinglish'
                ? 'Custom focus interval set karein'
                : 'Set custom focus interval'
            }
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{currentTotalMins}m</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'Soft chime enabled (click to mute)' : 'Chime muted (click to unmute)'}
            aria-label={soundEnabled ? 'Mute chime' : 'Enable chime'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Focus Mode Custom Interval Popover */}
      {isConfigOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-40 space-y-3"
          role="dialog"
          aria-label="Custom work interval settings"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Custom Work Interval
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              1–180 min
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_WORK_INTERVALS.map((minsOption) => {
              const isSelected = !isBreak && currentTotalMins === minsOption;
              return (
                <button
                  key={minsOption}
                  type="button"
                  onClick={() => {
                    onSetCustomMinutes(minsOption);
                    setIsConfigOpen(false);
                  }}
                  className={`py-1.5 px-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {minsOption}m
                </button>
              );
            })}
          </div>

          <form onSubmit={handleApplyDraft} className="flex items-center gap-1.5 pt-1">
            <input
              type="number"
              min={1}
              max={180}
              value={draftMinutes}
              onChange={(e) => setDraftMinutes(e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Custom minutes input"
              placeholder="Minutes"
            />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">min</span>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              End-of-session chime: <strong className="text-slate-700 dark:text-slate-200">{soundEnabled ? 'On' : 'Muted'}</strong>
            </span>
            <button
              type="button"
              onClick={onTestChime}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Bell className="w-3 h-3 text-indigo-500" />
              <span>Test Chime</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

