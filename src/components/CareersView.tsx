import React, { useState } from 'react';
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Circle,
  HelpCircle,
  Building,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CAREER_ROLES_DATA } from '../data/careerData';
import { Language } from '../types';

interface CareersViewProps {
  language: Language;
}

export const CareersView: React.FC<CareersViewProps> = ({ language }) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('ai-llm-engineer');
  const [userSkills, setUserSkills] = useState<string[]>([
    'Python 3.12',
    'FastAPI / Async streaming',
    'LangChain / LlamaIndex'
  ]);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(0);

  // List of all unique skills across all roles for interactive matcher
  const allAvailableSkills = Array.from(
    new Set(CAREER_ROLES_DATA.flatMap((r) => r.requiredSkills))
  );

  const toggleUserSkill = (skill: string) => {
    if (userSkills.includes(skill)) {
      setUserSkills(userSkills.filter((s) => s !== skill));
    } else {
      setUserSkills([...userSkills, skill]);
    }
  };

  const selectedRole =
    CAREER_ROLES_DATA.find((r) => r.id === selectedRoleId) || CAREER_ROLES_DATA[0];

  // Calculate skill match percentage for each role
  const calculateMatch = (roleSkills: string[]) => {
    const matched = roleSkills.filter((s) => userSkills.includes(s)).length;
    return Math.round((matched / (roleSkills.length || 1)) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <span>CAREER & JOB FIELDS NAVIGATOR</span>
          <span aria-hidden="true">·</span>
          <span>HIGH-DEMAND AI ROLES 2025 - 2027</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {language === 'hinglish'
            ? 'AI Engineering mein Kin Fields mein Jobs Milengi?'
            : 'Target Job Roles, Salaries & Career Tracks'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {language === 'hinglish'
            ? 'Sirf "AI seekhna" kafi nahi hai. Industry mein alag-alag specialized roles hote hain: AI Application Engineer, Agent Architect, MLOps Specialist, aur AI Safety Engineer. Yahan jaaniye har role ki salary, required skills, aur real interview questions.'
            : 'Explore high-paying career trajectories in AI engineering. Compare salary benchmarks (Global USD & Indian INR), top hiring industries, essential tech stacks, and practice technical interview questions with deep explanations.'}
        </p>

        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Average Compensation: $135k - $220k+ / ₹20L - ₹50L+</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Fastest Growing: AI Agent Architects & LLM Ops</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Interactive Skill Matcher Below</span>
          </div>
        </div>
      </div>

      {/* Interactive Skill Matcher Tool */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Interactive Skill Matcher: Check What You Know</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click your skills below to see your live role readiness match percentage across all 6 career tracks.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {userSkills.length} Skills Selected
          </div>
        </div>

        {/* Skill Pills Matrix */}
        <div className="flex flex-wrap gap-2">
          {allAvailableSkills.map((skill) => {
            const isSelected = userSkills.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleUserSkill(skill)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{skill}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roles Navigator Layout: Left Selector, Right Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Role Selector with Match % */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Specialized Job Titles
          </div>

          <div className="space-y-2">
            {CAREER_ROLES_DATA.map((role) => {
              const isSelected = role.id === selectedRole.id;
              const match = calculateMatch(role.requiredSkills);

              return (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRoleId(role.id);
                    setExpandedQuestionIdx(0);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {role.title}
                    </h3>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        match >= 75
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : match >= 40
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {match}% Fit
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {role.averageSalaryINR}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Role Deep-Dive */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Role Header */}
            <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Demand: {selectedRole.demandLevel}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedRole.averageSalaryUSD}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {selectedRole.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedRole.hinglishTitle}
              </p>
            </div>

            {/* Salary Benchmarks */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Global US Remote / Onsite:</div>
                <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedRole.averageSalaryUSD}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">India Tech Market Benchmark:</div>
                <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {selectedRole.averageSalaryINR}
                </div>
              </div>
            </div>

            {/* Core Responsibilities */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                What You Will Actually Do on the Job
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {selectedRole.coreResponsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">✓</span>
                    <span className="leading-relaxed">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Skills Matrix */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Required Technical Toolkit
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedRole.requiredSkills.map((skill) => {
                  const hasSkill = userSkills.includes(skill);
                  return (
                    <span
                      key={skill}
                      className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 ${
                        hasSkill
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {hasSkill && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      <span>{skill}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Top Hiring Sectors */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Top Hiring Sectors
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedRole.topHiringSectors.map((sector) => (
                  <span
                    key={sector}
                    className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* Real Interview Questions & Answers */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <span>Actual Technical Interview Questions for This Role</span>
              </h3>

              <div className="space-y-2.5">
                {selectedRole.interviewQuestions.map((q, idx) => {
                  const isExpanded = expandedQuestionIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <button
                        onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                        className="w-full text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <span className="leading-snug">{q.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                          <div className="space-y-1 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Model Technical Answer:
                            </span>
                            <p className="leading-relaxed">{q.answer}</p>
                          </div>

                          {language === 'hinglish' && (
                            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900/50 text-purple-950 dark:text-purple-200 space-y-1">
                              <span className="font-bold">Hinglish Explanation:</span>
                              <p className="leading-relaxed">{q.hinglishExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
