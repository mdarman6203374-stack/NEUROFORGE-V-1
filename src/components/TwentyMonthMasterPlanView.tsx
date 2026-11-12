import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  Flame,
  Target
} from 'lucide-react';
import { TWENTY_MONTH_MASTER_PLAN } from '../data/twentyMonthMasterPlanData';
import { Language } from '../types';

interface TwentyMonthMasterPlanViewProps {
  language: Language;
  onNavigateToDay: (dayNumber: number) => void;
}

export const TwentyMonthMasterPlanView: React.FC<TwentyMonthMasterPlanViewProps> = ({
  language,
  onNavigateToDay
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');

  const quarters = [
    { label: 'All 20 Months', value: 'All' },
    { label: 'Months 1-5 (Math, Python, PyTorch)', value: 'Q1' },
    { label: 'Months 6-10 (ML, Tree Ensembles & DL)', value: 'Q2' },
    { label: 'Months 11-15 (Transformers, LLMs & vLLM)', value: 'Q3' },
    { label: 'Months 16-20 (RAG, Agents, Ops & Frontier)', value: 'Q4' }
  ];

  const filteredMonths = TWENTY_MONTH_MASTER_PLAN.filter((m) => {
    if (selectedQuarter === 'All') return true;
    if (selectedQuarter === 'Q1') return m.monthNumber >= 1 && m.monthNumber <= 5;
    if (selectedQuarter === 'Q2') return m.monthNumber >= 6 && m.monthNumber <= 10;
    if (selectedQuarter === 'Q3') return m.monthNumber >= 11 && m.monthNumber <= 15;
    if (selectedQuarter === 'Q4') return m.monthNumber >= 16 && m.monthNumber <= 20;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner: 20-Month Master Plan */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl border border-indigo-900/40 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <Award className="w-4 h-4 text-amber-400" />
          <span>20-MONTH MASTER PLAN · 2 HOURS DAILY</span>
          <span aria-hidden="true">·</span>
          <span>600 DAYS · 1,200 HOURS TOTAL MASTERY</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {language === 'hinglish'
            ? '20 Months Master Plan: Daily 2 Hours Structured Learning'
            : '20-Month AI Engineering Master Plan (2 Hours / Day)'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {language === 'hinglish'
            ? 'Kayi log 1 mahine mein AI seekhne ki koshish karke burn out ho jate hain. Yeh 20-month master plan unke liye hai jo daily 2 hours dekar zero se lekar senior AI engineer level ki true mastery haasil karna chahte hain. 600 days mein har concept, mathematical derivation, aur production project cover hoga.'
            : 'True mastery in AI engineering requires consistent deliberate practice rather than frantic cramming. This 20-month master plan breaks down the entire journey into a sustainable daily 2-hour habit across 600 days (1,200 hours of focused depth).'}
        </p>

        {/* 4 Quantitative Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-indigo-900/40 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-slate-400">Total Duration</div>
            <div className="text-base font-bold font-mono text-white">20 Months</div>
            <div className="text-[11px] text-slate-400">600 Consecutive Days</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-slate-400">Daily Commitment</div>
            <div className="text-base font-bold font-mono text-emerald-400">2 Hours / Day</div>
            <div className="text-[11px] text-slate-400">Exact 120 Minutes Time-box</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-slate-400">Total Study Time</div>
            <div className="text-base font-bold font-mono text-indigo-400">1,200 Hours</div>
            <div className="text-[11px] text-slate-400">60 Hours per Month</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="text-slate-400">Career Outcome</div>
            <div className="text-base font-bold font-mono text-amber-400">Staff AI Engineer</div>
            <div className="text-[11px] text-slate-400">$140k-$220k / ₹24L-₹55L+</div>
          </div>
        </div>
      </div>

      {/* The 2-Hour Daily Habit Blueprint */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>How Your 2 Hours Are Structured Every Single Day (120 Mins)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The exact rhythm to maintain focus without mental fatigue
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shrink-0">
            Zero Burnout Formula
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>MINUTES 00 - 50</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">50 MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              01. Concept & Hindi Lecture
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Watch today’s corresponding playlist episode (CampusX, Krish Naik, or Chai aur Code) and take hand-written notes.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>MINUTES 50 - 60</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">10 MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              Active Rest & Hydration
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Step away from the screen, hydrate, and let your neural connections consolidate the theory.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>MINUTES 60 - 110</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">50 MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              02. Hands-on Coding in Editor
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Open VS Code or Jupyter Notebook. Implement the daily code task, tensor operation, or PyTorch block.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>MINUTES 110 - 120</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">10 MINS</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              03. Quiz & Spaced Review
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Answer the daily retention question, verify with the model solution, and mark the day complete.
            </p>
          </div>
        </div>
      </div>

      {/* Quarter Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {quarters.map((q) => (
          <button
            key={q.value}
            onClick={() => setSelectedQuarter(q.value)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedQuarter === q.value
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Month-by-Month Master Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMonths.map((m) => {
          // Starting day for this month (e.g. Month 1 -> Day 1, Month 2 -> Day 31, Month 20 -> Day 571)
          const startDayNumber = (m.monthNumber - 1) * 30 + 1;

          return (
            <div
              key={m.monthNumber}
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
                onClick={() => onNavigateToDay(startDayNumber)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800/80 transition-colors cursor-pointer"
              >
                <span>Jump to Day {startDayNumber} in Daily Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
