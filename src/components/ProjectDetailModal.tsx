import React, { useState } from 'react';
import { X, Check, Copy, Sparkles, Layers, FileText, ArrowRight, GitBranch } from 'lucide-react';
import { ProjectDetails, Language } from '../types';

interface ProjectDetailModalProps {
  project: ProjectDetails | null;
  onClose: () => void;
  language: Language;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  language
}) => {
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState(false);

  if (!project) return null;

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(project.githubReadmeSnippet);
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  const handleCopyBullets = () => {
    const text = project.resumeBullets.map((b) => `• ${b}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBullets(true);
    setTimeout(() => setCopiedBullets(false), 2000);
  };

  const isVisionary = project.category === 'Visionary Future';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              <span className={isVisionary ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-indigo-600 dark:text-indigo-400 font-bold'}>
                {isVisionary ? 'Future-Proof Visionary Project' : 'Industry Standard Resume Project'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Portfolio Ready</span>
              <span aria-hidden="true">·</span>
              <span>{project.keyMetrics}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {project.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {project.tagline}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Problem & Novelty */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {language === 'hinglish' ? 'Problem Statement aur Novelty Factor' : 'Problem Statement & Novelty'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {project.problemStatement}
            </p>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/70 dark:border-slate-700/60 text-xs">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-1.5">
                {language === 'hinglish' ? 'Kyu Yeh Project Unique Hai:' : 'Why This Project Is Unique:'}
              </span>
              <span className="text-slate-700 dark:text-slate-300">{project.noveltyFactor}</span>
            </div>
          </div>

          {/* Solution Architecture Flow */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              {language === 'hinglish' ? 'System Architecture & Engineering Pipeline' : 'System Architecture & Pipeline'}
            </h3>
            <div className="space-y-2">
              {project.solutionArchitecture.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                    0{idx + 1}.
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Resume Bullets with 1-click copy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                {language === 'hinglish' ? 'Resume Bullet Points (STAR Method)' : 'Resume Bullet Points (Ready to Copy)'}
              </h3>
              <button
                onClick={handleCopyBullets}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {copiedBullets ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Bullets</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              {project.resumeBullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <p className="leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub README snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                GitHub README Template
              </h3>
              <button
                onClick={handleCopyReadme}
                className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {copiedReadme ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedReadme ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-200 text-xs rounded-lg overflow-x-auto font-mono border border-slate-800">
              <code>{project.githubReadmeSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
