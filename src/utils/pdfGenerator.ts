import { jsPDF } from 'jspdf';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { generateMasterPlanForMonths, TIMELINE_TRACK_CONFIGS } from '../data/twentyMonthMasterPlanData';
import { generateDailySchedule } from '../data/dailyScheduleData';
import { SchedulePace, Language, MasterPlanMonths, StreakState } from '../types';

interface GeneratePdfOptions {
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
  language: Language;
}

export interface SavedScratchpadEntry {
  dayNumber: number;
  note: string;
  wordCount: number;
}

export interface ProgressReportPdfOptions {
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
  language: Language;
  streakState?: StreakState;
  userEmail?: string | null;
}

export const collectSavedScratchpadNotes = (): SavedScratchpadEntry[] => {
  const entries: SavedScratchpadEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const match = key.match(/^ai_mastery_scratchpad_day_(\d+)$/);
      if (!match) continue;
      const dayNumber = Number(match[1]);
      const raw = localStorage.getItem(key) || '';
      const trimmed = raw.trim();
      if (!trimmed) continue;
      entries.push({
        dayNumber,
        note: raw,
        wordCount: trimmed.split(/\s+/).length
      });
    }
  } catch {
    // Ignore storage read restrictions
  }
  return entries.sort((a, b) => a.dayNumber - b.dayNumber);
};

