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
  BookOpen
} from 'lucide-react';
import { SchedulePace, Language, DailyTask } from '../types';
import { generateDailySchedule } from '../data/dailyScheduleData';
import { PomodoroTimer } from './PomodoroTimer';
import confetti from 'canvas-confetti';

interface DailySchedulerViewProps {
  pace: SchedulePace;
  setPace: (p: SchedulePace) => void;
  completedDays: number[];
  toggleDay: (day: number) => void;
  language: Language;
}

export const DailySchedulerView: React.FC<DailySchedulerViewProps> = ({
  pace,
  setPace,
  completedDays,
  toggleDay,
  language
}) => {
  const [schedule, setSchedule] = useState<DailyTask[]>(() => generateDailySchedule(pace));
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

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

  const completedCount = completedDays.length;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / (schedule.length || 1)) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Top Banner: Pace Selector & Streak Statistics */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
              <span>CUSTOMIZED DAILY STUDY ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'hinglish'
                ? 'Roadmap ke hisaab se Daily Schedule & Study Routine'
                : 'Day-by-Day Study Routine & Practice Engine'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {language === 'hinglish'
                ? 'Har din ka fixed schedule: 40% Concept (Hindi playlist), 40% Hands-on Coding, aur 20% Quick-Check Quiz.'
                : 'Structured daily 3-part routine: 40% Concept video, 40% Hands-on code task, 20% Knowledge retention.'}
            </p>
          </div>

          {/* Interactive Pace Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setPace('20-months')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                pace === '20-months'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold ring-1 ring-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              20-Month Master Plan (2h/day) ★
            </button>
            <button
              onClick={() => setPace('6-months')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                pace === '6-months'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6-Month Pro (3-4h)
            </button>
            <button
              onClick={() => setPace('3-months')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                pace === '3-months'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3-Month Sprint (6-8h)
            </button>
            <button
              onClick={() => setPace('12-months')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                pace === '12-months'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              12-Month Deep (1.5h)
            </button>
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
      </div>

      {/* Main Grid: Left is Day Card, Right is Focus Pomodoro Timer & Day Quick Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Detailed Active Day Plan */}
        <div className="lg:col-span-8 space-y-6">
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
                    ~{Math.round(activeTask.durationMins / 60)} Hours
                  </span>
                </div>

                {/* Mark as complete button */}
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

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'hinglish' ? activeTask.hinglishTitle : activeTask.title}
              </h2>
            </div>

            {/* 2-Hour Daily Structured Time-Box Breakdown */}
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {language === 'hinglish'
                      ? '2-Hour Daily Time-Box Routine (Exact 120 Minutes Breakdown)'
                      : '2-Hour Daily Time-Box Schedule (Exact 120 Mins)'}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  2 Hours Total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>00:00 - 00:50</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">50m</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs">01. Concept & Video</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Hindi playlist lecture & active notes
                  </p>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>00:50 - 01:00</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">10m</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs">Active Rest Break</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Hydration, relax eyes & stretch
                  </p>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>01:00 - 01:50</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">50m</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs">02. Code Challenge</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Hands-on script in VS Code / Notebook
                  </p>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>01:50 - 02:00</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">10m</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs">03. Retention Quiz</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Quick-check recall & summary point
                  </p>
                </div>
              </div>
            </div>

            {/* Block 1: Goal & Concept Breakdown (40% time) */}
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

            {/* Block 2: Curated Hindi YouTube Video / Playlist (Direct Action) */}
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

            {/* Block 3: Hands-on Code Challenge (40% time) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span>03. Hands-on Code Challenge of the Day</span>
              </h3>
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>TASK INSTRUCTION:</span>
                  <span>Python 3.12 / VS Code</span>
                </div>
                <p className="text-xs font-mono leading-relaxed text-emerald-300">
                  {activeTask.handsOnTask}
                </p>
              </div>
            </div>

            {/* Block 4: Quick-Check Retention Quiz (20% time) */}
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
        </div>

        {/* Right Column: Dedicated Pomodoro Study Timer + Quick Jump Strip */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Integrated Pomodoro Focus Timer */}
          <PomodoroTimer
            currentTask={activeTask}
            language={language}
          />

          {/* Quick Day Navigator Matrix */}
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
        </div>
      </div>
    </div>
  );
};
