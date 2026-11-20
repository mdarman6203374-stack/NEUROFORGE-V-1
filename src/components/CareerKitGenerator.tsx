import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Briefcase,
  BookOpen,
  Copy,
  Check,
  Download,
  UserCheck,
  Sparkles,
  Flame,
  CheckCircle2,
  GitBranch,
  ListChecks
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { CAREER_ROLES_DATA } from '../data/careerData';
import { Language, SchedulePace, StreakState } from '../types';
import {
  loadProjectArtifacts,
  ProjectArtifactRecord,
  getArtifactCompletionScore
} from '../utils/projectArtifacts';

interface CareerKitGeneratorProps {
  completedConcepts: string[];
  completedDays: number[];
  pace: SchedulePace;
  streakState: StreakState;
  language: Language;
  userEmail?: string | null;
}

type KitTab = 'ats-bullets' | 'linkedin' | 'readme';
type ToneMode = 'ats-global' | 'internship' | 'senior';
type ResumeFormatMode = 'bullets-only' | 'full-resume';

export const CareerKitGenerator: React.FC<CareerKitGeneratorProps> = ({
  completedConcepts,
  completedDays,
  pace,
  streakState,
  language,
  userEmail
}) => {
  const [activeKitTab, setActiveKitTab] = useState<KitTab>('ats-bullets');
  const [resumeFormatMode, setResumeFormatMode] = useState<ResumeFormatMode>('bullets-only');
  const [toneMode, setToneMode] = useState<ToneMode>('ats-global');

  const [fullName, setFullName] = useState<string>(
    userEmail
      ? userEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Aarav Sharma'
  );
  const [locationText, setLocationText] = useState<string>('Bengaluru / Remote');
  const [githubHandle, setGithubHandle] = useState<string>('github.com/yourusername');
  const [linkedinHandle, setLinkedinHandle] = useState<string>('linkedin.com/in/yourusername');
  const [targetRoleId, setTargetRoleId] = useState<string>(
    CAREER_ROLES_DATA[0]?.id || 'ai-llm-engineer'
  );

  // Live reload project artifacts whenever storage/window focuses
  const [artifacts, setArtifacts] = useState<Record<string, ProjectArtifactRecord>>(() =>
    loadProjectArtifacts()
  );

  useEffect(() => {
    const refreshArtifacts = () => setArtifacts(loadProjectArtifacts());
    window.addEventListener('storage', refreshArtifacts);
    window.addEventListener('focus', refreshArtifacts);
    return () => {
      window.removeEventListener('storage', refreshArtifacts);
      window.removeEventListener('focus', refreshArtifacts);
    };
  }, []);

  const allProjects = useMemo(
    () =>
      ROADMAP_PHASES.flatMap((phase) => [
        { ...phase.standardProject, phaseNumber: phase.phaseNumber, phaseTitle: phase.title },
        { ...phase.visionaryProject, phaseNumber: phase.phaseNumber, phaseTitle: phase.title }
      ]),
    []
  );

  const completedArtifactProjects = useMemo(
    () =>
      allProjects.filter((p) => {
        const art = artifacts[p.id];
        return art && (art.status === 'shipped' || Boolean(art.githubUrl) || Boolean(art.demoUrl));
      }),
    [allProjects, artifacts]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    const initialArt = loadProjectArtifacts();
    const firstShipped = allProjects.find(
      (p) => initialArt[p.id]?.status === 'shipped' || initialArt[p.id]?.githubUrl
    );
    return firstShipped?.id || allProjects[0]?.id || 'proj-p0-std';
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const targetRole = useMemo(
    () => CAREER_ROLES_DATA.find((r) => r.id === targetRoleId) || CAREER_ROLES_DATA[0],
    [targetRoleId]
  );

  const featuredProject = useMemo(
    () => allProjects.find((p) => p.id === selectedProjectId) || allProjects[0],
    [allProjects, selectedProjectId]
  );

  // Pull learned concepts, phase completion, streaks, and completed projects
  const profileStats = useMemo(() => {
    const allConcepts = ROADMAP_PHASES.flatMap((phase) =>
      phase.concepts.map((c) => ({
        ...c,
        phaseNumber: phase.phaseNumber,
        phaseTitle: phase.title
      }))
    );

    const mastered = allConcepts.filter((c) => completedConcepts.includes(c.id));
    const verifiedHours = mastered.reduce((sum, c) => sum + (c.estHours || 10), 0);

    const phaseBreakdown = ROADMAP_PHASES.map((phase) => {
      const done = phase.concepts.filter((c) => completedConcepts.includes(c.id)).length;
      return {
        phaseNumber: phase.phaseNumber,
        title: phase.title,
        done,
        total: phase.concepts.length
      };
    }).filter((p) => p.done > 0);

    const unlockedPhaseNumbers = new Set(mastered.map((c) => c.phaseNumber));
    const phaseUnlockedProjects = allProjects.filter(
      (p) => unlockedPhaseNumbers.has(p.phaseNumber) && !completedArtifactProjects.some((cp) => cp.id === p.id)
    );

    // Prioritize explicitly completed/shipped projects, then featured, then unlocked phase projects
    const finalProjects = Array.from(
      new Map(
        [
          ...completedArtifactProjects,
          featuredProject,
          ...phaseUnlockedProjects.slice(0, 2)
        ]
          .filter(Boolean)
          .map((p) => [p.id, p])
      ).values()
    ).slice(0, 4);

    // Exact short names of learned concepts
    const learnedTopicNames = mastered.map((m) => m.title.split(':')[0].trim());

    const skillGroups = [
      {
        label: 'Languages & Mathematical Foundations',
        items: Array.from(
          new Set([
            'Python 3.12',
            'TypeScript',
            ...(mastered.some((m) => m.id === 'p0-1') ? ['Linear Algebra (SVD/PCA)'] : []),
            ...(mastered.some((m) => m.id === 'p0-2') ? ['Gradient Descent & Backprop'] : []),
            ...(mastered.some((m) => m.id === 'p0-3') ? ['Probability & MLE'] : []),
            ...(mastered.some((m) => m.phaseNumber === 1) ? ['Scikit-Learn', 'XGBoost'] : [])
          ])
        )
      },
      {
        label: 'Deep Learning, LLMs & RAG',
        items: Array.from(
          new Set([
            ...(mastered.some((m) => m.phaseNumber >= 2) ? ['PyTorch', 'Neural Architectures'] : ['PyTorch (Active Track)']),
            ...(mastered.some((m) => m.phaseNumber >= 3) ? ['Transformers', 'Self-Attention'] : []),
            ...(mastered.some((m) => m.phaseNumber >= 4) ? ['RAG Pipelines', 'Hybrid Vector Search'] : []),
            ...targetRole.requiredSkills.slice(0, 3)
          ])
        )
      },
      {
        label: 'Agents, Fine-Tuning & MLOps',
        items: Array.from(
          new Set([
            'FastAPI',
            'Docker',
            'Git / GitHub',
            ...(mastered.some((m) => m.phaseNumber >= 5) ? ['Multi-Agent Systems', 'RAGAS Evals'] : []),
            ...(mastered.some((m) => m.phaseNumber >= 6) ? ['QLoRA', 'vLLM', 'Quantization (INT4/AWQ)'] : [])
          ])
        )
      }
    ];

    return {
      totalConceptsCount: allConcepts.length,
      mastered,
      learnedTopicNames,
      verifiedHours,
      phaseBreakdown,
      finalProjects,
      skillGroups
    };
  }, [completedConcepts, allProjects, completedArtifactProjects, featuredProject, targetRole.requiredSkills]);

  // 1A. Clean Plain-Text ATS Bullet-Point List (copy-pasteable directly into Word / Google Docs / ATS)
  const atsBulletItems = useMemo(() => {
    const items: Array<{ id: string; category: string; text: string }> = [];

    // Lead training & consistency bullet pulling real streak, days & learned concepts
    const conceptHighlight =
      profileStats.learnedTopicNames.length > 0
        ? profileStats.learnedTopicNames.slice(0, 5).join(', ')
        : 'Linear Algebra, Gradient Descent, Python';

    const leadVerb =
      toneMode === 'internship'
        ? 'Completed'
        : toneMode === 'senior'
        ? 'Architected & verified'
        : 'Executed';

    items.push({
      id: 'bullet-track',
      category: 'Verified Mastery & Streak',
      text: `${leadVerb} ${profileStats.mastered.length}/${profileStats.totalConceptsCount} AI Engineering competencies (${profileStats.verifiedHours}+ verified hands-on hours across ${completedDays.length} daily logs; ${streakState.currentStreak}-day active / ${streakState.longestStreak}-day peak streak) covering ${conceptHighlight}.`
    });

    // Pull ATS bullets for completed / selected projects
    profileStats.finalProjects.forEach((proj, pIdx) => {
      const art = artifacts[proj.id];
      const statusTag = art?.status === 'shipped' ? 'Shipped Project' : `Phase ${proj.phaseNumber} Build`;
      const stackSuffix = ` [Stack: ${proj.techStack.slice(0, 4).join(', ')}]`;

      proj.resumeBullets.slice(0, pIdx === 0 ? 3 : 2).forEach((bullet, bIdx) => {
        const cleanBullet = bullet.trim().replace(/^[-•]\s*/, '');
        items.push({
          id: `proj-${proj.id}-${bIdx}`,
          category: `${statusTag} · ${proj.title.split(':')[0]}`,
          text: bIdx === 0 ? `${cleanBullet}${stackSuffix}` : cleanBullet
        });
      });
    });

    return items;
  }, [profileStats, completedDays.length, streakState.currentStreak, streakState.longestStreak, toneMode, artifacts]);

  const plainAtsBulletsText = useMemo(
    () => atsBulletItems.map((b) => `• ${b.text}`).join('\n'),
    [atsBulletItems]
  );

  // 1B. Full ATS Resume Markdown
  const fullResumeText = useMemo(() => {
    const summaryLead =
      toneMode === 'internship'
        ? `Motivated ${targetRole.title} candidate with ${profileStats.verifiedHours}+ verified hands-on hours across ${profileStats.mastered.length} core ML/LLM concepts and a ${streakState.longestStreak}-day peak study streak.`
        : toneMode === 'senior'
        ? `Production-focused ${targetRole.title} specializing in end-to-end LLM systems, VRAM/latency optimization, RAG pipelines, and reproducible ML infrastructure (${profileStats.verifiedHours}+ verified hours, ${completedArtifactProjects.length} shipped artifacts).`
        : `${targetRole.title} with ${profileStats.mastered.length}/${profileStats.totalConceptsCount} verified AI Engineering competencies (${profileStats.verifiedHours} hours, ${completedDays.length} daily logs, ${streakState.longestStreak}-day peak streak).`;

    const projectBlocks = profileStats.finalProjects.map((proj) => {
      const art = artifacts[proj.id];
      const links = [art?.githubUrl, art?.demoUrl].filter(Boolean).join(' | ');
      const shippedLabel = art?.status === 'shipped' ? ' [SHIPPED]' : '';
      return [
        `### ${proj.title}${shippedLabel}${links ? ` (${links})` : ''}`,
        `*Stack: ${proj.techStack.join(', ')}*`,
        ...proj.resumeBullets.map((b) => `- ${b}`)
      ].join('\n');
    });

    return [
      `# ${fullName}`,
      `${targetRole.title} | ${locationText} | ${githubHandle} | ${linkedinHandle}${userEmail ? ` | ${userEmail}` : ''}`,
      '',
      '## SUMMARY',
      summaryLead,
      '',
      '## TECHNICAL SKILLS',
      ...profileStats.skillGroups.map((g) => `- **${g.label}:** ${g.items.join(', ')}`),
      '',
      '## COMPLETED & FEATURED AI PROJECTS',
      ...projectBlocks,
      '',
      '## VERIFIED TRAINING & LEARNED CONCEPTS',
      `- **TensorPlay AI Engineering Track (${pace})** — ${profileStats.mastered.length} concepts mastered (${profileStats.verifiedHours} hrs), ${completedDays.length} daily study logs, ${streakState.currentStreak}-day active / ${streakState.longestStreak}-day longest streak.`,
      ...(profileStats.learnedTopicNames.length > 0
        ? [`- **Verified Concepts:** ${profileStats.learnedTopicNames.join(', ')}`]
        : [])
    ].join('\n');
  }, [
    fullName,
    targetRole.title,
    locationText,
    githubHandle,
    linkedinHandle,
    userEmail,
    toneMode,
    profileStats,
    streakState.currentStreak,
    streakState.longestStreak,
    completedDays.length,
    completedArtifactProjects.length,
    artifacts,
    pace
  ]);

  // 2. LinkedIn Skill Summary & Profile Optimizer
  const linkedinKit = useMemo(() => {
    const headline = `${targetRole.title} | ${profileStats.learnedTopicNames.slice(0, 3).join(', ') || 'Python, PyTorch, RAG'} | ${profileStats.verifiedHours}+ Verified Engineering Hours | ${completedArtifactProjects.length} Shipped AI Builds`;

    const skillSummary = [
      `${targetRole.title} focused on production AI systems — combining mathematical fundamentals, PyTorch engineering, Retrieval-Augmented Generation (RAG), and cost-aware LLM deployment.`,
      '',
      `Verified Progress & Consistency:`,
      `• Study Streak: ${streakState.currentStreak}-day active streak (${streakState.longestStreak}-day peak) across ${completedDays.length} daily engineering logs`,
      `• Mastered Concepts (${profileStats.mastered.length}/${profileStats.totalConceptsCount} · ${profileStats.verifiedHours}+ hrs): ${profileStats.learnedTopicNames.join(' · ') || 'Foundational ML & Python'}`,
      `• Completed / Featured Projects: ${profileStats.finalProjects.map((p) => p.title.split(':')[0]).join(', ')}`,
      '',
      `Core Technical Skill Summary:`,
      ...profileStats.skillGroups.map((g) => `• ${g.label}: ${g.items.join(', ')}`),
      '',
      `Featured Build — ${featuredProject.title}:`,
      `${featuredProject.tagline} (${featuredProject.keyMetrics})`,
      '',
      `Open to ${targetRole.title} roles, internships, and AI engineering collaborations. GitHub: https://${githubHandle.replace(/^https?:\/\//, '')}`
    ].join('\n');

    const topSkills = Array.from(
      new Set([
        ...profileStats.learnedTopicNames.slice(0, 4),
        ...targetRole.requiredSkills,
        'Python',
        'PyTorch',
        'Retrieval-Augmented Generation (RAG)',
        'FastAPI',
        'LLM Evaluation'
      ])
    ).slice(0, 12);

    const launchPost = [
      `Milestone update (${streakState.longestStreak}-day peak streak · ${profileStats.mastered.length} AI concepts mastered): Just packaged ${featuredProject.title}!`,
      '',
      `Problem: ${featuredProject.problemStatement}`,
      '',
      `Architecture:`,
      ...featuredProject.solutionArchitecture.slice(0, 3).map((s) => `→ ${s}`),
      '',
      `Stack: ${featuredProject.techStack.join(' · ')}`,
      `Outcome: ${featuredProject.keyMetrics}`,
      '',
      `Repo & code: https://${githubHandle.replace(/^https?:\/\//, '')}`,
      '#AIEngineering #MachineLearning #LLM #Python #BuildInPublic'
    ].join('\n');

    return { headline, skillSummary, topSkills, launchPost };
  }, [
    targetRole,
    profileStats,
    completedDays.length,
    completedArtifactProjects.length,
    streakState.currentStreak,
    streakState.longestStreak,
    featuredProject,
    githubHandle
  ]);

  // 3. Project-Specific GitHub README.md Template
  const githubReadme = useMemo(() => {
    const art = artifacts[featuredProject.id];
    const readmeScore = getArtifactCompletionScore(art);
    const repoSlug = featuredProject.title
      .split(':')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const cloneUrl =
      art?.githubUrl || `https://${githubHandle.replace(/^https?:\/\//, '')}/${repoSlug}.git`;

    const phaseConcepts =
      ROADMAP_PHASES.find((p) => p.phaseNumber === featuredProject.phaseNumber)?.concepts.filter((c) =>
        completedConcepts.includes(c.id)
      ) || [];

    return [
      `# ${featuredProject.title}`,
      '',
      `> ${featuredProject.tagline}`,
      '',
      `![Stack](https://img.shields.io/badge/Stack-${encodeURIComponent(
        featuredProject.techStack.slice(0, 3).join(' · ')
      )}-indigo) ![Phase](https://img.shields.io/badge/Phase_${featuredProject.phaseNumber}-${
        art?.status === 'shipped' ? 'Shipped' : 'Active'
      }-emerald)`,
      '',
      ...(art?.demoUrl ? [`**Live Demo:** ${art.demoUrl}`] : []),
      ...(art?.latestCommitHash ? [`**Verified Commit:** \`${art.latestCommitHash}\``] : []),
      ...(art?.demoUrl || art?.latestCommitHash ? [''] : []),
      '## Problem Statement',
      featuredProject.problemStatement,
      '',
      '## Architecture Pipeline',
      '```text',
      `[Input / User Query]`,
      `        │`,
      ...featuredProject.solutionArchitecture.map(
        (step, idx) => `        ▼\n  ${idx + 1}. ${step}`
      ),
      `        │`,
      `        ▼`,
      `[Output · ${featuredProject.keyMetrics}]`,
      '```',
      '',
      '## Tech Stack',
      ...featuredProject.techStack.map((tech) => `- ${tech}`),
      '',
      '## Key Engineering Metrics',
      `- **Benchmark:** ${featuredProject.keyMetrics}`,
      `- **Differentiator:** ${featuredProject.noveltyFactor}`,
      ...(phaseConcepts.length > 0
        ? [`- **Applied Concepts:** ${phaseConcepts.map((c) => c.title).join(' · ')}`]
        : []),
      '',
      '## Quickstart & Local Setup',
      '```bash',
      `git clone ${cloneUrl}`,
      `cd ${repoSlug}`,
      'python -m venv .venv && source .venv/bin/activate',
      'pip install -r requirements.txt',
      'cp .env.example .env',
      'python main.py',
      '```',
      '',
      '## Verification Checklist',
      `- [${art?.checklist?.problemAndArchitecture ? 'x' : ' '}] Problem statement & architecture diagram documented`,
      `- [${art?.checklist?.reproducibleSetup ? 'x' : ' '}] Reproducible environment & setup instructions verified`,
      `- [${art?.checklist?.benchmarksAndEvals ? 'x' : ' '}] Quantitative benchmarks / unit tests recorded`,
      `- [${art?.checklist?.demoGifOrScreenshots ? 'x' : ' '}] Live demo / walkthrough media attached (${readmeScore.done}/${readmeScore.total} done)`,
      '',
      '## ATS Resume Highlights',
      ...featuredProject.resumeBullets.map((b) => `- ${b}`),
      '',
      '---',
      `Built by **${fullName}** (${linkedinHandle}) · ${profileStats.verifiedHours}h verified AI engineering track.`
    ].join('\n');
  }, [
    featuredProject,
    artifacts,
    githubHandle,
    completedConcepts,
    fullName,
    linkedinHandle,
    profileStats.verifiedHours
  ]);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResumePdf = () => {
    const doc = new jsPDF();
    const margin = 16;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);
    doc.text(fullName, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${targetRole.title} | ${locationText} | ${githubHandle}`, margin, y);
    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + width, y);
    y += 7;

    const addSection = (title: string, lines: string[]) => {
      if (y > 265) {
        doc.addPage();
        y = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(67, 56, 202);
      doc.text(title, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(30, 41, 59);

      for (const line of lines) {
        const wrapped = doc.splitTextToSize(line, width);
        if (y + wrapped.length * 4.5 > 280) {
          doc.addPage();
          y = 18;
        }
        doc.text(wrapped, margin, y);
        y += wrapped.length * 4.4 + 1.5;
      }
      y += 3;
    };

    addSection('PROFESSIONAL SUMMARY', [
      `${targetRole.title} with ${profileStats.verifiedHours}+ verified hands-on hours across ${profileStats.mastered.length} AI Engineering concepts (${completedDays.length} daily logs, ${streakState.longestStreak}-day peak streak).`
    ]);

    addSection(
      'TECHNICAL SKILLS',
      profileStats.skillGroups.map((g) => `${g.label}: ${g.items.join(', ')}`)
    );

    addSection(
      'ATS-READY PROJECT & TRAINING HIGHLIGHTS',
      atsBulletItems.map((b) => `• ${b.text}`)
    );

    doc.save(`${fullName.toLowerCase().replace(/\s+/g, '-')}-ats-resume.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Live State Summary + Profile Configuration */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>1-CLICK CAREER KIT GENERATOR</span>
              <span aria-hidden="true">·</span>
              <span>PULLED FROM LIVE PROGRESS</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'hinglish'
                ? 'Aapke Completed Projects, Study Streak aur Learned Concepts se ATS Resume, LinkedIn & README'
                : 'Auto-Formatted ATS Resume Bullets, LinkedIn Skill Summary & Project README'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
            {[
              { id: 'ats-bullets' as KitTab, label: 'ATS Bullets & Resume', icon: ListChecks },
              { id: 'linkedin' as KitTab, label: 'LinkedIn Skill Summary', icon: Briefcase },
              { id: 'readme' as KitTab, label: 'GitHub README Template', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeKitTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveKitTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pulled Live Progress Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Learned Concepts</span>
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {profileStats.mastered.length} / {profileStats.totalConceptsCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {profileStats.verifiedHours} verified hours
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Study Streaks</span>
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {streakState.currentStreak}d active · {streakState.longestStreak}d peak
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {completedDays.length} daily logs completed
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
              <span>Completed / Tracked Projects</span>
            </div>
            <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {completedArtifactProjects.length} shipped · {profileStats.finalProjects.length} featured
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {completedArtifactProjects.length > 0
                ? 'Synced from Project Tracker'
                : 'Using unlocked phase capstones'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              <span>Study Pace</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
              {pace}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {targetRole.title}
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Target AI Role
            </label>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {CAREER_ROLES_DATA.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              GitHub Profile URL
            </label>
            <input
              type="text"
              value={githubHandle}
              onChange={(e) => setGithubHandle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Project for README & Bio
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {allProjects.map((proj) => {
                const isShipped = artifacts[proj.id]?.status === 'shipped';
                return (
                  <option key={proj.id} value={proj.id}>
                    {isShipped ? '[Completed] ' : ''}Phase {proj.phaseNumber}:{' '}
                    {proj.title.split(':')[0]} ({proj.category})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Location / Work Mode
            </label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="text"
              value={linkedinHandle}
              onChange={(e) => setLinkedinHandle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Resume Tone Preset
            </label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {[
                { id: 'ats-global' as ToneMode, label: 'ATS Standard' },
                { id: 'internship' as ToneMode, label: 'Fresher/Intern' },
                { id: 'senior' as ToneMode, label: 'Impact-First' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setToneMode(t.id)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer transition-colors ${
                    toneMode === t.id
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Output Tab 1: ATS Bullet-Point List + Full Resume */}
      {activeKitTab === 'ats-bullets' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setResumeFormatMode('bullets-only')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  resumeFormatMode === 'bullets-only'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                ATS Bullet-Point List ({atsBulletItems.length})
              </button>
              <button
                type="button"
                onClick={() => setResumeFormatMode('full-resume')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  resumeFormatMode === 'full-resume'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Full Resume Draft (.MD)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    'ats-copy',
                    resumeFormatMode === 'bullets-only' ? plainAtsBulletsText : fullResumeText
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {copiedId === 'ats-copy' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedId === 'ats-copy'
                    ? 'Copied to Clipboard!'
                    : resumeFormatMode === 'bullets-only'
                    ? 'Copy All ATS Bullets'
                    : 'Copy Full Resume'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${fullName.toLowerCase().replace(/\s+/g, '-')}-resume.md`,
                    fullResumeText
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .MD</span>
              </button>

              <button
                type="button"
                onClick={downloadResumePdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ATS PDF</span>
              </button>
            </div>
          </div>

          {resumeFormatMode === 'bullets-only' ? (
            <div className="space-y-2.5">
              {atsBulletItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {item.category}
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      • {item.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.id, `• ${item.text}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 shrink-0 cursor-pointer"
                    title="Copy single bullet"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <pre className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[520px] overflow-y-auto">
              {fullResumeText}
            </pre>
          )}
        </div>
      )}

      {/* Output Tab 2: LinkedIn Skill Summary */}
      {activeKitTab === 'linkedin' && (
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. LinkedIn Headline ({linkedinKit.headline.length}/220 chars)
              </h3>
              <button
                type="button"
                onClick={() => copyText('li-headline', linkedinKit.headline)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              >
                {copiedId === 'li-headline' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === 'li-headline' ? 'Copied!' : 'Copy Headline'}</span>
              </button>
            </div>
            <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
              {linkedinKit.headline}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. LinkedIn Skill Summary & "About" Bio
                </h3>
                <button
                  type="button"
                  onClick={() => copyText('li-about', linkedinKit.skillSummary)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {copiedId === 'li-about' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === 'li-about' ? 'Copied!' : 'Copy Skill Summary'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {linkedinKit.skillSummary}
              </pre>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>3. Top 12 Recruiter Skills</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyText('li-skills', linkedinKit.topSkills.join(', '))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {copiedId === 'li-skills' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'li-skills' ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {linkedinKit.topSkills.map((skill, idx) => (
                    <div
                      key={skill}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 truncate font-mono text-[11px]"
                      title={skill}
                    >
                      {idx + 1}. {skill}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    4. Ready-to-Post Milestone Update
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyText('li-post', linkedinKit.launchPost)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white cursor-pointer"
                  >
                    {copiedId === 'li-post' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'li-post' ? 'Copied' : 'Copy Post'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
                  {linkedinKit.launchPost}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Output Tab 3: Project-Specific GitHub README.md Template */}
      {activeKitTab === 'readme' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                GitHub README.md Template — {featuredProject.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Includes problem statement, architecture flow, applied concepts, verification checklist, quickstart commands, and resume bullets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyText('readme', githubReadme)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                {copiedId === 'readme' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === 'readme' ? 'Copied README!' : '1-Click Copy README.md'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadTextFile('README.md', githubReadme)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download README.md</span>
              </button>
            </div>
          </div>

          <pre className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[540px] overflow-y-auto">
            {githubReadme}
          </pre>
        </div>
      )}
    </div>
  );
};
