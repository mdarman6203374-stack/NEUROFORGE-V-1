import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Coffee,
  Brain,
  Code2,
  Clock,
  Flame,
  Plus,
  Minus
} from 'lucide-react';
import { DailyTask, Language } from '../types';
import confetti from 'canvas-confetti';

export type FocusTaskTarget = 'concept' | 'code' | 'quiz';
export type TimerPreset = 'pomodoro-25' | 'deep-50' | 'break-10' | 'short-break-5' | 'long-break-15';

export interface PomodoroStartRequest {
  target?: FocusTaskTarget;
  preset?: TimerPreset;
  action?: 'start' | 'toggle' | 'reset';
  nonce: number;
}

export interface PomodoroLiveStatus {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  target: FocusTaskTarget;
  isBreak: boolean;
  preset: TimerPreset;
}

interface PomodoroTimerProps {
  currentTask: DailyTask;
  language: Language;
  startRequest?: PomodoroStartRequest | null;
  onSessionComplete?: (taskType: string, minutes: number) => void;
  onStatusChange?: (status: PomodoroLiveStatus) => void;
}

interface FocusSessionLog {
  id: string;
  taskTitle: string;
  taskType: string;
  durationMinutes: number;
  timestamp: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  currentTask,
  language,
  startRequest,
  onSessionComplete,
  onStatusChange
}) => {
  // Preset durations (in seconds)
  const PRESET_DURATIONS: Record<TimerPreset, number> = {
    'pomodoro-25': 25 * 60,
    'deep-50': 50 * 60, // 2-Hour Plan Blocks 1 & 2
    'break-10': 10 * 60, // 2-Hour Plan Rest
    'short-break-5': 5 * 60,
    'long-break-15': 15 * 60
  };

  const [activePreset, setActivePreset] = useState<TimerPreset>('pomodoro-25');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Target task block selection
  const [selectedTaskTarget, setSelectedTaskTarget] = useState<FocusTaskTarget>('concept');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Session history log for the current day
  const [sessionLogs, setSessionLogs] = useState<FocusSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_pomodoro_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const timerRef = useRef<any>(null);

  // Synthesize gentle notification chime via Web Audio API (zero external assets needed)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play soft two-tone harmonic chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880.0, ctx.currentTime); // A5

      osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6
      osc2.frequency.exponentialRampToValueAtTime(1760.0, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch {
      // AudioContext policy fallback
    }
  };

  // Respond immediately to start, toggle, or reset commands from DailySchedulerView / Focus Mode header
  useEffect(() => {
    if (!startRequest) return;
    if (startRequest.action === 'toggle') {
      setIsRunning((prev) => !prev);
      return;
    }
    if (startRequest.action === 'reset') {
      setIsRunning(false);
      setRemainingSeconds(totalSeconds);
      return;
    }
    const preset: TimerPreset = startRequest.preset || 'pomodoro-25';
    const secs = PRESET_DURATIONS[preset];
    if (startRequest.target) {
      setSelectedTaskTarget(startRequest.target);
    }
    setActivePreset(preset);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(true);
    try {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {}
  }, [startRequest]);

  // Emit live timer state back to DailySchedulerView & Focus Mode header
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        isRunning,
        remainingSeconds,
        totalSeconds,
        target: selectedTaskTarget,
        isBreak: activePreset.includes('break'),
        preset: activePreset
      });
    }
  }, [isRunning, remainingSeconds, totalSeconds, selectedTaskTarget, activePreset, onStatusChange]);

  // Timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activePreset, totalSeconds]);

  // Persist logs in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_pomodoro_logs', JSON.stringify(sessionLogs));
    } catch {}
  }, [sessionLogs]);

  const handleTimerComplete = () => {
    playChime();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 }
    });

    const isBreak = activePreset.includes('break');

    // Optional native notification on Pomodoro completion when permission is granted
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(
          isBreak ? 'NeuroForge AI · Break Complete!' : 'NeuroForge AI · 25m Focus Complete!',
          {
            body: isBreak
              ? `Ready to resume Day ${currentTask.dayNumber}: ${currentTask.title}`
              : `Great work on Day ${currentTask.dayNumber}! Take a short break before your next block.`,
            tag: 'neuroforge-pomodoro-complete'
          }
        );
      }
    } catch {}

    if (!isBreak) {
      const minutesFocused = Math.round(totalSeconds / 60);
      const newLog: FocusSessionLog = {
        id: `sess-${Date.now()}`,
        taskTitle: `Day ${currentTask.dayNumber}: ${currentTask.title}`,
        taskType:
          selectedTaskTarget === 'concept'
            ? '01. Concept Learning'
            : selectedTaskTarget === 'code'
            ? '02. Hands-on Code'
            : '03. Knowledge Review',
        durationMinutes: minutesFocused,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessionLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      if (onSessionComplete) {
        onSessionComplete(selectedTaskTarget, minutesFocused);
      }
      // Suggest break
      setActivePreset('short-break-5');
      setTotalSeconds(5 * 60);
      setRemainingSeconds(5 * 60);
    } else {
      // Return to standard focus
      setActivePreset('pomodoro-25');
      setTotalSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
    }
  };

  const selectPreset = (preset: TimerPreset) => {
    setIsRunning(false);
    setActivePreset(preset);
    const secs = PRESET_DURATIONS[preset];
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const adjustTime = (deltaMinutes: number) => {
    const deltaSecs = deltaMinutes * 60;
    const newRemaining = Math.max(60, remainingSeconds + deltaSecs);
    setRemainingSeconds(newRemaining);
    setTotalSeconds((prev) => Math.max(newRemaining, prev));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = 283 - 283 * progressRatio;

  // Total focused minutes recorded today
  const totalMinutesFocused = sessionLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutesFocused / 60);
  const remainingMins = totalMinutesFocused % 60;

  const isBreakActive = activePreset.includes('break');

  return (
    <div
      ref={containerRef}
      className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm space-y-5 transition-colors ${
        isRunning
          ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Header with Title and Mute Toggle */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isRunning
              ? 'bg-indigo-600 text-white animate-pulse'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
              <span>Pomodoro Focus Timer</span>
              {isRunning && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  LIVE
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hinglish'
                ? 'Day ke kisi bhi block par 25m focus start karein'
                : 'Built-in 25m focus timer synced to your daily task'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            title={soundEnabled ? 'Chime sound enabled' : 'Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Task Binding Banner */}
      <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-xs">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
          <span>DAY {currentTask.dayNumber} ACTIVE TASK</span>
          <span>{activePreset === 'pomodoro-25' ? '25 MIN POMODORO' : activePreset.toUpperCase()}</span>
        </div>
        <div className="font-semibold text-slate-900 dark:text-white truncate mt-0.5">
          {language === 'hinglish' ? currentTask.hinglishTitle : currentTask.title}
        </div>
      </div>

      {/* Target Task Block Selector */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Focusing On:
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedTaskTarget('concept')}
            className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-all text-center truncate cursor-pointer ${
              selectedTaskTarget === 'concept'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            01. Concept
          </button>
          <button
            onClick={() => setSelectedTaskTarget('code')}
            className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-all text-center truncate cursor-pointer ${
              selectedTaskTarget === 'code'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            02. Code Task
          </button>
          <button
            onClick={() => setSelectedTaskTarget('quiz')}
            className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-all text-center truncate cursor-pointer ${
              selectedTaskTarget === 'quiz'
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            03. Quiz Review
          </button>
        </div>
      </div>

      {/* Preset Mode Tabs */}
      <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
        <button
          onClick={() => selectPreset('pomodoro-25')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
            activePreset === 'pomodoro-25'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => selectPreset('deep-50')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
            activePreset === 'deep-50'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="50m Deep Block (Ideal for 2-Hour Daily Plan Blocks 1 & 2)"
        >
          50m (2h Block)
        </button>
        <button
          onClick={() => selectPreset('break-10')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
            activePreset === 'break-10'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          10m Break
        </button>
        <button
          onClick={() => selectPreset('short-break-5')}
          className={`flex-1 py-1 px-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
            activePreset === 'short-break-5'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          5m Break
        </button>
      </div>

      {/* Center SVG Circular Timer Dial */}
      <div className="relative flex flex-col items-center justify-center py-2">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="5"
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="5"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                isBreakActive
                  ? 'text-emerald-500'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            />
          </svg>

          {/* Time Text Inside Circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatTime(remainingSeconds)}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 capitalize">
              {isBreakActive ? 'Relaxing Break' : 'Focused Session'}
            </span>
          </div>
        </div>

        {/* Quick Fine-Tuning Controls (+5m / -5m) */}
        <div className="flex items-center gap-2 mt-4 text-xs">
          <button
            onClick={() => adjustTime(-5)}
            className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Subtract 5 minutes"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Adjust Time
          </span>
          <button
            onClick={() => adjustTime(5)}
            className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Add 5 minutes"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Play / Pause / Reset Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause Session</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start Focus</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Daily Focus Summary Metric Strip */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span className="text-slate-600 dark:text-slate-300">Total Focused Time:</span>
        </div>
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${remainingMins} mins`}
        </span>
      </div>

      {/* Recent Session History Logs */}
      {sessionLogs.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Recent Completed Sessions</span>
            <span className="font-mono">{sessionLogs.length} logged</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {sessionLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-medium truncate">{log.taskType}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 shrink-0">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    +{log.durationMinutes}m
                  </span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
