import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { TWENTY_MONTH_MASTER_PLAN } from '../data/twentyMonthMasterPlanData';
import { Language } from '../types';
import { BarChart3, TrendingUp, PieChart as PieIcon, CheckCircle2, Award, Zap, Layers } from 'lucide-react';

interface LearningProgressDashboardProps {
  completedConcepts: string[];
  completedDays: number[];
  language: Language;
}

export const LearningProgressDashboard: React.FC<LearningProgressDashboardProps> = ({
  completedConcepts,
  completedDays,
  language
}) => {
  const [activeMetricView, setActiveMetricView] = useState<'category' | 'trajectory' | 'difficulty'>('category');

  // Compute category/phase mastery metrics
  const categoryData = useMemo(() => {
    return ROADMAP_PHASES.map((phase) => {
      const totalInPhase = phase.concepts.length;
      const doneInPhase = phase.concepts.filter((c) => completedConcepts.includes(c.id)).length;
      const percent = totalInPhase > 0 ? Math.round((doneInPhase / totalInPhase) * 100) : 0;

      // Clean short label
      const shortTitle = `P${phase.phaseNumber}: ${phase.title.split('&')[0].trim()}`;

      return {
        phaseNumber: phase.phaseNumber,
        name: shortTitle,
        fullTitle: phase.title,
        completed: doneInPhase,
        total: totalInPhase,
        percent,
        remaining: totalInPhase - doneInPhase
      };
    });
  }, [completedConcepts]);

  // Compute 20-Month Mastery Progression Curve
  const trajectoryData = useMemo(() => {
    // Estimated user completed hours from concepts and days
    const totalCompletedConceptsCount = completedConcepts.length;
    const estConceptHours = ROADMAP_PHASES.flatMap((p) => p.concepts)
      .filter((c) => completedConcepts.includes(c.id))
      .reduce((sum, c) => sum + c.estHours, 0);

    const estDailyHours = completedDays.length * 2; // 2h daily habit
    const currentActualHours = Math.max(estConceptHours, estDailyHours);

    // Month by month milestones across the 20 months
    return TWENTY_MONTH_MASTER_PLAN.map((m, idx) => {
      const targetCumulativeHours = (idx + 1) * 60; // 60h per month
      // Actual hours curve: distributes currentActualHours across reached months
      const activeMonth = Math.min(20, Math.max(1, Math.ceil(currentActualHours / 60)));
      let userHoursSoFar = 0;
      if (idx + 1 <= activeMonth) {
        userHoursSoFar = Math.min(currentActualHours, (idx + 1) * 60);
      }

      return {
        month: `M${m.monthNumber}`,
        monthTitle: m.title,
        targetHours: targetCumulativeHours,
        actualHours: idx + 1 <= activeMonth ? userHoursSoFar : null,
        targetDeliverable: m.deliverables[0] || 'Milestone check'
      };
    });
  }, [completedConcepts, completedDays]);

  // Difficulty distribution
  const difficultyData = useMemo(() => {
    const allConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts);
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'] as const;

    const colors = {
      Beginner: '#10B981', // emerald
      Intermediate: '#6366F1', // indigo
      Advanced: '#F59E0B' // amber
    };

    return difficulties.map((diff) => {
      const total = allConcepts.filter((c) => c.difficulty === diff).length;
      const completed = allConcepts.filter((c) => c.difficulty === diff && completedConcepts.includes(c.id)).length;
      return {
        name: diff,
        completed,
        total,
        value: total,
        color: colors[diff]
      };
    });
  }, [completedConcepts]);

  const totalConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts).length;
  const overallPercent = Math.min(100, Math.round((completedConcepts.length / (totalConcepts || 1)) * 100));

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-4 h-4" />
            <span>AI MASTERY ANALYTICS ENGINE</span>
            <span aria-hidden="true">·</span>
            <span>RECHARTS VISUALIZATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {language === 'hinglish' ? 'Learning Progress Dashboard' : 'Mastery Progress Dashboard'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'hinglish'
              ? 'Phase-wise completed concepts aur 20-month cumulative trajectory ka live interactive breakdown'
              : 'Interactive visualization of completed concepts per phase and 20-month mastery progression trajectory'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMetricView('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeMetricView === 'category'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Phases (%)</span>
          </button>

          <button
            onClick={() => setActiveMetricView('trajectory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeMetricView === 'trajectory'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>20-Month Curve</span>
          </button>

          <button
            onClick={() => setActiveMetricView('difficulty')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeMetricView === 'difficulty'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Difficulty</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            Overall Roadmap Mastery
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {overallPercent}%
            </span>
            <span className="text-xs text-slate-500">
              ({completedConcepts.length}/{totalConcepts})
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            Estimated Deep Study
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {completedDays.length * 2}h
            </span>
            <span className="text-xs text-slate-500">/ 1,200h Total</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            Active Master Plan Month
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-amber-500">
              M{Math.min(20, Math.max(1, Math.ceil((completedDays.length * 2) / 60)))}
            </span>
            <span className="text-xs text-slate-500">of 20 Months</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            Mastered Phases
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black font-mono text-indigo-500">
              {categoryData.filter((c) => c.percent === 100).length}
            </span>
            <span className="text-xs text-slate-500">/ 9 Complete</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-80 w-full pt-2">
        {activeMetricView === 'category' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-amber-400">{data.fullTitle}</div>
                        <div>
                          Mastery: <span className="font-mono font-bold text-emerald-400">{data.percent}%</span>
                        </div>
                        <div className="text-slate-300">
                          Completed: {data.completed} of {data.total} concepts
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="percent"
                name="% Concepts Completed"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeMetricView === 'trajectory' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: -5, bottom: 10 }}>
              <defs>
                <linearGradient id="targetHoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualHoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="h" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-amber-400">{label}: {d.monthTitle}</div>
                        <div className="text-indigo-300">Target Curriculum: {d.targetHours} Hours</div>
                        {d.actualHours !== null && (
                          <div className="text-emerald-400 font-bold">Your Progress: {d.actualHours} Hours</div>
                        )}
                        <div className="text-[11px] text-slate-400 italic">Key: {d.targetDeliverable}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="targetHours"
                name="20-Month Plan Target Curve (1,200h)"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#targetHoursGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="actualHours"
                name="Your Logged Study Hours"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#actualHoursGrad)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeMetricView === 'difficulty' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 h-full items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="total"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800 text-xs">
                          <span className="font-bold" style={{ color: d.color }}>{d.name} Level</span>: {d.completed}/{d.total} completed
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Breakdown List */}
            <div className="space-y-3 px-4">
              {difficultyData.map((d) => {
                const pct = Math.round((d.completed / d.total) * 100);
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {d.completed} of {d.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
