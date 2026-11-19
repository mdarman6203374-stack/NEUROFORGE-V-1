import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import { Radar as RadarIcon, TrendingUp, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { Language } from '../types';

interface DomainProficiencyRadarProps {
  completedConcepts: string[];
  selectedRoleId: string;
  selectedRoleTitle: string;
  language: Language;
}

interface DomainConfig {
  phaseNumber: number;
  shortLabel: string;
  fullLabel: string;
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  { phaseNumber: 0, shortLabel: 'Math & CS', fullLabel: 'Mathematical & CS Foundations' },
  { phaseNumber: 1, shortLabel: 'PyTorch & Data', fullLabel: 'Python, PyTorch & Vector Stack' },
  { phaseNumber: 2, shortLabel: 'Classical ML', fullLabel: 'ML Mastery & Production Modeling' },
  { phaseNumber: 3, shortLabel: 'DL & Vision', fullLabel: 'Deep Learning, CV & Transformers' },
  { phaseNumber: 4, shortLabel: 'LLMs & Tuning', fullLabel: 'LLMs, LoRA Fine-Tuning & Quantization' },
  { phaseNumber: 5, shortLabel: 'RAG & Graphs', fullLabel: 'Advanced RAG & Knowledge Graphs' },
  { phaseNumber: 6, shortLabel: 'AI Agents', fullLabel: 'Autonomous Agents & Swarms' },
  { phaseNumber: 7, shortLabel: 'MLOps & Safety', fullLabel: 'Production LLMOps & AI Safety' },
  { phaseNumber: 8, shortLabel: 'Frontiers 2028', fullLabel: 'Reasoning Models, SLMs & Multimodal' }
];

// Target proficiency profile (0-100) expected for each role track across the 9 domains
const ROLE_BENCHMARKS: Record<string, Record<number, number>> = {
  'ai-llm-engineer': {
    0: 65,
    1: 85,
    2: 65,
    3: 70,
    4: 90,
    5: 95,
    6: 80,
    7: 85,
    8: 60
  },
  'ai-agent-architect': {
    0: 65,
    1: 85,
    2: 60,
    3: 65,
    4: 80,
    5: 90,
    6: 100,
    7: 85,
    8: 75
  },
  'mlops-platform-engineer': {
    0: 60,
    1: 95,
    2: 80,
    3: 65,
    4: 85,
    5: 75,
    6: 65,
    7: 100,
    8: 60
  },
  'applied-ai-research-engineer': {
    0: 95,
    1: 95,
    2: 85,
    3: 95,
    4: 100,
    5: 70,
    6: 60,
    7: 70,
    8: 90
  },
  'computer-vision-multimodal': {
    0: 85,
    1: 95,
    2: 75,
    3: 100,
    4: 75,
    5: 60,
    6: 55,
    7: 75,
    8: 90
  },
  'ai-safety-guardrails': {
    0: 70,
    1: 75,
    2: 80,
    3: 70,
    4: 85,
    5: 85,
    6: 80,
    7: 100,
    8: 85
  }
};

interface ChartDatum {
  phaseNumber: number;
  domain: string;
  fullLabel: string;
  proficiency: number;
  target: number;
  completedCount: number;
  totalCount: number;
  completedTitles: string[];
  missingTitles: string[];
}

export const DomainProficiencyRadar: React.FC<DomainProficiencyRadarProps> = ({
  completedConcepts,
  selectedRoleId,
  selectedRoleTitle,
  language
}) => {
  const [showRoleBenchmark, setShowRoleBenchmark] = useState<boolean>(true);
  const [selectedDomainPhase, setSelectedDomainPhase] = useState<number | null>(null);

  const completedSet = useMemo(() => new Set(completedConcepts), [completedConcepts]);

  const chartData: ChartDatum[] = useMemo(() => {
    const roleMap = ROLE_BENCHMARKS[selectedRoleId] || ROLE_BENCHMARKS['ai-llm-engineer'];

    return DOMAIN_CONFIGS.map((cfg) => {
      const phase = ROADMAP_PHASES.find((p) => p.phaseNumber === cfg.phaseNumber);
      const concepts = phase?.concepts || [];
      const totalCount = concepts.length || 1;
      const doneConcepts = concepts.filter((c) => completedSet.has(c.id));
      const missingConcepts = concepts.filter((c) => !completedSet.has(c.id));
      const proficiency = Math.round((doneConcepts.length / totalCount) * 100);

      return {
        phaseNumber: cfg.phaseNumber,
        domain: cfg.shortLabel,
        fullLabel: cfg.fullLabel,
        proficiency,
        target: roleMap[cfg.phaseNumber] ?? 75,
        completedCount: doneConcepts.length,
        totalCount: concepts.length,
        completedTitles: doneConcepts.map((c) => c.title),
        missingTitles: missingConcepts.map((c) => c.title)
      };
    });
  }, [completedSet, selectedRoleId]);

  const summary = useMemo(() => {
    const totalConcepts = chartData.reduce((acc, d) => acc + d.totalCount, 0);
    const totalCompleted = chartData.reduce((acc, d) => acc + d.completedCount, 0);
    const overallPct = totalConcepts > 0 ? Math.round((totalCompleted / totalConcepts) * 100) : 0;

    const sortedByProficiency = [...chartData].sort((a, b) => b.proficiency - a.proficiency);
    const strongest = sortedByProficiency[0];

    // Highest gap relative to the selected role's benchmark
    const sortedByRoleGap = [...chartData].sort(
      (a, b) => b.target - b.proficiency - (a.target - a.proficiency)
    );
    const biggestGap = sortedByRoleGap[0];

    return {
      totalConcepts,
      totalCompleted,
      overallPct,
      strongest,
      biggestGap
    };
  }, [chartData]);

  const activeDetail =
    chartData.find((d) => d.phaseNumber === selectedDomainPhase) || summary.biggestGap;

  return (
    <section
      aria-label="AI Engineering Domain Proficiency Radar Chart"
      className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <RadarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hinglish'
                  ? 'AI Domain Proficiency Radar Chart'
                  : 'AI Engineering Domain Proficiency Radar'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hinglish'
                  ? `Aapke ${summary.totalCompleted}/${summary.totalConcepts} completed concepts ke hisaab se har AI domain mein live skill map`
                  : `Live proficiency polygon computed from your ${summary.totalCompleted}/${summary.totalConcepts} mastered curriculum concepts`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRoleBenchmark((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              showRoleBenchmark
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Compare your live proficiency against the selected job role benchmark"
          >
            {showRoleBenchmark ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Role Target Overlay</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
            {summary.overallPct}% Overall
          </div>
        </div>
      </div>

      {/* Main Content Grid: Radar Chart (Left) + Insights & Domain Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Recharts Radar Container */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full h-[320px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="74%" data={chartData}>
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.28} />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tickCount={5}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                />

                {showRoleBenchmark && (
                  <Radar
                    name={`Target: ${selectedRoleTitle}`}
                    dataKey="target"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="#10b981"
                    fillOpacity={0.08}
                  />
                )}

                <Radar
                  name="Your Proficiency"
                  dataKey="proficiency"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="#6366f1"
                  fillOpacity={0.34}
                  dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const datum = payload[0]?.payload as ChartDatum | undefined;
                    if (!datum) return null;

                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs space-y-1.5 max-w-xs">
                        <div className="font-bold text-slate-100">
                          Phase 0{datum.phaseNumber}: {datum.fullLabel}
                        </div>
                        <div className="flex items-center justify-between gap-4 font-mono">
                          <span className="text-indigo-300">Your Proficiency:</span>
                          <span className="font-bold tabular-nums">
                            {datum.proficiency}% ({datum.completedCount}/{datum.totalCount})
                          </span>
                        </div>
                        {showRoleBenchmark && (
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-emerald-300">Role Benchmark:</span>
                            <span className="font-bold tabular-nums">{datum.target}%</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-500/70 border border-indigo-500 inline-block" />
              <span className="font-semibold">Your Completed Concepts</span>
            </div>
            {showRoleBenchmark && (
              <div className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-emerald-500 inline-block" />
                <span>
                  Target Benchmark:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">{selectedRoleTitle}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Metrics + Clickable Domain Bars + Concept Checklist */}
        <div className="lg:col-span-5 space-y-4">
          {/* Two Highlight Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Strongest Domain</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {summary.strongest.domain}
              </div>
              <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                {summary.strongest.proficiency}% ({summary.strongest.completedCount}/
                {summary.strongest.totalCount} concepts)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Top Gap for Role</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {summary.biggestGap.domain}
              </div>
              <div className="text-xs font-mono text-amber-700 dark:text-amber-300 tabular-nums">
                {summary.biggestGap.proficiency}% vs {summary.biggestGap.target}% target
              </div>
            </div>
          </div>

          {/* Clickable Domain Proficiency Rows */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Inspect Domain Breakdown</span>
              <span className="font-mono">Click row</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {chartData.map((item) => {
                const isInspected = activeDetail?.phaseNumber === item.phaseNumber;
                return (
                  <button
                    key={item.phaseNumber}
                    type="button"
                    onClick={() => setSelectedDomainPhase(item.phaseNumber)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                      isInspected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        P{item.phaseNumber} · {item.domain}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
                        {item.proficiency}% ({item.completedCount}/{item.totalCount})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.proficiency}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Domain Concept Drill-Down */}
          {activeDetail && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Phase 0{activeDetail.phaseNumber}: {activeDetail.fullLabel}
              </div>

              {activeDetail.completedTitles.length > 0 && (
                <ul className="space-y-1">
                  {activeDetail.completedTitles.map((title) => (
                    <li
                      key={title}
                      className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{title}</span>
                    </li>
                  ))}
                </ul>
              )}

              {activeDetail.missingTitles.length > 0 && (
                <ul className="space-y-1">
                  {activeDetail.missingTitles.map((title) => (
                    <li
                      key={title}
                      className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"
                    >
                      <span className="w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center font-mono text-[10px]">
                        ○
                      </span>
                      <span>Next to unlock: {title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
