import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  GitBranch,
  CheckCircle2,
  GitCommit,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square
} from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { ProjectDetails, Language } from '../types';
import {
  DEFAULT_README_CHECKLIST,
  ProjectArtifactRecord,
  ProjectReadmeChecklist,
  getArtifactCompletionScore,
  loadProjectArtifacts,
  saveProjectArtifacts
} from '../utils/projectArtifacts';

interface FutureProjectsLabProps {
  onSelectProject: (proj: ProjectDetails) => void;
  language: Language;
}

const CHECKLIST_LABELS: Array<{ key: keyof ProjectReadmeChecklist; label: string }> = [
  { key: 'problemAndArchitecture', label: 'Problem & Architecture Diagram' },
  { key: 'reproducibleSetup', label: 'Reproducible Setup (.env + reqs)' },
  { key: 'benchmarksAndEvals', label: 'Latency / Eval Benchmarks Table' },
  { key: 'demoGifOrScreenshots', label: 'Demo GIF / Live Preview Link' }
];

export const FutureProjectsLab: React.FC<FutureProjectsLabProps> = ({
  onSelectProject,
  language
}) => {
  const visionaryProjects = ROADMAP_PHASES.map((p) => p.visionaryProject);
  const [artifacts, setArtifacts] = useState<Record<string, ProjectArtifactRecord>>(() =>
    loadProjectArtifacts()
  );
  const [expandedTrackerId, setExpandedTrackerId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'shipped' | 'in-progress'>('all');

  const getRecord = (projectId: string): ProjectArtifactRecord =>
    artifacts[projectId] || {
      projectId,
      githubUrl: '',
      demoUrl: '',
      latestCommitHash: '',
      status: 'planned',
      checklist: { ...DEFAULT_README_CHECKLIST },
      updatedAt: ''
    };

  const updateRecord = (
    projectId: string,
    updater: (prev: ProjectArtifactRecord) => ProjectArtifactRecord
  ) => {
    setArtifacts((prevMap) => {
      const current = prevMap[projectId] || getRecord(projectId);
      const updated = {
        ...updater(current),
        updatedAt: new Date().toISOString()
      };
      const nextMap = { ...prevMap, [projectId]: updated };
      saveProjectArtifacts(nextMap);
      return nextMap;
    });
  };

  const shippedCount = Object.values(artifacts).filter((a) => a.status === 'shipped').length;
  const inProgressCount = Object.values(artifacts).filter((a) => a.status === 'in-progress').length;

  const filteredProjects = visionaryProjects.filter((proj) => {
    const rec = getRecord(proj.id);
    if (filterStatus === 'all') return true;
    return rec.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-purple-800/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>FUTURE-PROOF PROJECTS LAB</span>
            <span aria-hidden="true">·</span>
            <span>SHIP REAL PROOF OF WORK</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
              {shippedCount} Shipped
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold">
              {inProgressCount} Building
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {language === 'hinglish'
            ? 'Future-Proof Visionary Projects + GitHub Deployment Tracker'
            : 'Visionary AI Projects: Build, Track Commits & Deploy'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {language === 'hinglish'
            ? 'Har phase ke end par ek real shipped GitHub repo aur live demo link attach karein. Tracked repos automatically aapke Live AI Portfolio & Resume Dossier mein sync hote hain.'
            : '99% of AI engineering resumes feature cookie-cutter chatbots. Build these 9 novel architectures, attach your GitHub repo URL, commit SHA, live demo, and README checklist — synced straight to your AI Skill Dossier.'}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap gap-4 text-xs text-purple-200">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Solves Real Latency & Memory Bottlenecks</span>
            </div>
            <span aria-hidden="true" className="text-purple-600">·</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>README Readiness Verified</span>
            </div>
            <span aria-hidden="true" className="text-purple-600">·</span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>Synced to Live Resume Dossier</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/70 border border-purple-700/40 text-xs">
            {(
              [
                { id: 'all', label: `All (${visionaryProjects.length})` },
                { id: 'in-progress', label: `In Progress (${inProgressCount})` },
                { id: 'shipped', label: `Shipped (${shippedCount})` }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterStatus(opt.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filterStatus === opt.id
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Visionary Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj, idx) => {
          const rec = getRecord(proj.id);
          const { done, total } = getArtifactCompletionScore(rec);
          const isTrackerOpen = expandedTrackerId === proj.id;

          return (
            <div
              key={proj.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    PROJECT 0{idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                      rec.status === 'shipped'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : rec.status === 'in-progress'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {rec.status === 'shipped'
                      ? 'Shipped'
                      : rec.status === 'in-progress'
                      ? 'In Progress'
                      : 'Planned'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {proj.title}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {proj.tagline}
                </p>

                {/* Novelty Factor Card */}
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 text-xs space-y-1">
                  <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Why Nobody Built It Yet:</span>
                  </div>
                  <p className="text-purple-950/80 dark:text-purple-200/90 leading-relaxed text-[11px]">
                    {proj.noveltyFactor}
                  </p>
                </div>

                {/* Tech Stack Pills */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Core Technologies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* GitHub & Deployment Tracker Collapsible */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedTrackerId(isTrackerOpen ? null : proj.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
                      <span>GitHub & README ({done}/{total})</span>
                    </span>
                    {isTrackerOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isTrackerOpen && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        {(['planned', 'in-progress', 'shipped'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              updateRecord(proj.id, (prev) => ({ ...prev, status: st }))
                            }
                            className={`flex-1 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                              rec.status === st
                                ? st === 'shipped'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'in-progress'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-700 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {st.replace('-', ' ')}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <input
                          type="url"
                          value={rec.githubUrl}
                          onChange={(e) =>
                            updateRecord(proj.id, (prev) => ({
                              ...prev,
                              githubUrl: e.target.value
                            }))
                          }
                          placeholder="https://github.com/username/project-repo"
                          className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="url"
                            value={rec.demoUrl}
                            onChange={(e) =>
                              updateRecord(proj.id, (prev) => ({
                                ...prev,
                                demoUrl: e.target.value
                              }))
                            }
                            placeholder="Live Demo URL"
                            className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <input
                            type="text"
                            value={rec.latestCommitHash}
                            onChange={(e) =>
                              updateRecord(proj.id, (prev) => ({
                                ...prev,
                                latestCommitHash: e.target.value.slice(0, 12)
                              }))
                            }
                            placeholder="Commit SHA (e.g. a1b2c3d)"
                            className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* 4-Item README Readiness Checklist */}
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                          README Ship Checklist
                        </div>
                        {CHECKLIST_LABELS.map((item) => {
                          const checked = rec.checklist[item.key];
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() =>
                                updateRecord(proj.id, (prev) => ({
                                  ...prev,
                                  checklist: {
                                    ...prev.checklist,
                                    [item.key]: !prev.checklist[item.key]
                                  }
                                }))
                              }
                              className="w-full flex items-center gap-2 py-1 text-left text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                            >
                              {checked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className={checked ? 'line-through text-slate-400' : ''}>
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {(rec.githubUrl || rec.demoUrl) && (
                        <div className="flex items-center gap-2 pt-1">
                          {rec.githubUrl && (
                            <a
                              href={rec.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <GitBranch className="w-3 h-3" />
                              <span>Open Repo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {rec.demoUrl && (
                            <a
                              href={rec.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Live Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* View Blueprint Button */}
              <button
                onClick={() => onSelectProject(proj)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 active:bg-purple-700 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>Inspect Architecture & Resume STAR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
