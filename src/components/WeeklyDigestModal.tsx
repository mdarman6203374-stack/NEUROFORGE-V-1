import React, { useMemo } from 'react';
import {
  X,
  BarChart3,
  Clock,
  Flame,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Language, SchedulePace } from '../types';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { loadSrsCards, loadFeynmanHistory } from '../utils/spacedRepetition';

interface WeeklyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  pace: SchedulePace;
  completedDays: number[];
  completedConcepts: string[];
  language: Language;
  onNavigateToMemoryLab?: () => void;
}

const PACE_DAILY_HOURS: Record<SchedulePace, number> = {
  '20-months': 2.0,
  '16-months': 2.5,
  '14-months': 2.9,
  '12-months': 3.3,
  '6-months': 4.0,
  '3-months': 6.0,
  '2-hours-daily': 2.0
};

export const WeeklyDigestModal: React.FC<WeeklyDigestModalProps> = ({
  isOpen,
  onClose,
  pace,
  completedDays,
  completedConcepts,
  language,
  onNavigateToMemoryLab
}) => {
  const digest = useMemo(() => {
    const dailyHrs = PACE_DAILY_HOURS[pace] || 2.0;
    const plannedWeeklyHours = Number((dailyHrs * 7).toFixed(1));

    // Estimate completed study hours this week from completed days mod 7 (at least days mastered * dailyHrs capped cleanly)
    const recentDaysCount = Math.min(7, completedDays.length);
    const completedStudyHours = Number((recentDaysCount * dailyHrs).toFixed(1));

    // Pomodoro logs
    let pomodoroTotalMins = 0;
    let pomodoroSessions = 0;
    try {
      const rawLogs = localStorage.getItem('ai_mastery_pomodoro_logs');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      if (Array.isArray(logs)) {
        pomodoroSessions = logs.length;
        pomodoroTotalMins = logs.reduce(
          (sum: number, l: any) => sum + (Number(l?.durationMinutes) || 0),
          0
        );
      }
    } catch {}

    // SRS & Weak Quiz breakdown by Phase
    const srsCards = loadSrsCards();
    const weakByPhase = new Map<number, number>();
    srsCards
      .filter((c) => c.source === 'weak-quiz')
      .forEach((c) => {
        weakByPhase.set(c.phaseNumber, (weakByPhase.get(c.phaseNumber) || 0) + 1);
      });

    const phaseBreakdown = ROADMAP_PHASES.slice(0, 8).map((p) => {
      const total = p.concepts.length;
      const done = p.concepts.filter((c) => completedConcepts.includes(c.id)).length;
      const weakCount = weakByPhase.get(p.phaseNumber) || 0;
      const estAccuracy = Math.max(45, Math.min(100, 100 - weakCount * 14));
      return {
        phaseNumber: p.phaseNumber,
        title: p.title,
        done,
        total,
        weakCount,
        estAccuracy
      };
    });

    // Pick #1 priority concept to revisit next week
    const dueCards = srsCards.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const topWeak = dueCards.find((c) => c.source === 'weak-quiz') || dueCards[0];

    const feynmanHistory = loadFeynmanHistory();
    const avgFeynman =
      feynmanHistory.length > 0
        ? Math.round(
            feynmanHistory.reduce((s, f) => s + f.clarityScore, 0) / feynmanHistory.length
          )
        : null;

    return {
      plannedWeeklyHours,
      completedStudyHours,
      pomodoroTotalMins,
      pomodoroSessions,
      phaseBreakdown,
      topPriorityConcept:
        topWeak?.conceptTitle ||
        ROADMAP_PHASES[0].concepts[0].title,
      topPriorityReason: topWeak?.source === 'weak-quiz'
        ? `Missed in Quick Quiz (${topWeak.lapseCount} lapse${topWeak.lapseCount === 1 ? '' : 's'})`
        : 'Next scheduled 3/7/21/60-day retention checkpoint',
      avgFeynman
    };
  }, [pace, completedDays, completedConcepts]);

  if (!isOpen) return null;

  const isSunday = new Date().getDay() === 0;
  const pacePct = Math.min(
    100,
    Math.round((digest.completedStudyHours / (digest.plannedWeeklyHours || 1)) * 100)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Weekly AI Progress & Weak-Spot Digest"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 my-6">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isSunday ? 'SUNDAY WEEKLY WRAP-UP READY' : 'WEEKLY AI PROGRESS DIGEST'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              {language === 'hinglish'
                ? 'Hafte Bhar Ki Study Report aur Next Week Priority'
                : 'Your 1-Screen Weekly Study & Retention Wrap-Up'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close Weekly Digest"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Planned vs Completed + Pomodoro Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-1">
              <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                PLANNED VS. COMPLETED
              </div>
              <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {digest.completedStudyHours}h / {digest.plannedWeeklyHours}h
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {pacePct}% of weekly {pace} target
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-1">
              <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                POMODORO FOCUS TOTAL
              </div>
              <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{digest.pomodoroTotalMins} mins</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {digest.pomodoroSessions} timed focus blocks logged
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
              <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                FEYNMAN CLARITY AVG
              </div>
              <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-500" />
                <span>{digest.avgFeynman !== null ? `${digest.avgFeynman}%` : '—'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {digest.avgFeynman !== null ? 'Verified via Gemini rubric' : 'Run a 60s explainer in Memory Lab'}
              </div>
            </div>
          </div>

          {/* #1 Concept to Revisit Next Week */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>#1 PRIORITY CONCEPT TO REVISIT NEXT WEEK</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {digest.topPriorityConcept}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {digest.topPriorityReason}
              </div>
            </div>
            {onNavigateToMemoryLab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToMemoryLab();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Review Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quiz Accuracy & Mastery Trends by Phase */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quiz Accuracy & Mastery Trends by Phase
            </div>
            <div className="space-y-2">
              {digest.phaseBreakdown.map((p) => (
                <div
                  key={p.phaseNumber}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      Phase {p.phaseNumber}: {p.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {p.done}/{p.total} concepts mastered
                      {p.weakCount > 0 ? ` · ${p.weakCount} weak quiz flag${p.weakCount > 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono font-bold shrink-0">
                    {p.weakCount === 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    <span
                      className={
                        p.estAccuracy >= 85
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {p.estAccuracy}% acc
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
