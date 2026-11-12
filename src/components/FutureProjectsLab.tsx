import React, { useState } from 'react';
import { Sparkles, Layers, Cpu, ExternalLink, ArrowRight, ShieldCheck, Zap, GitBranch } from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { ProjectDetails, Language } from '../types';

interface FutureProjectsLabProps {
  onSelectProject: (proj: ProjectDetails) => void;
  language: Language;
}

export const FutureProjectsLab: React.FC<FutureProjectsLabProps> = ({
  onSelectProject,
  language
}) => {
  const visionaryProjects = ROADMAP_PHASES.map((p) => p.visionaryProject);
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const tags = ['All', 'Reasoning & Math', 'Robotics & Vision', 'Memory & CUDA', 'Agent Swarms', 'Security & Safety'];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-purple-800/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>FUTURE-PROOF PROJECTS LAB</span>
          <span aria-hidden="true">·</span>
          <span>PROJECTS NOBODY HAS BUILT YET</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          {language === 'hinglish'
            ? 'Future-Proof Visionary Projects (Pre-fixing the Future)'
            : 'Visionary AI Projects: Pre-fixing the Future'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {language === 'hinglish'
            ? '99% candidates apne resume par wahi purane projects daalte hain (Customer Chatbot, Spam Classifier, Movie Recommender) jo recruiters ko bore kar dete hain. Yahan humne 9 aisi novel architectures design ki hain jo agle 2-3 saal ke hardest AI problems ko solve karti hain.'
            : '99% of AI engineering resumes feature identical cookie-cutter projects (basic RAG chatbots, spam detectors, Titanic predictions) that recruiters ignore. These 9 visionary architectures tackle the hardest bottlenecks of 2025-2027: KV-cache memory limits, multi-agent git rollbacks, and latent activation safety.'}
        </p>

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-purple-200">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Solves Real Latency & Memory Bottlenecks</span>
          </div>
          <span aria-hidden="true" className="text-purple-600">·</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Guaranteed Recruiter Attention</span>
          </div>
          <span aria-hidden="true" className="text-purple-600">·</span>
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span>Complete Architecture Blueprint Provided</span>
          </div>
        </div>
      </div>

      {/* Grid of 9 Visionary Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visionaryProjects.map((proj, idx) => (
          <div
            key={proj.id}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5 hover:border-purple-300 dark:hover:border-purple-800 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  PROJECT 0{idx + 1}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Phase 0{idx} Frontier
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
        ))}
      </div>
    </div>
  );
};
