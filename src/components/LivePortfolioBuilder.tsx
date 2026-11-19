import React, { useMemo, useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  GitBranch,
  Award,
  Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { Language, SchedulePace, StreakState } from '../types';
import { collectSavedScratchpadNotes } from '../utils/pdfGenerator';
import { loadProjectArtifacts, getArtifactCompletionScore } from '../utils/projectArtifacts';

interface LivePortfolioBuilderProps {
  completedConcepts: string[];
  completedDays: number[];
  pace: SchedulePace;
  streakState: StreakState;
  language: Language;
  userEmail?: string | null;
}

export const LivePortfolioBuilder: React.FC<LivePortfolioBuilderProps> = ({
  completedConcepts,
  completedDays,
  pace,
  streakState,
  language,
  userEmail
}) => {
  const [candidateName, setCandidateName] = useState<string>(
    userEmail ? userEmail.split('@')[0] : 'AI Engineer Candidate'
  );
  const [targetHeadline, setTargetHeadline] = useState<string>(
    'Applied AI & LLM Systems Engineer'
  );
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

  const artifacts = loadProjectArtifacts();
  const scratchpadNotes = collectSavedScratchpadNotes();

  const { verifiedHours, masteredConcepts, shippedProjects, atsBullets } = useMemo(() => {
    const allConcepts = ROADMAP_PHASES.flatMap((p) =>
      p.concepts.map((c) => ({ ...c, phaseNumber: p.phaseNumber, phaseTitle: p.title }))
    );
    const mastered = allConcepts.filter((c) => completedConcepts.includes(c.id));
    const hrs = mastered.reduce((sum, c) => sum + (c.estHours || 10), 0);

    const allProjects = ROADMAP_PHASES.flatMap((p) => [
      { ...p.standardProject, phaseNumber: p.phaseNumber },
      { ...p.visionaryProject, phaseNumber: p.phaseNumber }
    ]);

    const tracked = allProjects
      .map((proj) => ({
        proj,
        artifact: artifacts[proj.id]
      }))
      .filter(({ artifact }) => artifact && (artifact.githubUrl || artifact.demoUrl || artifact.status === 'shipped'));

    const bullets: string[] = [
      `Completed ${mastered.length}/${allConcepts.length} core AI Engineering competencies (${hrs} verified curriculum hours, ${completedDays.length} daily study logs) spanning Math, Deep Learning, Transformers, RAG, and Agents.`,
      ...tracked.flatMap(({ proj }) => proj.resumeBullets.slice(0, 1))
    ];

    if (bullets.length < 3) {
      bullets.push(
        ...ROADMAP_PHASES[0].standardProject.resumeBullets.slice(0, 2)
      );
    }

    return {
      verifiedHours: hrs,
      masteredConcepts: mastered,
      shippedProjects: tracked,
      atsBullets: bullets
    };
  }, [completedConcepts, completedDays.length, artifacts]);

  const generateShareableMarkdown = () => {
    const lines = [
      `# ${candidateName} — ${targetHeadline}`,
      `> Verified SynapseLab AI Engineering Skill Dossier`,
      '',
      `- **Verified Curriculum Hours:** ${verifiedHours} hrs`,
      `- **Mastered Competencies:** ${completedConcepts.length} modules`,
      `- **Daily Study Logs:** ${completedDays.length} days (Longest Streak: ${streakState.longestStreak}d, Pace: ${pace})`,
      '',
      '## ATS-Ready Highlights',
      ...atsBullets.map((b) => `- ${b}`),
      '',
      '## Shipped AI Projects & GitHub Artifacts',
      ...(shippedProjects.length > 0
        ? shippedProjects.map(
            ({ proj, artifact }) =>
              `- **${proj.title}** (${artifact.status}) ${artifact.githubUrl ? `| GitHub: ${artifact.githubUrl}` : ''} ${artifact.demoUrl ? `| Demo: ${artifact.demoUrl}` : ''}`
          )
        : ['- Add your GitHub Repo & Demo links inside Future Projects Lab to showcase shipped work here.']),
      '',
      '## Key Engineering Scratchpad Notes',
      ...(scratchpadNotes.length > 0
        ? scratchpadNotes.slice(0, 5).map((n) => `- **Day ${n.dayNumber}:** ${n.note.slice(0, 160).replace(/\n/g, ' ')}`)
        : ['- Write daily notes in the Daily Planner Scratchpad to include key takeaways.'])
    ];
    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateShareableMarkdown());
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2200);
  };

  const handleDownloadDossierPdf = () => {
    const doc = new jsPDF();
    let y = 18;
    const margin = 16;
    const width = doc.internal.pageSize.getWidth() - margin * 2;

    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(candidateName, margin, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${targetHeadline} | ${verifiedHours} Verified Curriculum Hrs`, margin, 22);
    y = 42;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ATS-READY ENGINEERING BULLETS', margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const b of atsBullets) {
      const wrapped = doc.splitTextToSize(`• ${b}`, width);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4.8 + 2;
    }

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SHIPPED PROJECTS & ARTIFACTS', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    if (shippedProjects.length === 0) {
      doc.text('No GitHub artifacts attached yet — attach repos in Future Projects Lab.', margin, y);
      y += 8;
    } else {
      for (const { proj, artifact } of shippedProjects) {
        const line = `${proj.title} [${artifact.status.toUpperCase()}]`;
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(line, width), margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const links = `GitHub: ${artifact.githubUrl || 'N/A'} | Demo: ${artifact.demoUrl || 'N/A'}`;
        doc.text(doc.splitTextToSize(links, width), margin, y);
        y += 7;
      }
    }

    doc.save(`${candidateName.toLowerCase().replace(/\s+/g, '-')}-ai-skill-dossier.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Profile Inputs */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
              <span>LIVE AI PORTFOLIO & SKILL DOSSIER BUILDER</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'hinglish'
                ? 'Aapki Verified Progress, Scratchpad Insights aur Shipped Repos ka Shareable Dossier'
                : 'Verified AI Engineer Skill Dossier & ATS Resume Bullets'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMarkdown ? 'Copied Dossier MD!' : 'Copy Shareable Markdown'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDossierPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Skill Dossier PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-300 block">
              Your Display Name
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-300 block">
              Target Portfolio Headline
            </label>
            <input
              type="text"
              value={targetHeadline}
              onChange={(e) => setTargetHeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Verified Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900">
            <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">VERIFIED HOURS</div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white flex items-center gap-1">
              <Clock className="w-4 h-4 text-indigo-500" />
              {verifiedHours}h
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900">
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">CONCEPTS MASTERED</div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
              {masteredConcepts.length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900">
            <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400">SHIPPED REPOS</div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
              {shippedProjects.length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900">
            <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">SCRATCHPAD LOGS</div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
              {scratchpadNotes.length} days
            </div>
          </div>
        </div>
      </div>

      {/* ATS Bullets & Shipped GitHub Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Award className="w-4 h-4 text-indigo-500" />
            <span>Auto-Generated ATS Resume Bullets</span>
          </div>
          <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            {atsBullets.map((b, i) => (
              <li
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 leading-relaxed"
              >
                • {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <GitBranch className="w-4 h-4 text-emerald-500" />
            <span>Tracked GitHub & Deployed Projects</span>
          </div>
          {shippedProjects.length > 0 ? (
            <div className="space-y-3">
              {shippedProjects.map(({ proj, artifact }) => {
                const readmeScore = getArtifactCompletionScore(artifact);
                return (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{proj.title}</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                        {artifact.status} · README {readmeScore.done}/{readmeScore.total}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 font-mono text-[11px]">
                      {artifact.githubUrl && (
                        <a
                          href={artifact.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <GitBranch className="w-3 h-3" />
                          <span>GitHub Repo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {artifact.demoUrl && (
                        <a
                          href={artifact.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {artifact.latestCommitHash && (
                        <span className="text-slate-400">commit: {artifact.latestCommitHash}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Attach a GitHub repo link, commit SHA, live demo URL, and README checklist inside the <strong>Future Projects</strong> tab — your shipped artifacts appear here automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
