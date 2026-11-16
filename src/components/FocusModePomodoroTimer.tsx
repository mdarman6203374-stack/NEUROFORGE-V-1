import React from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Language } from '../types';
import { PomodoroLiveStatus } from './PomodoroTimer';

interface FocusModePomodoroTimerProps {
  status: PomodoroLiveStatus | null;
  onToggleRun: () => void;
  onReset: () => void;
  language: Language;
}

export const FocusModePomodoroTimer: React.FC<FocusModePomodoroTimerProps> = ({
  status,
  onToggleRun,
  onReset,
  language
}) => {
  const remainingSeconds = status?.remainingSeconds ?? 25 * 60;
  const totalSeconds = status?.totalSeconds ?? 25 * 60;
  const isRunning = status?.isRunning ?? false;
  const isBreak = status?.isBreak ?? false;
  const target = status?.target ?? 'concept';

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPercent =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)))
      : 0;

  const targetLabel = isBreak
    ? language === 'hinglish'
      ? 'BREAK'
      : 'BREAK'
    : target === 'concept'
    ? 'CONCEPT'
    : target === 'code'
    ? 'CODE'
    : 'QUIZ';

  return (
    <div
      className={`focus-mode-pomodoro-timer flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-colors ${
        isRunning
          ? isBreak
            ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
            : 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
      }`}
      aria-label="Focus Mode Pomodoro Countdown Timer"
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          isRunning
            ? isBreak
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
      >
        <Timer className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
      </div>

      <div className="min-w-[88px] space-y-1">
        <div className="flex items-center justify-between gap-2 leading-none">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isBreak ? 'REST' : `SESSION · ${targetLabel}`}
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {progressPercent}%
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-base sm:text-lg font-mono font-extrabold tracking-tight tabular-nums leading-none ${
              isRunning
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
              isBreak ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
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
      </div>
    </div>
  );
};
