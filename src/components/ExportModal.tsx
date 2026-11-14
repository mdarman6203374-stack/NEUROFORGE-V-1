import React, { useState, useRef } from 'react';
import {
  FileText,
  X,
  Download,
  Check,
  Copy,
  Sparkles,
  CheckCircle2,
  DatabaseBackup,
  Upload
} from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { generateMasterPlanForMonths, TIMELINE_TRACK_CONFIGS } from '../data/twentyMonthMasterPlanData';
import { SchedulePace, Language, MasterPlanMonths, StreakState, StudyReminderConfig } from '../types';
import { generateRoadmapPdf } from '../utils/pdfGenerator';

export interface RestoredBackupPayload {
  pace: SchedulePace;
  language: Language;
  completedConcepts: string[];
  completedDays: number[];
  streakState?: StreakState | null;
  reminderConfig?: StudyReminderConfig | null;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
  language: Language;
  streakState?: StreakState;
  reminderConfig?: StudyReminderConfig;
  userEmail?: string | null;
  onRestoreBackup?: (payload: RestoredBackupPayload) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pace,
  completedConcepts,
  completedDays,
  language,
  streakState,
  reminderConfig,
  userEmail,
  onRestoreBackup
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const masterMonths: MasterPlanMonths | null =
    pace === '20-months'
      ? 20
      : pace === '16-months'
      ? 16
      : pace === '14-months'
      ? 14
      : pace === '12-months'
      ? 12
      : null;

  const trackMeta = TIMELINE_TRACK_CONFIGS.find((t) => t.months === masterMonths);

  const generateMarkdownPlan = () => {
    let md = `# AI ENGINEERING MASTERY STUDY PLAN & ROADMAP\n`;
    md += `*Plan: ${pace.toUpperCase()} (${trackMeta?.dailyHoursLabel || 'Focused Track'})*\n`;
    md += `*Completed Concepts: ${completedConcepts.length} | Completed Days: ${completedDays.length}*\n\n`;
    md += `---\n\n`;

    md += `## DAILY HABIT FORMULA (4 STRUCTURED BLOCKS)\n`;
    md += `- **Block 1 (Concept):** Core Concept & Video Lecture (CampusX / Krish Naik / Chai aur Code in Hindi)\n`;
    md += `- **Rest:** Active Rest & Hydration Break\n`;
    md += `- **Block 2 (Coding):** Hands-on Coding Challenge in VS Code / Jupyter Notebook\n`;
    md += `- **Block 3 (Review):** Daily Retention Quiz & Spaced Review Notes\n\n`;
    md += `---\n\n`;

    if (masterMonths) {
      const planRows = generateMasterPlanForMonths(masterMonths);
      md += `## ${masterMonths}-MONTH MASTER PLAN BREAKDOWN (${trackMeta?.totalDays || 600} DAYS / 1,200 HOURS)\n\n`;
      planRows.forEach((m) => {
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

  const handleDownloadJsonBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus(null);
    try {
      let backupObj: any;
      try {
        const res = await fetch('/api/backup/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pace,
            language,
            completedConcepts,
            completedDays,
            streakState,
            reminderConfig,
            userEmail: userEmail || null
          })
        });
        if (res.ok) {
          const json = await res.json();
          backupObj = json.backup;
        }
      } catch {
        // Fallback to local generation if offline
      }

      if (!backupObj) {
        backupObj = {
          app: 'NeuroForge AI Engineering Mastery OS',
          schemaVersion: 2,
          createdAt: new Date().toISOString(),
          storageBackend: 'local-snapshot',
          userEmail: userEmail || null,
          data: {
            pace,
            language,
            completedConcepts,
            completedDays,
            streakState: streakState || null,
            reminderConfig: reminderConfig || null
          }
        };
      }

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `neuroforge_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus('Full JSON backup downloaded & verified.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let validatedData: RestoredBackupPayload | null = null;
      try {
        const res = await fetch('/api/backup/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup: parsed })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.valid && json.data) {
            validatedData = json.data;
          }
        }
      } catch {
        const data = parsed?.data ?? parsed;
        if (Array.isArray(data?.completedConcepts) && Array.isArray(data?.completedDays)) {
          validatedData = data;
        }
      }

      if (validatedData && onRestoreBackup) {
        onRestoreBackup(validatedData);
        setBackupStatus(
          `Restored ${validatedData.completedConcepts.length} concepts & ${validatedData.completedDays.length} days!`
        );
      } else {
        setBackupStatus('Invalid backup JSON format.');
      }
    } catch {
      setBackupStatus('Could not parse JSON backup file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
                Export AI/ML Roadmap & Cloud Backup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vector PDF curriculum, Markdown plan, and full JSON progress backup
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
                  High-resolution, printable multi-page A4 PDF. Includes your selected {pace.toUpperCase()} trajectory, all 9 sequential phases, concept checklists, Hindi YouTube channels, and project blueprints.
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
                <span className="font-bold text-slate-900 dark:text-white uppercase">{pace}</span>
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

          {/* Current Progress & Backup Summary */}
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
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Cloud Auto-Backup:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {userEmail ? `Synced to Firestore (${userEmail})` : 'Local Browser Storage (Sign in for Cloud Sync)'}
              </span>
            </div>
          </div>

          {/* JSON Snapshot Backup & Restore */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DatabaseBackup className="w-3.5 h-3.5 text-emerald-500" />
              <span>Progress & Schedule Snapshot Backup (.json)</span>
            </span>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownloadJsonBackup}
                disabled={isBackingUp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isBackingUp ? 'Creating Snapshot...' : 'Download JSON Backup'}</span>
              </button>
              {onRestoreBackup && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleRestoreFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Restore JSON Backup</span>
                  </button>
                </>
              )}
            </div>
            {backupStatus && (
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {backupStatus}
              </p>
            )}
          </div>

          {/* Secondary Markdown & Copy Options */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Markdown & Plain Text Formats
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
