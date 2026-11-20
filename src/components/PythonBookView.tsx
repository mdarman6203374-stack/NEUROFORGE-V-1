import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Layers,
  ListTree,
  Play,
  RotateCcw,
  Search,
  Terminal,
  AlertTriangle,
  Wrench,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  PYTHON_AI_BOOK_CHAPTERS,
  BookChapter,
  BookLevel,
  BookPart,
} from '../data/pythonBookData';
import { Language } from '../types';
import { ensurePyodideScriptLoaded } from '../utils/pyodideRuntime';

interface PythonBookViewProps {
  language: Language;
  onNavigateTab?: (tab: string) => void;
}

const BOOK_READ_STORAGE_KEY = 'ai_mastery_python_book_read_v1';

const PART_ORDER: BookPart[] = [
  'Part I · Python Core',
  'Part II · Math, Data & ML',
  'Part III · Deep Learning & LLMs',
  'Part IV · RAG, Agents & LLMOps',
  'Part V · Frontiers & Interview Prep',
];

const LEVEL_FILTERS: Array<'All' | BookLevel> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Interview Prep',
];

export const PythonBookView: React.FC<PythonBookViewProps> = ({
  language,
  onNavigateTab,
}) => {
  const [bookLang, setBookLang] = useState<Language>(language);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    PYTHON_AI_BOOK_CHAPTERS[0].id
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'All' | BookLevel>('All');
  const [showMobileToc, setShowMobileToc] = useState<boolean>(false);

  const [readChapterIds, setReadChapterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(BOOK_READ_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Code Runner state per chapter
  const [editableCodeMap, setEditableCodeMap] = useState<Record<string, string>>({});
  const [pythonOutput, setPythonOutput] = useState<string>('');
  const [pythonError, setPythonError] = useState<string>('');
  const [isRunningPython, setIsRunningPython] = useState<boolean>(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Interview Q&A reveal map
  const [revealedQAs, setRevealedQAs] = useState<Record<string, boolean>>({});
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sync initial reading style if global language flips
  useEffect(() => {
    setBookLang(language);
  }, [language]);

  // Persist completed chapters
  useEffect(() => {
    try {
      localStorage.setItem(BOOK_READ_STORAGE_KEY, JSON.stringify(readChapterIds));
    } catch {}
  }, [readChapterIds]);

  const isHinglish = bookLang === 'hinglish';

  const activeChapter: BookChapter = useMemo(() => {
    return (
      PYTHON_AI_BOOK_CHAPTERS.find((ch) => ch.id === selectedChapterId) ||
      PYTHON_AI_BOOK_CHAPTERS[0]
    );
  }, [selectedChapterId]);

  const activeIndex = PYTHON_AI_BOOK_CHAPTERS.findIndex(
    (ch) => ch.id === activeChapter.id
  );

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PYTHON_AI_BOOK_CHAPTERS.filter((ch) => {
      if (levelFilter !== 'All' && ch.level !== levelFilter) return false;
      if (!q) return true;
      const haystack = [
        ch.title,
        ch.hinglishTitle,
        ch.tagline,
        ch.hinglishTagline,
        ch.roadmapPhase,
        ch.part,
        ...ch.sections.map((s) => `${s.heading} ${s.englishBody} ${s.hinglishBody}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery, levelFilter]);

  const groupedChapters = useMemo(() => {
    return PART_ORDER.map((part) => ({
      part,
      chapters: filteredChapters.filter((ch) => ch.part === part),
    })).filter((g) => g.chapters.length > 0);
  }, [filteredChapters]);

  const activeCode =
    editableCodeMap[activeChapter.id] ?? activeChapter.codeExample;

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setPythonOutput('');
    setPythonError('');
    setRuntimeStatus('');
    setShowMobileToc(false);
  };

  const toggleReadChapter = (chapterId: string) => {
    setReadChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleResetCode = () => {
    setEditableCodeMap((prev) => {
      const next = { ...prev };
      delete next[activeChapter.id];
      return next;
    });
    setPythonOutput('');
    setPythonError('');
  };

  const handleRunPython = async () => {
    setIsRunningPython(true);
    setPythonError('');
    setPythonOutput('');
    setRuntimeStatus(
      activeChapter.needsNumpy
        ? isHinglish
          ? 'Python + NumPy engine load ho raha hai...'
          : 'Loading Python + NumPy runtime...'
        : isHinglish
        ? 'Python runtime initialize ho raha hai...'
        : 'Initializing in-browser Python...'
    );

    try {
      const pyodide = await ensurePyodideScriptLoaded();
      if (activeChapter.needsNumpy) {
        setRuntimeStatus(
          isHinglish ? 'NumPy package load ho raha hai...' : 'Loading NumPy package...'
        );
        await pyodide.loadPackage('numpy');
      }

      setRuntimeStatus(isHinglish ? 'Code execute ho raha hai...' : 'Running snippet...');

      const capturedStdout: string[] = [];
      const capturedStderr: string[] = [];

      pyodide.setStdout({
        batched: (msg: string) => capturedStdout.push(msg),
      });
      pyodide.setStderr({
        batched: (msg: string) => capturedStderr.push(msg),
      });

      await pyodide.runPythonAsync(activeCode);

      const outText = capturedStdout.join('\n').trim();
      const errText = capturedStderr.join('\n').trim();
      setPythonOutput(
        outText ||
          (isHinglish
            ? '(Code bina errors ke run hua; koi print output nahi tha.)'
            : '(Executed cleanly with no stdout output.)')
      );
      if (errText) {
        setPythonError(errText);
      }
      setRuntimeStatus('');
    } catch (err: any) {
      setPythonError(err?.message || String(err));
      setRuntimeStatus('');
    } finally {
      setIsRunningPython(false);
    }
  };

  const formatChapterMarkdown = (ch: BookChapter, lang: Language): string => {
    const useHinglish = lang === 'hinglish';
    const lines: string[] = [];
    lines.push(`# Chapter ${ch.number}: ${useHinglish ? ch.hinglishTitle : ch.title}`);
    lines.push(
      `> ${ch.part} · Level: ${ch.level} · ${ch.roadmapPhase} · ~${ch.estMinutes} min`
    );
    lines.push('');
    lines.push(useHinglish ? ch.hinglishTagline : ch.tagline);
    lines.push('');
    ch.sections.forEach((sec) => {
      lines.push(`## ${sec.heading}`);
      lines.push(useHinglish ? sec.hinglishBody : sec.englishBody);
      lines.push('');
    });
    lines.push(`## Code Lab: ${ch.codeTitle}`);
    lines.push('```python');
    lines.push(ch.codeExample);
    lines.push('```');
    lines.push('');
    lines.push(`### Common Pitfall`);
    lines.push(useHinglish ? ch.pitfallHinglish : ch.pitfallEnglish);
    lines.push('');
    lines.push(`### Practice Exercise`);
    lines.push(useHinglish ? ch.exerciseHinglish : ch.exerciseEnglish);
    lines.push('');
    if (ch.interviewQAs.length > 0) {
      lines.push(`### Interview Preparation Q&A`);
      ch.interviewQAs.forEach((qa, i) => {
        lines.push(`**Q${i + 1}: ${qa.question}**`);
        lines.push(useHinglish ? qa.hinglishAnswer : qa.englishAnswer);
        lines.push('');
      });
    }
    return lines.join('\n');
  };

  const triggerDownload = (content: string, filename: string, mime = 'text/markdown') => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentChapterMd = () => {
    const md = formatChapterMarkdown(activeChapter, bookLang);
    triggerDownload(
      md,
      `TensorPlay-Book-Ch${String(activeChapter.number).padStart(2, '0')}-${bookLang}.md`
    );
    setExportNotice(
      isHinglish
        ? `Chapter ${activeChapter.number} Markdown download ho gaya.`
        : `Downloaded Chapter ${activeChapter.number} as Markdown.`
    );
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportFullBookMd = () => {
    const header = [
      `# Complete Python & AI Engineering Book (${isHinglish ? 'Hinglish' : 'English'} Edition)`,
      `Generated from TensorPlay AI · Covers Beginner to Advanced Python + Roadmap Phases 0–8 + Interview Prep`,
      '',
      '---',
      '',
    ].join('\n');
    const body = PYTHON_AI_BOOK_CHAPTERS.map((ch) =>
      formatChapterMarkdown(ch, bookLang)
    ).join('\n\n---\n\n');
    triggerDownload(
      header + body,
      `Complete-Python-and-AI-Engineering-Book-${bookLang}.md`
    );
    setExportNotice(
      isHinglish
        ? 'Poori 12-chapter book (.md) download ho gayi!'
        : 'Complete 12-chapter book downloaded as Markdown!'
    );
    setTimeout(() => setExportNotice(null), 3200);
  };

  const handleExportFullBookPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeWrapped = (
      text: string,
      fontSize: number,
      fontStyle: 'normal' | 'bold' = 'normal',
      color: [number, number, number] = [30, 41, 59],
      lineHeightFactor = 1.4
    ) => {
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const safeText = text.replace(/[^\x20-\x7E\n]/g, ' ');
      const lines = doc.splitTextToSize(safeText, maxWidth) as string[];
      const lineStep = fontSize * lineHeightFactor;
      lines.forEach((line) => {
        ensureSpace(lineStep + 4);
        doc.text(line, margin, y);
        y += lineStep;
      });
    };

    // Cover Title
    writeWrapped(
      'Complete Python & AI Engineering Handbook',
      20,
      'bold',
      [49, 46, 129],
      1.3
    );
    y += 6;
    writeWrapped(
      `${isHinglish ? 'Hinglish' : 'English'} Edition · Beginner Python to Frontier AI, LLMs, RAG, Agents & Interview Prep`,
      11,
      'normal',
      [71, 85, 105]
    );
    y += 14;

    PYTHON_AI_BOOK_CHAPTERS.forEach((ch, idx) => {
      if (idx > 0) {
        doc.addPage();
        y = margin;
      }
      writeWrapped(
        `${ch.part}  |  ${ch.level}  |  ${ch.roadmapPhase}`,
        9,
        'bold',
        [99, 102, 241]
      );
      y += 4;
      writeWrapped(
        `Chapter ${ch.number}: ${isHinglish ? ch.hinglishTitle : ch.title}`,
        15,
        'bold',
        [15, 23, 42],
        1.3
      );
      y += 4;
      writeWrapped(
        isHinglish ? ch.hinglishTagline : ch.tagline,
        10.5,
        'normal',
        [71, 85, 105]
      );
      y += 10;

      ch.sections.forEach((sec) => {
        writeWrapped(sec.heading, 12, 'bold', [30, 41, 59]);
        y += 2;
        writeWrapped(
          isHinglish ? sec.hinglishBody : sec.englishBody,
          10,
          'normal',
          [51, 65, 85]
        );
        y += 8;
      });

      writeWrapped(`Code Example: ${ch.codeTitle}`, 11, 'bold', [15, 23, 42]);
      y += 3;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const codeLines = ch.codeExample.split('\n');
      codeLines.forEach((cLine) => {
        const cleanLine = cLine.replace(/[^\x20-\x7E]/g, ' ');
        const wrapped = doc.splitTextToSize(cleanLine || ' ', maxWidth - 12) as string[];
        wrapped.forEach((wl) => {
          ensureSpace(12);
          doc.text(wl, margin + 8, y);
          y += 11.5;
        });
      });
      y += 8;

      writeWrapped('Common Pitfall:', 10.5, 'bold', [180, 83, 9]);
      writeWrapped(
        isHinglish ? ch.pitfallHinglish : ch.pitfallEnglish,
        10,
        'normal',
        [51, 65, 85]
      );
      y += 6;

      writeWrapped('Hands-On Exercise:', 10.5, 'bold', [5, 150, 105]);
      writeWrapped(
        isHinglish ? ch.exerciseHinglish : ch.exerciseEnglish,
        10,
        'normal',
        [51, 65, 85]
      );
      y += 8;

      if (ch.interviewQAs.length > 0) {
        writeWrapped('Interview Q&A:', 11, 'bold', [49, 46, 129]);
        y += 3;
        ch.interviewQAs.forEach((qa, qi) => {
          writeWrapped(`Q${qi + 1}: ${qa.question}`, 10, 'bold', [15, 23, 42]);
          writeWrapped(
            isHinglish ? qa.hinglishAnswer : qa.englishAnswer,
            9.8,
            'normal',
            [51, 65, 85]
          );
          y += 5;
        });
      }
    });

    doc.save(`Complete-Python-and-AI-Engineering-Book-${bookLang}.pdf`);
    setExportNotice(
      isHinglish
        ? 'Complete 12-chapter PDF book export ho gayi!'
        : 'Complete 12-chapter PDF book exported!'
    );
    setTimeout(() => setExportNotice(null), 3200);
  };

  const toggleAllCurrentQAs = () => {
    const allOpen = activeChapter.interviewQAs.every(
      (_, i) => revealedQAs[`${activeChapter.id}-${i}`]
    );
    const next = { ...revealedQAs };
    activeChapter.interviewQAs.forEach((_, i) => {
      next[`${activeChapter.id}-${i}`] = !allOpen;
    });
    setRevealedQAs(next);
  };

  const completedCount = readChapterIds.length;
  const totalChapters = PYTHON_AI_BOOK_CHAPTERS.length;
  const completionPct = Math.round((completedCount / totalChapters) * 100);
  const isCurrentChapterRead = readChapterIds.includes(activeChapter.id);

  return (
    <div className="space-y-6">
      {/* Top Book Header Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider">
                Interactive Book Edition
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">12 Chapters</span>
              <span aria-hidden="true">·</span>
              <span>Beginner → Advanced Python + Roadmap Phases 0–8</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isHinglish
                ? 'Complete Python & AI Engineering Book (Hinglish)'
                : 'Complete Python & AI Engineering Book'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
              {isHinglish
                ? 'Zero se Advanced Python, Linear Algebra, ML, Autograd, Transformers, LLM Finetuning, RAG, AI Agents, LLMOps aur Interview Prep — har chapter mein live executable Python code aur interview Q&A ke saath.'
                : 'Chapter-by-chapter handbook covering Python from scratch to async/internals, every AI Engineering Roadmap phase (0–8), runnable in-browser Python labs, and real interview preparation.'}
            </p>
          </div>

          {/* Language Style Switcher + Export Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5"
              role="group"
              aria-label="Book reading language style"
            >
              <button
                type="button"
                onClick={() => setBookLang('english')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  bookLang === 'english'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setBookLang('hinglish')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  bookLang === 'hinglish'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hinglish
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCurrentChapterMd}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Download active chapter as Markdown"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chapter .MD</span>
            </button>

            <button
              type="button"
              onClick={handleExportFullBookMd}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Download all 12 chapters as a single Markdown book"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Book .MD</span>
            </button>

            <button
              type="button"
              onClick={handleExportFullBookPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
              title="Generate and download complete 12-chapter PDF book"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Book</span>
            </button>
          </div>
        </div>

        {/* Reading Progress Bar + Mobile TOC Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
              {completedCount}/{totalChapters}{' '}
              {isHinglish ? 'chapters padhe gaye' : 'chapters completed'} ({completionPct}%)
            </span>
            <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {exportNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {exportNotice}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowMobileToc((prev) => !prev)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ListTree className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {showMobileToc
                  ? isHinglish
                    ? 'Chapters Chhupayein'
                    : 'Hide Chapters'
                  : isHinglish
                  ? 'Chapters List'
                  : 'Browse Chapters'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Chapter Index + Right Chapter Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table of Contents Sidebar */}
        <aside
          className={`lg:col-span-4 xl:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 space-y-4 lg:sticky lg:top-20 ${
            showMobileToc ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isHinglish
                  ? 'Chapter ya topic search karein...'
                  : 'Search chapters or topics...'
              }
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Level Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {LEVEL_FILTERS.map((lvl) => {
              const active = levelFilter === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Grouped Chapters List */}
          <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {groupedChapters.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                {isHinglish
                  ? 'Koi chapter match nahi hua.'
                  : 'No chapters match your filter.'}
              </p>
            ) : (
              groupedChapters.map((group) => (
                <div key={group.part} className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {group.part}
                  </div>
                  <div className="space-y-1">
                    {group.chapters.map((ch) => {
                      const isSelected = ch.id === activeChapter.id;
                      const isDone = readChapterIds.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleSelectChapter(ch.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100'
                              : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <span
                            className={`text-[11px] font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 tabular-nums mt-0.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : isDone
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isDone && !isSelected ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              String(ch.number).padStart(2, '0')
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold leading-snug line-clamp-2">
                              {isHinglish ? ch.hinglishTitle : ch.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {ch.level} · {ch.estMinutes}m
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Active Chapter Reading Pane */}
        <article className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Chapter Hero & Metadata */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {activeChapter.part}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {activeChapter.level}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeChapter.roadmapPhase}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />~{activeChapter.estMinutes} min
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleReadChapter(activeChapter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  isCurrentChapterRead
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isCurrentChapterRead
                    ? isHinglish
                      ? 'Completed'
                      : 'Marked Read'
                    : isHinglish
                    ? 'Chapter Complete Mark Karein'
                    : 'Mark Chapter Read'}
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 tabular-nums">
                Chapter {String(activeChapter.number).padStart(2, '0')} of {totalChapters}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {isHinglish ? activeChapter.hinglishTitle : activeChapter.title}
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {isHinglish ? activeChapter.hinglishTagline : activeChapter.tagline}
              </p>
            </div>

            {/* Chapter Sections */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-6">
              {activeChapter.sections.map((section, idx) => (
                <section key={idx} className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {section.heading}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    {isHinglish ? section.hinglishBody : section.englishBody}
                  </p>
                </section>
              ))}
            </div>
          </div>

          {/* Interactive In-Browser Python Code Lab */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 truncate">
                  {activeChapter.codeTitle}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                  · {activeChapter.needsNumpy ? 'Python + NumPy' : 'Python 3.12 (Browser)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Reset snippet to original chapter code"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunPython}
                  disabled={isRunningPython}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {isRunningPython
                      ? isHinglish
                        ? 'Running...'
                        : 'Running...'
                      : isHinglish
                      ? 'Run Python'
                      : 'Run Python'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950">
              <textarea
                value={activeCode}
                onChange={(e) =>
                  setEditableCodeMap((prev) => ({
                    ...prev,
                    [activeChapter.id]: e.target.value,
                  }))
                }
                spellCheck={false}
                rows={Math.min(18, Math.max(9, activeCode.split('\n').length + 1))}
                aria-label="Chapter Python code editor"
                className="w-full bg-transparent text-xs sm:text-[13px] font-mono text-slate-100 leading-relaxed focus:outline-none resize-y"
              />
            </div>

            {(runtimeStatus || pythonOutput || pythonError) && (
              <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/95 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    {runtimeStatus || 'Console Output'}
                  </span>
                </div>
                {pythonOutput && (
                  <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed overflow-x-auto">
                    {pythonOutput}
                  </pre>
                )}
                {pythonError && (
                  <pre className="whitespace-pre-wrap text-rose-400 leading-relaxed overflow-x-auto">
                    {pythonError}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Pitfall & Practice Exercise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/85 dark:bg-amber-950/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>{isHinglish ? 'Common Mistake / Trap' : 'Common Pitfall'}</span>
              </div>
              <p className="text-sm text-amber-950 dark:text-amber-100/90 leading-relaxed">
                {isHinglish
                  ? activeChapter.pitfallHinglish
                  : activeChapter.pitfallEnglish}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/85 dark:bg-emerald-950/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <Wrench className="w-4 h-4" />
                <span>{isHinglish ? 'Try This Exercise' : 'Hands-On Exercise'}</span>
              </div>
              <p className="text-sm text-emerald-950 dark:text-emerald-100/90 leading-relaxed">
                {isHinglish
                  ? activeChapter.exerciseHinglish
                  : activeChapter.exerciseEnglish}
              </p>
            </div>
          </div>

          {/* Interview Preparation Q&A Section */}
          {activeChapter.interviewQAs.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {isHinglish
                      ? 'Interview Prep: Active Recall Q&A'
                      : 'Interview Preparation Q&A'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={toggleAllCurrentQAs}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {activeChapter.interviewQAs.every(
                    (_, i) => revealedQAs[`${activeChapter.id}-${i}`]
                  )
                    ? isHinglish
                      ? 'Sab Answers Chhupayein'
                      : 'Hide All Answers'
                    : isHinglish
                    ? 'Sab Answers Dikhayein'
                    : 'Reveal All Answers'}
                </button>
              </div>

              <div className="space-y-2.5">
                {activeChapter.interviewQAs.map((qa, idx) => {
                  const key = `${activeChapter.id}-${idx}`;
                  const isOpen = Boolean(revealedQAs[key]);
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedQAs((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Q{idx + 1}. {qa.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/80">
                          {isHinglish ? qa.hinglishAnswer : qa.englishAnswer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chapter Navigation + Quick Cross-Links */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={activeIndex <= 0}
              onClick={() => {
                if (activeIndex > 0) {
                  handleSelectChapter(PYTHON_AI_BOOK_CHAPTERS[activeIndex - 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>
                {activeIndex > 0
                  ? `Ch ${PYTHON_AI_BOOK_CHAPTERS[activeIndex - 1].number}`
                  : isHinglish
                  ? 'Start'
                  : 'Start'}
              </span>
            </button>

            {onNavigateTab && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onNavigateTab('roadmap')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Roadmap</span>
                </button>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('dataset-lab')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Practice in Dataset Lab</span>
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={activeIndex >= totalChapters - 1}
              onClick={() => {
                if (!isCurrentChapterRead) {
                  toggleReadChapter(activeChapter.id);
                }
                if (activeIndex < totalChapters - 1) {
                  handleSelectChapter(PYTHON_AI_BOOK_CHAPTERS[activeIndex + 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span>
                {activeIndex < totalChapters - 1
                  ? isHinglish
                    ? `Complete & Next: Ch ${PYTHON_AI_BOOK_CHAPTERS[activeIndex + 1].number}`
                    : `Complete & Next: Ch ${PYTHON_AI_BOOK_CHAPTERS[activeIndex + 1].number}`
                  : isHinglish
                  ? 'Book Completed!'
                  : 'Final Chapter'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