export const generateRoadmapPdf = (options: GeneratePdfOptions): void => {
  const { pace, completedConcepts, completedDays, language } = options;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let y = 16;

  // Track page count manually
  let currentPage = 1;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      addFooter();
      doc.addPage();
      currentPage++;
      y = 16;
      addHeader();
    }
  };

  const addHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text('AI ENGINEERING MASTERY CURRICULUM · 20-MONTH 2-HOURS/DAY MASTER PLAN', marginX, 10);
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.2);
    doc.line(marginX, 11.5, pageWidth - marginX, 11.5);
  };

  const addFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);
    doc.text(`AI Engineering Mastery Roadmap · Page ${currentPage}`, marginX, pageHeight - 7);
    doc.text('https://github.com/ai-engineering-mastery', pageWidth - marginX, pageHeight - 7, { align: 'right' });
  };

  // --- COVER / HEADER SECTION ---
  addHeader();

  // Primary Title Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, 34, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('AI ENGINEERING MASTERY ROADMAP', marginX + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(190, 205, 245);
  doc.text(
    'From Mathematical Foundations to LLMs, LoRA, Reasoning Models (MCTS) & Autonomous Swarms',
    marginX + 6,
    y + 16
  );

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const totalConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts).length;
  const progressPct = Math.round((completedConcepts.length / (totalConcepts || 1)) * 100);
  doc.text(
    `Study Pace: ${pace.toUpperCase()} | 2 Hours/Day Habit | Progress: ${completedConcepts.length}/${totalConcepts} Concepts (${progressPct}%) | Generated: ${new Date().toLocaleDateString()}`,
    marginX + 6,
    y + 24
  );

  // Status badge bar
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(marginX + 6, y + 27, 44, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`✓ ${completedDays.length} DAYS COMPLETED`, marginX + 8, y + 30.5);

  y += 40;

  // --- 2-HOUR DAILY HABIT FORMULA ---
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('THE 2-HOUR DAILY HABIT FORMULA (120 MINUTES EXACT TIME-BOX)', marginX + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('• 00:00 - 00:50 (50m): Core Concept Lecture (CampusX / Krish Naik / Chai aur Code in Hindi)', marginX + 4, y + 10.5);
  doc.text('• 00:50 - 01:00 (10m): Active Rest & Hydration Break (Physical disconnect from screen)', marginX + 4, y + 14.5);
  doc.text('• 01:00 - 01:50 (50m): Hands-on Coding Challenge in VS Code / PyTorch Jupyter Notebook', marginX + 4, y + 18.5);
  doc.text('• 01:50 - 02:00 (10m): Retention Quiz & Spaced Review Notes (Anki / GitHub commit)', marginX + 4, y + 22.5);

  y += 29;

  // --- MASTER PLAN SUMMARY (20 / 16 / 14 / 12 MONTHS) ---
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

  if (masterMonths) {
    const planRows = generateMasterPlanForMonths(masterMonths);
    const trackMeta = TIMELINE_TRACK_CONFIGS.find((t) => t.months === masterMonths);
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${masterMonths}-MONTH MASTER PLAN TRAJECTORY (${trackMeta?.dailyHoursLabel?.toUpperCase() || '2 HOURS/DAY'} · 1,200 HOURS)`,
      marginX,
      y
    );
    y += 5;

    // Table of months
    planRows.forEach((month, idx) => {
      checkPageBreak(12);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(marginX, y, contentWidth, 9, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 9, marginX + contentWidth, y + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text(`${month.monthLabel}`, marginX + 2, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(month.title, marginX + 24, y + 6, { maxWidth: contentWidth - 46 });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${month.totalStudyHours}h study`, marginX + contentWidth - 2, y + 6, { align: 'right' });

      y += 9.5;
    });

    y += 6;
  }

  // --- SEQUENTIAL PHASES DEEP DIVE (PHASE 0 TO 8) ---
  ROADMAP_PHASES.forEach((phase) => {
    checkPageBreak(38);

    // Phase Banner Header
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.roundedRect(marginX, y, contentWidth, 11, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `PHASE 0${phase.phaseNumber}: ${phase.title.toUpperCase()}`,
      marginX + 4,
      y + 7.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(224, 231, 255);
    doc.text(`Duration: ~${phase.durationWeeks} Weeks`, marginX + contentWidth - 4, y + 7.5, {
      align: 'right',
    });

    y += 14;

    // Subtitle & Overview
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Focus: ${phase.subtitle}`, marginX, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const overviewText = language === 'hinglish' ? phase.hinglishOverview : phase.overview;
    const splitOverview = doc.splitTextToSize(overviewText, contentWidth);
    doc.text(splitOverview, marginX, y);
    y += splitOverview.length * 3.5 + 4;

    // Key Milestones
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Phase Milestones:', marginX, y);
    y += 3.5;

    phase.keyMilestones.forEach((m) => {
      checkPageBreak(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`✓ ${m}`, marginX + 3, y);
      y += 3.8;
    });
    y += 2;

    // Core Concepts Checklist
    checkPageBreak(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Core Concepts & Technical Competencies:', marginX, y);
    y += 4;

    phase.concepts.forEach((concept) => {
      const isDone = completedConcepts.includes(concept.id);
      const descLines = doc.splitTextToSize(concept.description, contentWidth - 10);
      const blockHeight = 5 + descLines.length * 3.2;

      checkPageBreak(blockHeight + 2);

      // Checkbox box
      doc.setDrawColor(isDone ? 16 : 148, isDone ? 185 : 163, isDone ? 129 : 184); // emerald vs slate
      doc.setFillColor(isDone ? 236 : 255, isDone ? 253 : 255, isDone ? 245 : 255);
      doc.rect(marginX + 2, y - 2.8, 3.2, 3.2, 'FD');

      if (isDone) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(5, 150, 105);
        doc.text('✓', marginX + 2.5, y - 0.4);
      }

      // Concept Title & Difficulty
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (isDone) {
        doc.setTextColor(5, 150, 105);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(concept.title, marginX + 8, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`[${concept.difficulty} · ~${concept.estHours}h]`, marginX + contentWidth - 2, y, {
        align: 'right',
      });

      y += 3.8;

      // Concept Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(descLines, marginX + 8, y);
      y += descLines.length * 3.2 + 2;
    });

    // Recommended Hindi YouTube Playlists
    checkPageBreak(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(220, 38, 38); // red-600
    doc.text('Recommended Hindi YouTube Playlists:', marginX, y);
    y += 4;

    phase.hindiResources.forEach((res) => {
      const tipLines = doc.splitTextToSize(`Tip: ${res.hinglishTip}`, contentWidth - 6);
      const resHeight = 7 + tipLines.length * 3;
      checkPageBreak(resHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${res.channelName} (${res.hostName}): ${res.playlistTitle}`, marginX + 2, y);
      y += 3.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(tipLines, marginX + 5, y);
      y += tipLines.length * 3 + 1.5;
    });

    // Dual Projects: Standard Resume vs Visionary Future
    checkPageBreak(30);

    // Standard Industry Project
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentWidth, 19, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 19, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(79, 70, 229);
    doc.text('INDUSTRY RESUME PROJECT:', marginX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(phase.standardProject.title, marginX + 45, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tech: ${phase.standardProject.techStack.join(', ')}`, marginX + 3, y + 8.5);

    const resumeBullet = phase.standardProject.resumeBullets[0] || phase.standardProject.tagline;
    const splitBullet = doc.splitTextToSize(`• ${resumeBullet}`, contentWidth - 6);
    doc.text(splitBullet, marginX + 3, y + 12.5);

    y += 22;

    // Visionary Future Project
    checkPageBreak(22);
    doc.setFillColor(250, 245, 255); // purple-50
    doc.roundedRect(marginX, y, contentWidth, 19, 1.5, 1.5, 'F');
    doc.setDrawColor(233, 213, 255); // purple-200
    doc.roundedRect(marginX, y, contentWidth, 19, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(147, 51, 234); // purple-600
    doc.text('VISIONARY FUTURE PROJECT:', marginX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(phase.visionaryProject.title, marginX + 48, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(126, 34, 206);
    doc.text(`Future Edge: ${phase.visionaryProject.noveltyFactor}`, marginX + 3, y + 8.5);

    const visBullet = phase.visionaryProject.resumeBullets[0] || phase.visionaryProject.tagline;
    const splitVisBullet = doc.splitTextToSize(`• ${visBullet}`, contentWidth - 6);
    doc.text(splitVisBullet, marginX + 3, y + 12.5);

    y += 26;
  });

  // Add final page footer
  addFooter();

  // Save PDF
  const filename = `AI_Engineering_Mastery_Roadmap_${pace}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

const sanitizePdfText = (input: string): string => {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '');
};

export const generateProgressAndNotesPdf = (options: ProgressReportPdfOptions): void => {
  const { pace, completedConcepts, completedDays, language, streakState, userEmail } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let y = 18;

  const schedule = generateDailySchedule(pace);
  const savedNotes = collectSavedScratchpadNotes();
  const totalConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts).length;
  const progressPct = Math.round((completedConcepts.length / (totalConcepts || 1)) * 100);
  const dayPct = Math.round((completedDays.length / (schedule.length || 1)) * 100);
  const sortedCompletedDays = [...completedDays].sort((a, b) => a - b);

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // --- HERO REPORT HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, 31, 2.5, 2.5, 'F');

  // Indigo left accent bar inside banner
  doc.setFillColor(79, 70, 229);
  doc.rect(marginX, y + 3, 2, 25, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('NEUROFORGE AI - STUDY PROGRESS & NOTES REPORT', marginX + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  const profileLabel = userEmail ? sanitizePdfText(userEmail) : 'Local Study Profile';
  doc.text(
    `Learner: ${profileLabel}  |  Active Track: ${pace.toUpperCase()} (${schedule.length} Days)`,
    marginX + 6,
    y + 17.5
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    marginX + 6,
    y + 24
  );

  y += 37;

  // --- 4 KPI METRIC CARDS ---
  ensureSpace(24);
  const cardGap = 3.5;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const kpis = [
    {
      label: 'CONCEPTS MASTERED',
      value: `${completedConcepts.length} / ${totalConcepts}`,
      sub: `${progressPct}% complete`,
      accent: [79, 70, 229] as [number, number, number]
    },
    {
      label: 'DAYS COMPLETED',
      value: `${completedDays.length} / ${schedule.length}`,
      sub: `${dayPct}% schedule`,
      accent: [16, 185, 129] as [number, number, number]
    },
    {
      label: 'STUDY STREAK',
      value: `${streakState?.currentStreak ?? completedDays.length} Days`,
      sub: `Best: ${streakState?.longestStreak ?? completedDays.length}d`,
      accent: [217, 119, 6] as [number, number, number]
    },
    {
      label: 'SCRATCHPAD NOTES',
      value: `${savedNotes.length} ${savedNotes.length === 1 ? 'Day' : 'Days'}`,
      sub: `${savedNotes.reduce((acc, n) => acc + n.wordCount, 0)} words total`,
      accent: [14, 165, 233] as [number, number, number]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cx = marginX + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardWidth, 20, 1.8, 1.8, 'FD');

    doc.setFillColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.rect(cx + 3, y + 3, 8, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cx + 3, y + 7.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, cx + 3, y + 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.sub, cx + 3, y + 17.8);
  });

  y += 27;

  // --- SECTION 1: PHASE-BY-PHASE PROGRESS ---
  ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ROADMAP MASTERY BREAKDOWN BY PHASE', marginX, y);
  y += 5;

  ROADMAP_PHASES.forEach((phase) => {
    const totalInPhase = phase.concepts.length;
    const doneConcepts = phase.concepts.filter((c) => completedConcepts.includes(c.id));
    const phasePct = Math.round((doneConcepts.length / (totalInPhase || 1)) * 100);

    const completedTitlesText =
      doneConcepts.length > 0
        ? `Mastered: ${doneConcepts.map((c) => sanitizePdfText(c.title)).join(', ')}`
        : 'Not started yet';
    const titleLines = doc.splitTextToSize(completedTitlesText, contentWidth - 8);
    const boxHeight = 12 + titleLines.length * 3.3;

    ensureSpace(boxHeight + 3);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    // Phase label + count
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      sanitizePdfText(`Phase 0${phase.phaseNumber}: ${phase.title}`),
      marginX + 3.5,
      y + 5
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(
      phasePct === 100 ? 5 : 79,
      phasePct === 100 ? 150 : 70,
      phasePct === 100 ? 105 : 229
    );
    doc.text(
      `${doneConcepts.length}/${totalInPhase} (${phasePct}%)`,
      marginX + contentWidth - 3.5,
      y + 5,
      { align: 'right' }
    );

    // Drawn vector progress bar
    const barX = marginX + 3.5;
    const barY = y + 7;
    const barW = contentWidth - 7;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, barY, barW, 1.8, 0.8, 0.8, 'F');
    if (phasePct > 0) {
      doc.setFillColor(
        phasePct === 100 ? 16 : 79,
        phasePct === 100 ? 185 : 70,
        phasePct === 100 ? 129 : 229
      );
      doc.roundedRect(barX, barY, Math.max(2, (barW * phasePct) / 100), 1.8, 0.8, 0.8, 'F');
    }

    // Completed concept names list
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(doneConcepts.length > 0 ? 51 : 148, doneConcepts.length > 0 ? 65 : 163, doneConcepts.length > 0 ? 85 : 184);
    doc.text(titleLines, marginX + 3.5, y + 12);

    y += boxHeight + 2.5;
  });

  y += 4;

  // --- SECTION 2: COMPLETED DAILY SESSIONS ---
  ensureSpace(18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COMPLETED DAILY STUDY SESSIONS', marginX, y);
  y += 5;

  if (sortedCompletedDays.length === 0) {
    ensureSpace(12);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 10, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No daily study sessions marked completed yet.', marginX + 4, y + 6.2);
    y += 14;
  } else {
    sortedCompletedDays.slice(0, 60).forEach((dayNum, idx) => {
      const task = schedule.find((t) => t.dayNumber === dayNum);
      const taskTitle = task
        ? sanitizePdfText(language === 'hinglish' ? task.hinglishTitle : task.title)
        : `Study Day ${dayNum}`;
      const rowLines = doc.splitTextToSize(`Day ${dayNum} (Phase 0${task?.phaseNumber ?? 0}) - ${taskTitle}`, contentWidth - 10);
      const rowH = Math.max(6.5, rowLines.length * 3.6 + 2.5);

      ensureSpace(rowH);
      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      doc.rect(marginX, y, contentWidth, rowH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + rowH, marginX + contentWidth, y + rowH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('[DONE]', marginX + 2.5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(30, 41, 59);
      doc.text(rowLines, marginX + 15, y + 4.5);

      y += rowH;
    });

    if (sortedCompletedDays.length > 60) {
      ensureSpace(7);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `+ ${sortedCompletedDays.length - 60} additional completed days logged.`,
        marginX + 2,
        y + 4.5
      );
      y += 7;
    }

    y += 6;
  }

  // --- SECTION 3: DAILY STUDY SCRATCHPAD NOTES ---
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. STUDY SCRATCHPAD NOTES (SAVED PER DAY)', marginX, y);
  y += 5;

  if (savedNotes.length === 0) {
    ensureSpace(14);
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(marginX, y, contentWidth, 13, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text(
      'No Study Scratchpad notes recorded yet. Add daily notes inside Daily Planner -> Study Scratchpad.',
      marginX + 4,
      y + 7.8
    );
    y += 16;
  } else {
    savedNotes.forEach((entry) => {
      const task = schedule.find((t) => t.dayNumber === entry.dayNumber);
      const isDone = completedDays.includes(entry.dayNumber);
      const dayTitle = task
        ? sanitizePdfText(language === 'hinglish' ? task.hinglishTitle : task.title)
        : `Study Day ${entry.dayNumber}`;

      const cleanNote = sanitizePdfText(entry.note.trim());
      const noteLines = doc.splitTextToSize(cleanNote || '(Empty)', contentWidth - 10);
      const headerHeight = 10.5;
      const bodyHeight = Math.max(8, noteLines.length * 4 + 4);
      const totalCardHeight = headerHeight + bodyHeight;

      // Keep note cards cleanly grouped when they fit on one page, or split safely for extra-long notes
      if (totalCardHeight <= pageHeight - 36) {
        ensureSpace(totalCardHeight + 3);
      } else {
        ensureSpace(24);
      }

      // Note card header strip
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, y, contentWidth, headerHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(79, 70, 229);
      const dayHeader = `DAY ${String(entry.dayNumber).padStart(2, '0')} · PHASE 0${task?.phaseNumber ?? 0}`;
      doc.text(dayHeader, marginX + 3.5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(isDone ? 5 : 100, isDone ? 150 : 116, isDone ? 105 : 139);
      doc.text(
        `${isDone ? 'Completed' : 'In Progress'} · ${entry.wordCount} words`,
        marginX + contentWidth - 3.5,
        y + 4.5,
        { align: 'right' }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(dayTitle, marginX + 3.5, y + 8.8, { maxWidth: contentWidth - 7 });

      y += headerHeight + 1.5;

      // Render note body lines with automatic page-break pagination for very long notes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(51, 65, 85);

      let lineIdx = 0;
      while (lineIdx < noteLines.length) {
        ensureSpace(6);
        const startY = y;
        const maxLinesHere = Math.max(1, Math.floor((pageHeight - 18 - startY) / 4));
        const chunk = noteLines.slice(lineIdx, lineIdx + maxLinesHere);
        const chunkHeight = chunk.length * 4 + 3;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, startY, contentWidth, chunkHeight, 1.2, 1.2, 'FD');

        doc.setTextColor(51, 65, 85);
        doc.text(chunk, marginX + 4, startY + 4.5);

        y = startY + chunkHeight + 2;
        lineIdx += chunk.length;
      }

      y += 2;
    });
  }

  // --- RUNNING HEADER & PAGE-NUMBERED FOOTER PASS ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    if (p > 1) {
      doc.text('NeuroForge AI - Study Progress & Notes Report', marginX, 10);
      doc.text(`Track: ${pace.toUpperCase()}`, pageWidth - marginX, 10, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginX, 11.8, pageWidth - marginX, 11.8);
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11.5, pageWidth - marginX, pageHeight - 11.5);
    doc.text('NeuroForge AI Study Report', marginX, pageHeight - 7);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  }

  const reportFilename = `NeuroForge_Progress_Notes_Report_${pace}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(reportFilename);
};

