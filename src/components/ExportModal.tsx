import React, { useState } from 'react';
import { FileText, X, Download, Check, Copy, Printer, Sparkles, CheckCircle2 } from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { TWENTY_MONTH_MASTER_PLAN } from '../data/twentyMonthMasterPlanData';
import { SchedulePace, Language } from '../types';
import { generateRoadmapPdf } from '../utils/pdfGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
  language: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pace,
  completedConcepts,
  completedDays,
  language
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!isOpen) return null;

  const generateMarkdownPlan = () => {
    let md = `# AI ENGINEERING MASTERY STUDY PLAN & ROADMAP\n`;
    md += `*Plan: ${pace.toUpperCase()} (2 Hours / Day Deep Mastery Track)*\n`;
    md += `*Completed Concepts: ${completedConcepts.length} | Completed Days: ${completedDays.length}*\n\n`;
    md += `---\n\n`;

    md += `## 2-HOUR DAILY HABIT FORMULA (120 MINUTES EXACT TIME-BOX)\n`;
    md += `- **00:00 - 00:50 (50m):** Core Concept & Video Lecture (CampusX / Krish Naik / Chai aur Code in Hindi)\n`;
    md += `- **00:50 - 01:00 (10m):** Active Rest & Hydration Break\n`;
    md += `- **01:00 - 01:50 (50m):** Hands-on Coding Challenge in VS Code / Jupyter Notebook\n`;
    md += `- **01:50 - 02:00 (10m):** Daily Retention Quiz & Spaced Review Notes\n\n`;
    md += `---\n\n`;

    if (pace === '20-months') {
      md += `## 20-MONTH MASTER PLAN BREAKDOWN (600 DAYS / 1,200 HOURS)\n\n`;
      TWENTY_MONTH_MASTER_PLAN.forEach((m) => {
        md += `### ${m.monthLabel}: ${m.title} (${m.totalStudyHours} Hours total)\n`;
        md += `*${m.focusSummary}*\n`;
        md += `**Monthly Deliverables:**\n`;
        m.deliverables.forEach((d) => {
          md += `- ${d}\n`;
        });
        md += `\n`;
      });
      md += `---\n\n`;
    }

    ROADMAP_PHASES.forEach((phase) => {
      md += `## Phase ${phase.phaseNumber}: ${phase.title}\n`;
      md += `**Duration:** ~${phase.durationWeeks} Weeks | **Focus:** ${phase.subtitle}\n\n`;
      md += `> ${language === 'hinglish' ? phase.hinglishOverview : phase.overview}\n\n`;

      md += `### Core Concepts & Progress\n`;
      phase.concepts.forEach((concept) => {
        const isDone = completedConcepts.includes(concept.id);
        md += `- [${isDone ? 'x' : ' '}] **${concept.title}** (${concept.difficulty}, ~${concept.estHours}h)\n`;
        md += `  ${concept.description}\n`;
      });
      md += `\n`;

      md += `### Recommended Hindi YouTube Playlists\n`;
      phase.hindiResources.forEach((res) => {
        md += `- **${res.channelName} (${res.hostName})**: [${res.playlistTitle}](${res.playlistUrl})\n`;
        md += `  *Tip:* ${res.hinglishTip}\n`;
      });
      md += `\n`;

      md += `### Standard Industry Resume Project\n`;
      md += `**${phase.standardProject.title}**\n`;
      md += `${phase.standardProject.tagline}\n`;
      md += `**Tech Stack:** ${phase.standardProject.techStack.join(', ')}\n`;
      md += `**Resume Bullets:**\n`;
      phase.standardProject.resumeBullets.forEach((b) => {
        md += `  - ${b}\n`;
      });
      md += `\n`;

      md += `### Visionary Future Project (Pre-fixing the Future)\n`;
      md += `**${phase.visionaryProject.title}**\n`;
      md += `${phase.visionaryProject.tagline}\n`;
      md += `**Why Unique:** ${phase.visionaryProject.noveltyFactor}\n`;
      md += `**Tech Stack:** ${phase.visionaryProject.techStack.join(', ')}\n`;
      md += `**Resume Bullets:**\n`;
      phase.visionaryProject.resumeBullets.forEach((b) => {
        md += `  - ${b}\n`;
      });
      md += `\n---\n\n`;
    });

    return md;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      // Give UI a moment to display spinner
      await new Promise((resolve) => setTimeout(resolve, 120));
      generateRoadmapPdf({
        pace,
        completedConcepts,
        completedDays,
        language
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadFile = () => {
    const text = generateMarkdownPlan();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI_Engineering_Mastery_Plan_${pace}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdownPlan();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Export AI/ML Engineering Roadmap
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official curriculum, projects, and personal progress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Main PDF Featured Option */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-600 text-white uppercase tracking-wider">
                    Recommended
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Complete Vector PDF Document (.pdf)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  High-resolution, beautifully formatted printable multi-page A4 PDF. Includes all 9 sequential phases, concept checklists, curated Hindi YouTube video channels, standard resume and futuristic novel project blueprints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                <span className="block text-slate-400 text-[10px]">FORMAT</span>
                <span className="font-bold text-slate-900 dark:text-white">A4 Vector PDF</span>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                <span className="block text-slate-400 text-[10px]">PHASES</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">00 to 08</span>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                <span className="block text-slate-400 text-[10px]">TRACK</span>
                <span className="font-bold text-slate-900 dark:text-white">2h / Day</span>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center">
                <span className="block text-slate-400 text-[10px]">CHECKED</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedConcepts.length} Done</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating High-Resolution PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>PDF Downloaded Successfully!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Complete AI/ML Roadmap PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>

          {/* Current Progress Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Active Track:</span>
              <span className="font-semibold text-slate-900 dark:text-white uppercase">{pace}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Checked Concepts:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {completedConcepts.length} of {ROADMAP_PHASES.flatMap((p) => p.concepts).length} Concepts
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Completed Daily Sessions:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {completedDays.length} Days Logged
              </span>
            </div>
          </div>

          {/* Secondary Markdown & Copy Options */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Other Formats
            </span>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownloadFile}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Markdown (.md)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Raw Markdown'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
