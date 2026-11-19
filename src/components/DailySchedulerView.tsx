import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flame,
  HelpCircle,
  Code2,
  ExternalLink,
  BookOpen,
  Bell,
  BellRing,
  BellOff,
  Check,
  Play,
  Timer,
  Maximize2,
  Minimize2,
  RefreshCw,
  BarChart3,
  Terminal,
  Trash2,
  NotebookPen,
  X
} from 'lucide-react';
import { SchedulePace, Language, DailyTask, StudyReminderConfig } from '../types';
import {
  collectSavedScratchpadNotes,
  SavedScratchpadEntry
} from '../utils/pdfGenerator';
import { generateDailySchedule } from '../data/dailyScheduleData';
import {
  PomodoroTimer,
  PomodoroStartRequest,
  PomodoroLiveStatus,
  FocusTaskTarget
} from './PomodoroTimer';
import { FocusModePomodoroTimer } from './FocusModePomodoroTimer';
import { AmbientNoisePlayer } from './AmbientNoisePlayer';
import { FocusMusicPlayer } from './FocusMusicPlayer';
import { StudyScratchpad } from './StudyScratchpad';
import { AiStudyBuddyPanel } from './AiStudyBuddyPanel';
import { MorningWarmupWidget } from './MorningWarmupWidget';
import { PyodideSandbox } from './PyodideSandbox';
import { WeeklyDigestModal } from './WeeklyDigestModal';
import {
  RebalancePlanState,
  loadRebalancePlan,
  computeAndSaveRebalancePlan,
  clearRebalancePlan
} from '../utils/workflowFeatures';
import {
  BrowserNotificationPermission,
  getNotificationPermission,
  requestNotificationPermission,
  sendGentleStudyNotification,
  getNextReminderLabel
} from '../utils/studyNotifications';
import confetti from 'canvas-confetti';

interface DailySchedulerViewProps {
  pace: SchedulePace;
  setPace: (p: SchedulePace) => void;
  completedDays: number[];
  toggleDay: (day: number) => void;
  language: Language;
  initialDay?: number;
  reminderConfig: StudyReminderConfig;
  setReminderConfig: React.Dispatch<React.SetStateAction<StudyReminderConfig>>;
  onShowInAppReminder?: (title: string, body: string) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onExportProgressPdf?: () => void;
  completedConcepts?: string[];
  onNavigateMemoryLab?: (subTab?: 'srs' | 'feynman') => void;
  onOpenCodeLab?: (subTab?: 'python' | 'rag' | 'bugs') => void;
}

const WEEKDAYS = [
  { label: 'S', full: 'Sun', value: 0 },
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 }
];

const PACE_OPTIONS: Array<{ id: SchedulePace; label: string; sub: string }> = [
  { id: '20-months', label: '20 Months ★', sub: '2.0h/day' },
  { id: '16-months', label: '16 Months', sub: '2.5h/day' },
  { id: '14-months', label: '14 Months', sub: '2.9h/day' },
  { id: '12-months', label: '12 Months', sub: '3.3h/day' },
  { id: '6-months', label: '6 Months', sub: '4.0h/day' },
  { id: '3-months', label: '3 Months', sub: '6.0h/day' }
];

