import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Minus,
  SlidersHorizontal,
  Bell
} from 'lucide-react';
import { DailyTask, Language } from '../types';
import confetti from 'canvas-confetti';

export type FocusTaskTarget = 'concept' | 'code' | 'quiz';
export type TimerPreset =
  | 'pomodoro-25'
  | 'deep-50'
  | 'break-10'
  | 'short-break-5'
  | 'long-break-15'
  | 'custom';

export interface PomodoroStartRequest {
  target?: FocusTaskTarget;
  preset?: TimerPreset;
  customMinutes?: number;
  action?: 'start' | 'toggle' | 'reset' | 'set-custom' | 'toggle-sound' | 'test-chime';
  nonce: number;
}

export interface PomodoroLiveStatus {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  target: FocusTaskTarget;
  isBreak: boolean;
  preset: TimerPreset;
  soundEnabled: boolean;
  customMinutes: number;
  justCompletedAt: number | null;
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

const CUSTOM_MINS_STORAGE_KEY = 'ai_mastery_pomodoro_custom_mins';
const SOUND_ENABLED_STORAGE_KEY = 'ai_mastery_pomodoro_sound_enabled';
const LOGS_STORAGE_KEY = 'ai_mastery_pomodoro_logs';

const clampCustomMinutes = (mins: number): number => {
  if (!Number.isFinite(mins)) return 25;
  return Math.min(180, Math.max(1, Math.round(mins)));
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  currentTask,
  language,
  startRequest,
  onSessionComplete,
  onStatusChange
}) => {
  const [customMinutes, setCustomMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_MINS_STORAGE_KEY);
      return saved ? clampCustomMinutes(Number(saved)) : 25;
    } catch {
      return 25;
    }
  });
  const [customInputValue, setCustomInputValue] = useState<string>(() => String(customMinutes));

  const [activePreset, setActivePreset] = useState<TimerPreset>('pomodoro-25');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_ENABLED_STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [justCompletedAt, setJustCompletedAt] = useState<number | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [selectedTaskTarget, setSelectedTaskTarget] = useState<FocusTaskTarget>('concept');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Refs synced to latest state so timer completion callback never sees stale values
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const currentTaskRef = useRef(currentTask);
  currentTaskRef.current = currentTask;
  const selectedTaskTargetRef = useRef(selectedTaskTarget);
  selectedTaskTargetRef.current = selectedTaskTarget;
  const activePresetRef = useRef(activePreset);
  activePresetRef.current = activePreset;
  const totalSecondsRef = useRef(totalSeconds);
  totalSecondsRef.current = totalSeconds;
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  // Session history log
  const [sessionLogs, setSessionLogs] = useState<FocusSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Unlock/resume AudioContext during direct user interaction so session-end chime always works
  const unlockAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Gentle, soothing two-chord harmonic chime via Web Audio API
  const playSoftChime = useCallback((forcePlay = false) => {
    if (!forcePlay && !soundEnabledRef.current) return;
    try {
      const ctx = unlockAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Soft pentatonic bell notes (C5 -> E5 -> G5 -> C6)
      const notes = [
        { freq: 523.25, start: 0, duration: 1.4, peak: 0.085 },
        { freq: 659.25, start: 0.18, duration: 1.4, peak: 0.075 },
        { freq: 783.99, start: 0.36, duration: 1.6, peak: 0.07 },
        { freq: 1046.5, start: 0.56, duration: 1.8, peak: 0.05 }
      ];

      notes.forEach(({ freq, start, duration, peak }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        // Smooth fade-in to avoid clicks, long exponential tail for warm bell decay
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.linearRampToValueAtTime(peak, now + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration + 0.05);
      });
    } catch {
      // AudioContext blocked or unsupported fallback
    }
  }, [unlockAudioContext]);

  const getPresetSeconds = useCallback(
    (preset: TimerPreset, customMinsOverride?: number): number => {
      switch (preset) {
        case 'pomodoro-25':
          return 25 * 60;
        case 'deep-50':
          return 50 * 60;
        case 'break-10':
          return 10 * 60;
        case 'short-break-5':
          return 5 * 60;
        case 'long-break-15':
          return 15 * 60;
        case 'custom':
          return clampCustomMinutes(customMinsOverride ?? customMinutes) * 60;
      }
    },
    [customMinutes]
  );

  const applyCustomInterval = useCallback(
    (mins: number, startImmediately = false) => {
      unlockAudioContext();
      const clamped = clampCustomMinutes(mins);
      setCustomMinutes(clamped);
      setCustomInputValue(String(clamped));
      try {
        localStorage.setItem(CUSTOM_MINS_STORAGE_KEY, String(clamped));
      } catch {}

      const secs = clamped * 60;
      setActivePreset('custom');
      setTotalSeconds(secs);
      setRemainingSeconds(secs);
      setIsRunning(startImmediately);
      setCompletionMessage(null);
    },
    [unlockAudioContext]
  );

  // Persist sound preference
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Persist logs in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(sessionLogs));
    } catch {}
  }, [sessionLogs]);

  // Auto-clear completion highlight after 8 seconds
  useEffect(() => {
    if (!justCompletedAt) return;
    const t = setTimeout(() => {
      setJustCompletedAt(null);
      setCompletionMessage(null);
    }, 8000);
    return () => clearTimeout(t);
  }, [justCompletedAt]);

  // Respond immediately to commands from DailySchedulerView / Focus Mode header
  useEffect(() => {
    if (!startRequest) return;

    if (startRequest.action === 'toggle') {
      unlockAudioContext();
      setCompletionMessage(null);
      setIsRunning((prev) => !prev);
      return;
    }

    if (startRequest.action === 'reset') {
      setIsRunning(false);
      setRemainingSeconds(totalSecondsRef.current);
      setCompletionMessage(null);
      return;
    }

    if (startRequest.action === 'set-custom') {
      const nextMins = clampCustomMinutes(startRequest.customMinutes ?? customMinutes);
      applyCustomInterval(nextMins, false);
      return;
    }

    if (startRequest.action === 'toggle-sound') {
      unlockAudioContext();
      setSoundEnabled((prev) => !prev);
      return;
    }

    if (startRequest.action === 'test-chime') {
      playSoftChime(true);
      return;
    }

    // Default: 'start' action
    unlockAudioContext();
    const preset: TimerPreset = startRequest.preset || 'pomodoro-25';
    const secs = getPresetSeconds(preset, startRequest.customMinutes);
    if (preset === 'custom' && startRequest.customMinutes) {
      const clamped = clampCustomMinutes(startRequest.customMinutes);
      setCustomMinutes(clamped);
      setCustomInputValue(String(clamped));
    }
    if (startRequest.target) {
      setSelectedTaskTarget(startRequest.target);
    }
    setActivePreset(preset);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setCompletionMessage(null);
    setIsRunning(true);
    try {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {}
  }, [startRequest, applyCustomInterval, customMinutes, getPresetSeconds, playSoftChime, unlockAudioContext]);

  // Emit live timer state back to DailySchedulerView & Focus Mode header
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        isRunning,
        remainingSeconds,
        totalSeconds,
        target: selectedTaskTarget,
        isBreak: activePreset.includes('break'),
        preset: activePreset,
        soundEnabled,
        customMinutes,
        justCompletedAt
      });
    }
  }, [
    isRunning,
    remainingSeconds,
    totalSeconds,
    selectedTaskTarget,
    activePreset,
    soundEnabled,
    customMinutes,
    justCompletedAt,
    onStatusChange
  ]);

  const handleTimerComplete = useCallback(() => {
    playSoftChime(false);
    setJustCompletedAt(Date.now());

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    const preset = activePresetRef.current;
    const isBreak = preset.includes('break');
    const task = currentTaskRef.current;
    const target = selectedTaskTargetRef.current;
    const minutesFocused = Math.max(1, Math.round(totalSecondsRef.current / 60));

    setCompletionMessage(
      isBreak
        ? `Break complete! Ready for Day ${task.dayNumber}.`
        : `${minutesFocused}m focus session complete! Take a quick breather.`
    );

    try {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(
          isBreak
            ? 'SynapseLab AI · Break Complete!'
            : `SynapseLab AI · ${minutesFocused}m Focus Complete!`,
          {
            body: isBreak
              ? `Ready to resume Day ${task.dayNumber}: ${task.title}`
              : `Great work on Day ${task.dayNumber}! Take a short break before your next block.`,
            tag: 'synapselab-pomodoro-complete'
          }
        );
      }
    } catch {}

    if (!isBreak) {
      const newLog: FocusSessionLog = {
        id: `sess-${Date.now()}`,
        taskTitle: `Day ${task.dayNumber}: ${task.title}`,
        taskType:
          target === 'concept'
            ? '01. Concept Learning'
            : target === 'code'
            ? '02. Hands-on Code'
            : '03. Knowledge Review',
        durationMinutes: minutesFocused,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessionLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      if (onSessionCompleteRef.current) {
        onSessionCompleteRef.current(target, minutesFocused);
      }
      // Transition cleanly to a 5m break suggestion
      setActivePreset('short-break-5');
      setTotalSeconds(5 * 60);
      setRemainingSeconds(5 * 60);
    } else {
      // Return to custom interval if previously configured, otherwise standard 25m
      const returnPreset: TimerPreset = customMinutes !== 25 ? 'custom' : 'pomodoro-25';
      const returnSecs = (returnPreset === 'custom' ? customMinutes : 25) * 60;
      setActivePreset(returnPreset);
      setTotalSeconds(returnSecs);
      setRemainingSeconds(returnSecs);
    }
  }, [customMinutes, playSoftChime]);

  // Timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
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
  }, [isRunning, handleTimerComplete]);

  const selectPreset = (preset: TimerPreset) => {
    unlockAudioContext();
    setIsRunning(false);
    setCompletionMessage(null);
    setActivePreset(preset);
    const secs = getPresetSeconds(preset);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCompletionMessage(null);
    setRemainingSeconds(totalSeconds);
  };

  const adjustTime = (deltaMinutes: number) => {
    const deltaSecs = deltaMinutes * 60;
    const newRemaining = Math.min(180 * 60, Math.max(60, remainingSeconds + deltaSecs));
    setRemainingSeconds(newRemaining);
    setTotalSeconds((prev) => {
      const nextTotal = Math.min(180 * 60, Math.max(60, isRunning ? Math.max(newRemaining, prev) : newRemaining));
      if (!activePreset.includes('break') && !isRunning) {
        const mins = Math.round(nextTotal / 60);
        setCustomMinutes(mins);
        setCustomInputValue(String(mins));
        setActivePreset('custom');
        try {
          localStorage.setItem(CUSTOM_MINS_STORAGE_KEY, String(mins));
        } catch {}
      }
      return nextTotal;
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(customInputValue);
    applyCustomInterval(Number.isNaN(parsed) ? customMinutes : parsed, false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = 283 - 283 * progressRatio;

  const totalMinutesFocused = sessionLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutesFocused / 60);
  const remainingMins = totalMinutesFocused % 60;

  const isBreakActive = activePreset.includes('break');
  const activeIntervalMinutes = Math.round(totalSeconds / 60);

  return (
    <div
      ref={containerRef}
      className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm space-y-5 transition-colors ${
        isRunning
          ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Header with Title, Test Chime & Sound Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isRunning
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
              <span className="truncate">Pomodoro Focus Timer</span>
              {isRunning && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                  ACTIVE
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              {language === 'hinglish'
                ? 'Custom interval aur soft chime ke saath focus karein'
                : 'Custom intervals & gentle completion chime'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => playSoftChime(true)}
            className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            title="Preview soft completion chime"
          >
            <Bell className="w-3 h-3 text-indigo-500" />
            <span>Chime</span>
          </button>
          <button
            type="button"
            onClick={() => {
              unlockAudioContext();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            title={soundEnabled ? 'Soft chime enabled (click to mute)' : 'Chime muted (click to enable)'}
            aria-label={soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Session Completion Banner */}
      {completionMessage && (
        <div
          role="status"
          className="px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{completionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCompletionMessage(null);
              setJustCompletedAt(null);
            }}
            className="text-[11px] font-semibold underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Task Binding Banner */}
      <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-xs">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
          <span>DAY {currentTask.dayNumber} ACTIVE TASK</span>
          <span>
            {activePreset === 'custom'
              ? `CUSTOM ${activeIntervalMinutes}M`
              : `${activeIntervalMinutes} MIN ${isBreakActive ? 'BREAK' : 'FOCUS'}`}
          </span>
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
            type="button"
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
            type="button"
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
            type="button"
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
      <div className="space-y-2.5">
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium">
          <button
            type="button"
            onClick={() => selectPreset('pomodoro-25')}
            className={`py-1.5 px-1 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
              activePreset === 'pomodoro-25'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            25m
          </button>
          <button
            type="button"
            onClick={() => selectPreset('deep-50')}
            className={`py-1.5 px-1 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
              activePreset === 'deep-50'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="50m Deep Block"
          >
            50m
          </button>
          <button
            type="button"
            onClick={() => selectPreset('custom')}
            className={`py-1.5 px-1 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
              activePreset === 'custom'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Custom work interval"
          >
            Custom
          </button>
          <button
            type="button"
            onClick={() => selectPreset('short-break-5')}
            className={`py-1.5 px-1 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
              activePreset === 'short-break-5'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            5m Rest
          </button>
          <button
            type="button"
            onClick={() => selectPreset('break-10')}
            className={`py-1.5 px-1 rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
              activePreset === 'break-10'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            10m Rest
          </button>
        </div>

        {/* Custom Work Interval Control Row */}
        <form
          onSubmit={handleCustomSubmit}
          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70"
        >
          <label
            htmlFor="pomodoro-custom-mins"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Custom Work:</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="pomodoro-custom-mins"
              type="number"
              min={1}
              max={180}
              value={customInputValue}
              onChange={(e) => setCustomInputValue(e.target.value)}
              className="w-16 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Custom work interval minutes"
            />
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">min</span>
            <button
              type="submit"
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Set
            </button>
          </div>
        </form>
      </div>

      {/* Center SVG Circular Timer Dial */}
      <div className="relative flex flex-col items-center justify-center py-2">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="5"
              className="text-slate-100 dark:text-slate-800"
            />
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

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatTime(remainingSeconds)}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              {isBreakActive
                ? 'Relaxing Break'
                : `${activeIntervalMinutes}m Focus Interval`}
            </span>
          </div>
        </div>

        {/* Quick Fine-Tuning Controls (+5m / -5m) */}
        <div className="flex items-center gap-2 mt-4 text-xs">
          <button
            type="button"
            onClick={() => adjustTime(-5)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Subtract 5 minutes"
            aria-label="Subtract 5 minutes"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
            -5m / +5m
          </span>
          <button
            type="button"
            onClick={() => adjustTime(5)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Add 5 minutes"
            aria-label="Add 5 minutes"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Play / Pause / Reset Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            unlockAudioContext();
            setCompletionMessage(null);
            setIsRunning((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap ${
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
          type="button"
          onClick={handleReset}
          className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Reset timer"
          aria-label="Reset timer"
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

