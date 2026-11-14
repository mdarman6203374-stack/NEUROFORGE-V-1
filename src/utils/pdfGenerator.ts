import { jsPDF } from 'jspdf';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { generateMasterPlanForMonths, TIMELINE_TRACK_CONFIGS } from '../data/twentyMonthMasterPlanData';
import { SchedulePace, Language, MasterPlanMonths } from '../types';

interface GeneratePdfOptions {
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
  language: Language;
}

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