export const DailySchedulerView: React.FC<DailySchedulerViewProps> = ({
  pace,
  setPace,
  completedDays,
  toggleDay,
  language,
  initialDay,
  reminderConfig,
  setReminderConfig,
  onShowInAppReminder,
  isFocusMode = false,
  onToggleFocusMode,
  onExportProgressPdf,
  completedConcepts = ['p0-1', 'p0-2'],
  onNavigateMemoryLab,
  onOpenCodeLab
}) => {
  const [schedule, setSchedule] = useState<DailyTask[]>(() => generateDailySchedule(pace));
  const [currentDay, setCurrentDay] = useState<number>(initialDay || 1);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<BrowserNotificationPermission>(() =>
    getNotificationPermission()
  );
  const [testNoticeStatus, setTestNoticeStatus] = useState<string | null>(null);
  const [pomodoroStartRequest, setPomodoroStartRequest] = useState<PomodoroStartRequest | null>(null);
  const [pomodoroLiveStatus, setPomodoroLiveStatus] = useState<PomodoroLiveStatus | null>(null);
  const [showPyodideInline, setShowPyodideInline] = useState<boolean>(false);
  const [isWeeklyDigestOpen, setIsWeeklyDigestOpen] = useState<boolean>(false);
  const [showRebalancePanel, setShowRebalancePanel] = useState<boolean>(false);
  const [missedDaysInput, setMissedDaysInput] = useState<number>(3);
  const [rebalancePlan, setRebalancePlan] = useState<RebalancePlanState | null>(() =>
    loadRebalancePlan()
  );
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState<boolean>(false);
  const [savedDaysList, setSavedDaysList] = useState<SavedScratchpadEntry[]>(() =>
    collectSavedScratchpadNotes()
  );

  // Keep saved day notes list in sync whenever notes are edited, cleared, or imported
  useEffect(() => {
    const refreshSavedNotes = () => {
      setSavedDaysList(collectSavedScratchpadNotes());
    };
    refreshSavedNotes();
    window.addEventListener('neuroforge-scratchpad-updated', refreshSavedNotes);
    window.addEventListener('storage', refreshSavedNotes);
    return () => {
      window.removeEventListener('neuroforge-scratchpad-updated', refreshSavedNotes);
      window.removeEventListener('storage', refreshSavedNotes);
    };
  }, [isQuickNoteOpen]);

  // Close Quick-Note sidebar with Escape without colliding with Focus Mode Escape listener
  useEffect(() => {
    if (!isQuickNoteOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        setIsQuickNoteOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isQuickNoteOpen]);

  const handleStart25MinBlock = (target: FocusTaskTarget) => {
    setPomodoroStartRequest({
      target,
      preset: 'pomodoro-25',
      action: 'start',
      nonce: Date.now()
    });
  };

  const handleToggleHeaderPomodoro = () => {
    setPomodoroStartRequest({
      action: 'toggle',
      nonce: Date.now()
    });
  };

  const handleResetHeaderPomodoro = () => {
    setPomodoroStartRequest({
      action: 'reset',
      nonce: Date.now()
    });
  };

  const handleSetCustomPomodoroMinutes = (minutes: number) => {
    setPomodoroStartRequest({
      action: 'set-custom',
      preset: 'custom',
      customMinutes: minutes,
      nonce: Date.now()
    });
  };

  const handleTogglePomodoroSound = () => {
    setPomodoroStartRequest({
      action: 'toggle-sound',
      nonce: Date.now()
    });
  };

  const handleTestPomodoroChime = () => {
    setPomodoroStartRequest({
      action: 'test-chime',
      nonce: Date.now()
    });
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (initialDay && initialDay >= 1) {
      setCurrentDay(initialDay);
    }
  }, [initialDay]);

  // Update schedule when pace changes
  useEffect(() => {
    const newSchedule = generateDailySchedule(pace);
    setSchedule(newSchedule);
    if (currentDay > newSchedule.length) {
      setCurrentDay(1);
    }
  }, [pace]);

  const activeTask = schedule.find((t) => t.dayNumber === currentDay) || schedule[0];
  const isDayCompleted = completedDays.includes(currentDay);
  const activeDaySavedEntry = savedDaysList.find((entry) => entry.dayNumber === activeTask.dayNumber);

  const handleToggleCurrentDay = () => {
    toggleDay(currentDay);
    if (!isDayCompleted) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
    }
  };

  const handlePrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(currentDay - 1);
      setShowAnswer(false);
    }
  };

  const handleNextDay = () => {
    if (currentDay < schedule.length) {
      setCurrentDay(currentDay + 1);
      setShowAnswer(false);
    }
  };

  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setReminderConfig((prev) => ({ ...prev, enabled: true }));
      const res = sendGentleStudyNotification({
        dayNumber: activeTask.dayNumber,
        taskTitle: activeTask.title,
        hinglishTitle: activeTask.hinglishTitle,
        durationMins: activeTask.durationMins,
        language,
        isTest: true
      });
      setTestNoticeStatus(
        res.dispatchedNative
          ? 'Browser notifications enabled! Test alert sent.'
          : 'Schedule enabled! Note: OS popup may be suppressed inside iframe; in-app banner is active.'
      );
      setTimeout(() => setTestNoticeStatus(null), 4000);
    } else if (perm === 'denied') {
      setTestNoticeStatus('Browser blocked notifications. Enable notifications in browser site settings, or rely on in-app reminders.');
      setTimeout(() => setTestNoticeStatus(null), 5000);
    }
  };

  const handleToggleReminderEnabled = async () => {
    if (!reminderConfig.enabled && notifPermission === 'default') {
      await handleRequestNotifications();
      return;
    }
    setReminderConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleToggleWeekday = (dayIdx: number) => {
    setReminderConfig((prev) => {
      const exists = prev.daysOfWeek.includes(dayIdx);
      const nextDays = exists
        ? prev.daysOfWeek.filter((d) => d !== dayIdx)
        : [...prev.daysOfWeek, dayIdx].sort();
      return { ...prev, daysOfWeek: nextDays };
    });
  };

  const handleSendTestReminder = async () => {
    let currentPerm = getNotificationPermission();
    if (currentPerm === 'default') {
      currentPerm = await requestNotificationPermission();
      setNotifPermission(currentPerm);
    }

    const result = sendGentleStudyNotification({
      dayNumber: activeTask.dayNumber,
      taskTitle: activeTask.title,
      hinglishTitle: activeTask.hinglishTitle,
      durationMins: activeTask.durationMins,
      language,
      isTest: true
    });

    if (onShowInAppReminder) {
      onShowInAppReminder(result.title, result.body);
    }

    setTestNoticeStatus(
      result.dispatchedNative
        ? 'Gentle browser notification sent!'
        : `Gentle in-app reminder shown (${result.reason || 'preview fallback'})`
    );
    setTimeout(() => setTestNoticeStatus(null), 4000);
  };

  const completedCount = completedDays.length;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / (schedule.length || 1)) * 100)
  );

  // Dynamic time-box split calculation for selected pace duration
  const totalMins = activeTask.durationMins || 120;
  const conceptMins = Math.round(totalMins * 0.42);
  const breakMins = totalMins >= 160 ? 15 : 10;
  const codingMins = Math.round(totalMins * 0.42);
  const quizMins = Math.max(10, totalMins - conceptMins - breakMins - codingMins);
  const totalHoursFormatted = (totalMins / 60).toFixed(1).replace(/\.0$/, '');

  return (
    <div className="daily-scheduler-view space-y-6 sm:space-y-8">
      {/* Compact Focus Mode Bar when Active OR Full Pace/Metrics Banner */}
      {isFocusMode ? (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-300 dark:border-indigo-700/70 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg bg-indigo-600 text-white">
              <Timer className="w-3.5 h-3.5" />
              Focus Mode
            </span>
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                DAY {activeTask.dayNumber}/{schedule.length}
              </span>
              <span aria-hidden="true" className="mx-2 text-slate-400">·</span>
              <span className="truncate">
                {language === 'hinglish' ? activeTask.hinglishTitle : activeTask.title}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <FocusModePomodoroTimer
              status={pomodoroLiveStatus}
              onToggleRun={handleToggleHeaderPomodoro}
              onReset={handleResetHeaderPomodoro}
              onSetCustomMinutes={handleSetCustomPomodoroMinutes}
              onToggleSound={handleTogglePomodoroSound}
              onTestChime={handleTestPomodoroChime}
              language={language}
            />
            <button
              type="button"
              onClick={() => setIsQuickNoteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
              title={`Open Quick-Note Sidebar for Day ${activeTask.dayNumber}`}
            >
              <NotebookPen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Quick Note</span>
              {activeDaySavedEntry && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 tabular-nums">
                  {activeDaySavedEntry.wordCount}w
                </span>
              )}
            </button>
            {onToggleFocusMode && (
              <button
                type="button"
                onClick={onToggleFocusMode}
                aria-pressed={true}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Exit distraction-free Focus Mode (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Focus Mode</span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">(Esc)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Top Banner: Pace Selector (20/16/14/12/6/3 Months) & Streak Statistics */
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                  <span>CUSTOMIZED DAILY STUDY ENGINE</span>
                </div>
                {onToggleFocusMode && (
                  <button
                    type="button"
                    onClick={onToggleFocusMode}
                    aria-pressed={false}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer xl:hidden"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Focus Mode</span>
                  </button>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'hinglish'
                  ? 'Target Timeline ke hisaab se Daily Study Schedule'
                  : 'Day-by-Day Study Routine & Practice Engine'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {language === 'hinglish'
                  ? '20, 16, 14, 12, 6, ya 3 months track chunein — rozana ka schedule aur time-box apne aap adjust ho jayega.'
                  : 'Select your completion timeframe (20, 16, 14, 12, 6, or 3 months) — daily hours and milestones adapt automatically.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row xl:items-center gap-2.5 shrink-0">
              {/* Interactive Pace Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                {PACE_OPTIONS.map((opt) => {
                  const isSelected = pace === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setPace(opt.id)}
                      className={`px-2.5 py-1.5 text-left rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold ring-1 ring-indigo-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="text-xs leading-tight">{opt.label}</div>
                      <div className="text-[10px] font-mono opacity-75">{opt.sub}</div>
                    </button>
                  );
                })}
              </div>

              {onToggleFocusMode && (
                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  aria-pressed={false}
                  className="hidden xl:inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Hide navigation bar, footer & distractions for deep study"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Focus Mode</span>
                </button>
              )}
            </div>
          </div>

          {/* Metric Bar: Days completed, Streak, Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Days Mastered</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {completedCount} / {schedule.length} Days
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Active Streak</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {completedCount > 0 ? `${Math.min(completedCount, 7)} Days on Fire` : 'Start Today!'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Curriculum Progress</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Smarter Workflow Controls: Missed-Day Auto-Rescheduler + Weekly AI Progress Digest */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRebalancePanel((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  rebalancePlan
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {rebalancePlan
                    ? `Catch-Up Active (${rebalancePlan.missedDaysCount}d shifted)`
                    : 'Missed Days? Auto-Rebalance'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsWeeklyDigestOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Sunday Progress Digest</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {rebalancePlan
                ? rebalancePlan.preservedTimelineLabel
                : 'Adaptive Weekend Catch-Up Ready'}
            </span>
          </div>

          {showRebalancePanel && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Dynamic Missed-Day Catch-Up Auto-Rescheduler
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Shift missed weekday study blocks into compact 55% weekend sprints without breaking your target{' '}
                    <span className="font-mono font-semibold">{pace}</span> timeline.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-slate-600 dark:text-slate-300 font-semibold">
                    Missed Days:
                  </label>
                  <select
                    value={missedDaysInput}
                    onChange={(e) => setMissedDaysInput(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Day' : 'Days'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const plan = computeAndSaveRebalancePlan(
                        pace,
                        schedule,
                        completedDays,
                        currentDay,
                        missedDaysInput
                      );
                      setRebalancePlan(plan);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                  >
                    Rebalance Schedule
                  </button>
                  {rebalancePlan && (
                    <button
                      type="button"
                      onClick={() => {
                        clearRebalancePlan();
                        setRebalancePlan(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 cursor-pointer"
                      title="Clear catch-up plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {rebalancePlan && rebalancePlan.weekendSlots.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {rebalancePlan.weekendSlots.map((slot) => (
                    <div
                      key={slot.weekendIndex}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          {slot.weekendLabel}
                        </span>
                        <span className="text-slate-500">{slot.totalWeekendMins}m sprint</span>
                      </div>
                      <ul className="space-y-1">
                        {slot.absorbedDays.map((d) => (
                          <li key={d.dayNumber} className="flex items-center justify-between gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setCurrentDay(d.dayNumber)}
                              className="text-left text-indigo-600 dark:text-indigo-400 hover:underline truncate cursor-pointer"
                            >
                              Day {d.dayNumber}: {d.title}
                            </button>
                            <span className="font-mono text-slate-400 shrink-0">
                              {d.estCatchupMins}m
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left is Morning Warmup + Day Card, Right is Focus Pomodoro Timer, Notification Scheduler & Day Quick Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Detailed Active Day Plan */}
        <div className="lg:col-span-8 space-y-6">
          {/* 3-Minute Morning Warmup SRS Queue */}
          {!isFocusMode && (
            <MorningWarmupWidget
              completedConcepts={completedConcepts}
              language={language}
              onOpenMemoryLab={onNavigateMemoryLab}
            />
          )}

          {/* Day Navigation Toolbar */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={handlePrevDay}
              disabled={currentDay <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Day</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">
                DAY {activeTask.dayNumber} OF {schedule.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                (Phase 0{activeTask.phaseNumber})
              </span>
            </div>

            <button
              onClick={handleNextDay}
              disabled={currentDay >= schedule.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next Day</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Daily Task Card */}
          <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Task Header */}
            <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    PHASE 0{activeTask.phaseNumber}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Focus: {activeTask.focusArea}
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    ~{totalHoursFormatted} Hours ({totalMins}m)
                  </span>
                </div>

                {/* Action Buttons: Quick Note + Start 25m Study Block + Mark Day Complete */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickNoteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/70 transition-colors cursor-pointer"
                    title={`Open Quick-Note Sidebar for Day ${activeTask.dayNumber}`}
                  >
                    <NotebookPen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Quick Note</span>
                    {activeDaySavedEntry && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 tabular-nums">
                        {activeDaySavedEntry.wordCount}w
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStart25MinBlock('concept')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      pomodoroLiveStatus?.isRunning
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-white dark:text-indigo-300 border-slate-800 dark:border-indigo-500/40'
                    }`}
                  >
                    {pomodoroLiveStatus?.isRunning ? (
                      <>
                        <Timer className="w-3.5 h-3.5 animate-pulse text-indigo-600 dark:text-indigo-400" />
                        <span className="font-mono">
                          Focusing {formatCountdown(pomodoroLiveStatus.remainingSeconds)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start 25m Study Block</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleToggleCurrentDay}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isDayCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isDayCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Completed!</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>Mark Day Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'hinglish' ? activeTask.hinglishTitle : activeTask.title}
              </h2>
            </div>

            {/* Dynamic Structured Time-Box Breakdown with Quick 25m Pomodoro Launchers */}
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {language === 'hinglish'
                      ? `${totalHoursFormatted}-Hour Daily Time-Box (${totalMins} Minutes Breakdown)`
                      : `${totalHoursFormatted}-Hour Daily Time-Box Schedule (${totalMins} Mins)`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {totalHoursFormatted}h Total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>BLOCK 01</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{conceptMins}m</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">01. Concept & Video</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Hindi playlist lecture & active notes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart25MinBlock('concept')}
                    className="w-full flex items-center justify-center gap-1 py-1 px-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start 25m</span>
                  </button>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>REST</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{breakMins}m</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs">Active Rest Break</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Hydration, relax eyes & stretch
                  </p>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>BLOCK 02</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{codingMins}m</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">02. Code Challenge</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Hands-on script in VS Code / Notebook
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart25MinBlock('code')}
                    className="w-full flex items-center justify-center gap-1 py-1 px-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start 25m</span>
                  </button>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>BLOCK 03</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{quizMins}m</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">03. Retention Quiz</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Quick-check recall & summary point
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart25MinBlock('quiz')}
                    className="w-full flex items-center justify-center gap-1 py-1 px-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-md transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start 25m</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Block 1: Goal & Concept Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>01. Learning Goal & Concept Breakdown</span>
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeTask.learningGoal}
              </p>
              {language === 'hinglish' && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <span className="font-bold">Hinglish Guide: </span>
                  {activeTask.hinglishGoal}
                </div>
              )}
            </div>

            {/* Block 2: Curated Hindi YouTube Video / Playlist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span>02. Recommended Hindi Video / Playlist for Today</span>
              </h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">
                    {activeTask.recommendedHindiPlaylist}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Watch today’s corresponding lecture and implement live notes in your code editor.
                  </div>
                </div>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    activeTask.playlistSearchQuery
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Open Video on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Block 3: Hands-on Code Challenge */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  <span>03. Hands-on Code Challenge of the Day</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPyodideInline((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      showPyodideInline
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    <span>
                      {showPyodideInline
                        ? 'Hide In-Browser Python Sandbox'
                        : 'Run in Browser Python Sandbox'}
                    </span>
                  </button>

                  {onOpenCodeLab && (
                    <button
                      type="button"
                      onClick={() => onOpenCodeLab('bugs')}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Bug Spotter →
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>TASK INSTRUCTION:</span>
                  <span>Pyodide Python 3.11 / VS Code</span>
                </div>
                <p className="text-xs font-mono leading-relaxed text-emerald-300">
                  {activeTask.handsOnTask}
                </p>
              </div>

              {showPyodideInline && (
                <PyodideSandbox
                  compact
                  language={language}
                  suggestedPhase={activeTask.phaseNumber}
                  customPrompt={activeTask.handsOnTask}
                />
              )}
            </div>

            {/* Block 4: Quick-Check Retention Quiz */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <span>04. Quick-Check Retention Question</span>
              </h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Q: {activeTask.quickCheckQuestion}
                </p>

                {showAnswer ? (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">Answer:</div>
                    <p className="leading-relaxed">{activeTask.quickCheckAnswer}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                  >
                    Click to Reveal Answer & Verify
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Per-Day LocalStorage Study Scratchpad */}
          <StudyScratchpad
            dayNumber={activeTask.dayNumber}
            dayTitle={language === 'hinglish' ? activeTask.hinglishTitle : activeTask.title}
            language={language}
            onExportReportPdf={onExportProgressPdf}
          />

          {/* AI Study Buddy Peer Matcher & Local-State Progress Note Sharing */}
          {!isFocusMode && (
            <AiStudyBuddyPanel
              activeTask={activeTask}
              language={language}
              completedDaysCount={completedCount}
            />
          )}
        </div>

        {/* Right Column: Browser Study Reminders + Pomodoro Timer + Quick Jump Matrix */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          {/* Browser Notification Reminder Scheduler (Hidden in Focus Mode) */}
          {!isFocusMode && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {reminderConfig.enabled ? (
                      <BellRing className="w-4 h-4 text-emerald-500 animate-pulse" />
                    ) : (
                      <Bell className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Daily Study Reminders</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'hinglish'
                      ? 'Aapke chosen time par gentle browser notification'
                      : 'Gentle browser Notification API alert at study time'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleReminderEnabled}
                  aria-label="Toggle daily browser reminders"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    reminderConfig.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                      reminderConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Schedule Time Input & Presets */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="study-reminder-time"
                    className="font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Reminder Time
                  </label>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    {getNextReminderLabel(reminderConfig, language)}
                  </span>
                </div>

                <input
                  id="study-reminder-time"
                  type="time"
                  value={reminderConfig.time}
                  onChange={(e) =>
                    setReminderConfig((prev) => ({
                      ...prev,
                      time: e.target.value || '19:30'
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick Time Presets */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { label: '7:00 AM', val: '07:00' },
                    { label: '6:30 PM', val: '18:30' },
                    { label: '8:00 PM', val: '20:00' },
                    { label: '9:30 PM', val: '21:30' }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() =>
                        setReminderConfig((prev) => ({ ...prev, time: preset.val, enabled: true }))
                      }
                      className={`px-2 py-1 rounded-md font-mono transition-colors cursor-pointer ${
                        reminderConfig.time === preset.val
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Days Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Repeat on Days
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d) => {
                    const active = reminderConfig.daysOfWeek.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => handleToggleWeekday(d.value)}
                        title={d.full}
                        className={`py-1.5 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permission Action + Test Reminder Button */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>
                      {notifPermission === 'denied'
                        ? 'Notifications Blocked (Check Browser Settings)'
                        : 'Allow Browser Notifications'}
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {notifPermission === 'granted' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Permission Granted</span>
                      </>
                    ) : notifPermission === 'unsupported' ? (
                      <>
                        <BellOff className="w-3.5 h-3.5 text-amber-500" />
                        <span>In-App Mode</span>
                      </>
                    ) : (
                      <span>Status: {notifPermission}</span>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={handleSendTestReminder}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Send Test Reminder
                  </button>
                </div>

                {testNoticeStatus && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                    {testNoticeStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Integrated Pomodoro Focus Timer */}
          <PomodoroTimer
            currentTask={activeTask}
            language={language}
            startRequest={pomodoroStartRequest}
            onStatusChange={setPomodoroLiveStatus}
          />

          {/* Calming Lo-Fi Focus Music Player (HTML5 Audio API) */}
          <FocusMusicPlayer language={language} />

          {/* Focus Mode Ambient Soundscapes (Rain, Cafe, White Noise) */}
          {isFocusMode && (
            <AmbientNoisePlayer language={language} isFocusMode={isFocusMode} />
          )}

          {/* Quick Day Navigator Matrix (Hidden in Focus Mode) */}
          {!isFocusMode && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Jump to Day
                </span>
                <span className="text-slate-400 font-mono">Total {schedule.length}</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-60 overflow-y-auto p-1">
                {schedule.map((task) => {
                  const isCurrent = task.dayNumber === currentDay;
                  const isCompleted = completedDays.includes(task.dayNumber);

                  return (
                    <button
                      key={task.dayNumber}
                      onClick={() => {
                        setCurrentDay(task.dayNumber);
                        setShowAnswer(false);
                      }}
                      className={`py-1.5 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400'
                          : isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {task.dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly AI Progress & Weak-Spot Digest Modal */}
      <WeeklyDigestModal
        isOpen={isWeeklyDigestOpen}
        onClose={() => setIsWeeklyDigestOpen(false)}
        pace={pace}
        completedDays={completedDays}
        completedConcepts={completedConcepts}
        language={language}
        onNavigateToMemoryLab={() => {
          setIsWeeklyDigestOpen(false);
          if (onNavigateMemoryLab) {
            onNavigateMemoryLab('srs');
          }
        }}
      />

      {/* Quick-Note Slide-Over Sidebar Linked Per Study Day */}
      {isQuickNoteOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Quick-Note Sidebar for Day ${activeTask.dayNumber}`}
          onClick={() => setIsQuickNoteOpen(false)}
        >
          <aside
            className="w-full max-w-lg h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <NotebookPen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'hinglish' ? 'Quick Study Notes' : 'Quick-Note Scratchpad'}
                    </h2>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 tabular-nums">
                      DAY {activeTask.dayNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Phase 0{activeTask.phaseNumber} · {activeTask.focusArea}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  disabled={currentDay <= 1}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Previous Day Notes"
                  aria-label="Previous Day"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  disabled={currentDay >= schedule.length}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Next Day Notes"
                  aria-label="Next Day"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickNoteOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Close Quick-Note Sidebar (Esc)"
                  aria-label="Close Quick-Note Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Saved Notes Day Quick-Switch Strip */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {language === 'hinglish' ? 'Saved Study Days Notes' : 'Days With Saved Notes'}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {savedDaysList.length} {savedDaysList.length === 1 ? 'day' : 'days'}
                  </span>
                </div>

                {savedDaysList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {savedDaysList.map((entry) => {
                      const isCurrent = entry.dayNumber === activeTask.dayNumber;
                      return (
                        <button
                          key={entry.dayNumber}
                          type="button"
                          onClick={() => {
                            if (entry.dayNumber <= schedule.length) {
                              setCurrentDay(entry.dayNumber);
                              setShowAnswer(false);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-colors cursor-pointer tabular-nums ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={`Jump to Day ${entry.dayNumber} (${entry.wordCount} words)`}
                        >
                          <span>Day {entry.dayNumber}</span>
                          <span
                            className={`text-[10px] ${
                              isCurrent ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            ({entry.wordCount}w)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'hinglish'
                      ? `Abhi tak koi day notes save nahi hain — Day ${activeTask.dayNumber} se likhna shuru karein!`
                      : `No saved study notes yet — start writing for Day ${activeTask.dayNumber} below.`}
                  </p>
                )}
              </div>

              {/* Synced Per-Day Scratchpad Editor */}
              <StudyScratchpad
                dayNumber={activeTask.dayNumber}
                dayTitle={language === 'hinglish' ? activeTask.hinglishTitle : activeTask.title}
                language={language}
                onExportReportPdf={onExportProgressPdf}
                rows={12}
              />
            </div>

            {/* Sidebar Footer */}
            <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                {language === 'hinglish'
                  ? `Day ${activeTask.dayNumber} notes auto-saved in localStorage`
                  : `Linked & saved to localStorage for Day ${activeTask.dayNumber}`}
              </span>
              <button
                type="button"
                onClick={() => setIsQuickNoteOpen(false)}
                className="px-3 py-1 font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
