import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Award,
  CalendarRange
} from 'lucide-react';
import {
  TIMELINE_TRACK_CONFIGS,
  generateMasterPlanForMonths
} from '../data/twentyMonthMasterPlanData';
import { Language, MasterPlanMonths, SchedulePace } from '../types';

interface TwentyMonthMasterPlanViewProps {
  language: Language;
  pace?: SchedulePace;
  onSelectPace?: (pace: SchedulePace) => void;
  onNavigateToDay: (dayNumber: number, targetPace?: SchedulePace) => void;
}

export const TwentyMonthMasterPlanView: React.FC<TwentyMonthMasterPlanViewProps> = ({
  language,
  pace = '20-months',
  onSelectPace,
  onNavigateToDay
}) => {
  const initialMonths: MasterPlanMonths =
    pace === '16-months'
      ? 16
      : pace === '14-months'
      ? 14
      : pace === '12-months'
      ? 12
      : 20;

  const [selectedMonths, setSelectedMonths] = useState<MasterPlanMonths>(initialMonths);
  const [selectedPhaseSection, setSelectedPhaseSection] = useState<string>('All');

  const activeTrack =
    TIMELINE_TRACK_CONFIGS.find((t) => t.months === selectedMonths) || TIMELINE_TRACK_CONFIGS[0];

  const monthlyPlan = useMemo(
    () => generateMasterPlanForMonths(selectedMonths),
    [selectedMonths]
  );

  // Dynamically build 4 milestone quarter sections for 12, 14, 16, or 20 months
  const sectionRanges = useMemo(() => {
    const q1End = Math.ceil(selectedMonths * 0.25);
    const q2End = Math.ceil(selectedMonths * 0.5);
    const q3End = Math.ceil(selectedMonths * 0.75);
    return [
      { label: `All ${selectedMonths} Months`, value: 'All', min: 1, max: selectedMonths },
      { label: `Months 1–${q1End} (Foundations & PyTorch)`, value: 'S1', min: 1, max: q1End },
      { label: `Months ${q1End + 1}–${q2End} (ML & Deep Learning)`, value: 'S2', min: q1End + 1, max: q2End },
      { label: `Months ${q2End + 1}–${q3End} (Transformers & LLMs)`, value: 'S3', min: q2End + 1, max: q3End },
      { label: `Months ${q3End + 1}–${selectedMonths} (RAG, Agents & Frontier)`, value: 'S4', min: q3End + 1, max: selectedMonths }
    ];
  }, [selectedMonths]);

  const filteredMonths = useMemo(() => {
    const activeSec = sectionRanges.find((s) => s.value === selectedPhaseSection);
    if (!activeSec || activeSec.value === 'All') return monthlyPlan;
    return monthlyPlan.filter(
      (m) => m.monthNumber >= activeSec.min && m.monthNumber <= activeSec.max
    );
  }, [monthlyPlan, sectionRanges, selectedPhaseSection]);

  const handleSwitchTimeline = (months: MasterPlanMonths) => {
    setSelectedMonths(months);
    setSelectedPhaseSection('All');
    const track = TIMELINE_TRACK_CONFIGS.find((t) => t.months === months);
    if (track && onSelectPace) {
      onSelectPace(track.paceId);
    }
  };

  // Dynamic time-box split in minutes for the selected duration
  const totalMins = activeTrack.dailyMins;
  const conceptMins = Math.round(totalMins * 0.42);
  const breakMins = totalMins >= 160 ? 15 : 10;
  const codingMins = Math.round(totalMins * 0.42);
  const quizMins = Math.max(10, totalMins - conceptMins - breakMins - codingMins);

  return (
    <div className="space-y-8">
      {/* Hero Banner with Flexible Completion Timeline Selector (20 / 16 / 14 / 12 Months) */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl border border-indigo-900/40 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Award className="w-4 h-4 text-amber-400" />
              <span>FLEXIBLE AI MASTER PLANS · {selectedMonths} MONTHS TRACK</span>
              <span aria-hidden="true">·</span>
              <span>{activeTrack.totalDays} DAYS · 1,200 HOURS TOTAL</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {language === 'hinglish'
                ? `${selectedMonths} Months AI Mastery Roadmap (${activeTrack.dailyHoursLabel})`
                : `${selectedMonths}-Month AI Engineering Master Plan`}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {language === 'hinglish' ? activeTrack.hinglishDesc : activeTrack.description}
            </p>
          </div>

          <div className="shrink-0 bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 lg:min-w-[260px]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-indigo-300">
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Choose Target Completion Time</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TIMELINE_TRACK_CONFIGS.map((track) => {
                const isActive = track.months === selectedMonths;
                return (
                  <button
                    key={track.months}
                    type="button"
                    onClick={() => handleSwitchTimeline(track.months)}
                    className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm font-bold'
                        : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{track.months} Months</div>
                    <div className={`text-[10px] ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {track.dailyHoursLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison Overview Cards for 20, 16, 14, 12 Month Tracks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-indigo-900/40 text-xs">
          {TIMELINE_TRACK_CONFIGS.map((track) => {
            const isSelected = track.months === selectedMonths;
            return (
              <button
                key={track.months}
                type="button"
                onClick={() => handleSwitchTimeline(track.months)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-sm">
                    {track.months} Months Plan
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {track.dailyHoursLabel}
                  </span>
                </div>
                <div className="text-[11px] text-indigo-300 font-medium">{track.tag}</div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  {track.totalDays} Days · {track.hoursPerMonth}h / month
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Structured Habit Blueprint Dynamically Scaled for Chosen Timeline */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                Daily Routine for {selectedMonths}-Month Track ({totalMins} Mins / Day)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scaled automatically so you finish all 1,200 mastery hours cleanly in {selectedMonths} months
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shrink-0">
            {activeTrack.hoursPerMonth}h / Month Pace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>BLOCK 01</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{conceptMins} MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              01. Concept & Hindi Lecture
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Watch today’s curated lecture (CampusX, Krish Naik, Chai aur Code) and write clear notes.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>REST</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{breakMins} MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              Active Rest & Hydration
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Step away from screen, stretch, and hydrate so concepts consolidate properly.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>BLOCK 02</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{codingMins} MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              02. Hands-on Coding in Editor
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Open VS Code / Jupyter Notebook and implement the daily math, tensor, or agent task.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>BLOCK 03</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{quizMins} MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              03. Quiz & Spaced Review
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Answer the quick-check retention question, verify understanding, and mark your day complete.
            </p>
          </div>
        </div>
      </div>

      {/* Section Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {sectionRanges.map((sec) => (
          <button
            key={sec.value}
            onClick={() => setSelectedPhaseSection(sec.value)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedPhaseSection === sec.value
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Month-by-Month Master Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMonths.map((m) => {
          const startDayNumber = (m.monthNumber - 1) * 30 + 1;

          return (
            <div
              key={`${selectedMonths}-${m.monthNumber}`}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {m.monthLabel}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Phase 0{m.phaseNumber}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    Days {startDayNumber} - {startDayNumber + 29} ({m.totalStudyHours}h total)
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {language === 'hinglish' ? m.hinglishTitle : m.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {m.focusSummary}
                </p>

                {/* Key Deliverables Checklist */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Monthly Deliverables:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {m.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button: Jump to Daily Planner for this Month */}
              <button
                onClick={() => onNavigateToDay(startDayNumber, activeTrack.paceId)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800/80 transition-colors cursor-pointer"
              >
                <span>Jump to Day {startDayNumber} ({selectedMonths}-Month Track)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
