import React, { useState, useEffect, useRef } from 'react';
import { NotebookPen, Trash2, Copy, Check, RotateCcw, FileDown } from 'lucide-react';
import { Language } from '../types';

interface StudyScratchpadProps {
  dayNumber: number;
  dayTitle: string;
  language: Language;
  onExportReportPdf?: () => void;
}

const getScratchpadStorageKey = (dayNumber: number) =>
  `ai_mastery_scratchpad_day_${dayNumber}`;

const readScratchpadNote = (dayNumber: number): string => {
  try {
    return localStorage.getItem(getScratchpadStorageKey(dayNumber)) || '';
  } catch {
    return '';
  }
};

export const StudyScratchpad: React.FC<StudyScratchpadProps> = ({
  dayNumber,
  dayTitle,
  language,
  onExportReportPdf
}) => {
  const [note, setNote] = useState<string>(() => readScratchpadNote(dayNumber));
  const [copied, setCopied] = useState<boolean>(false);
  const [savedLabel, setSavedLabel] = useState<boolean>(false);
  const [clearedBackup, setClearedBackup] = useState<{ day: number; text: string } | null>(null);
  const savedTimerRef = useRef<number | null>(null);

  // Sync note whenever the active study day changes in the planner
  useEffect(() => {
    setNote(readScratchpadNote(dayNumber));
    setSavedLabel(false);
    setCopied(false);
    setClearedBackup(null);
  }, [dayNumber]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const persistNote = (targetDay: number, value: string) => {
    try {
      const key = getScratchpadStorageKey(targetDay);
      if (value.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore quota / private browsing storage restrictions gracefully
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setNote(nextValue);
    setClearedBackup(null);
    persistNote(dayNumber, nextValue);

    setSavedLabel(true);
    if (savedTimerRef.current) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => {
      setSavedLabel(false);
    }, 1500);
  };

  const handleClear = () => {
    if (!note) return;
    setClearedBackup({ day: dayNumber, text: note });
    setNote('');
    persistNote(dayNumber, '');
  };

  const handleUndoClear = () => {
    if (!clearedBackup || clearedBackup.day !== dayNumber) return;
    setNote(clearedBackup.text);
    persistNote(dayNumber, clearedBackup.text);
    setClearedBackup(null);
  };

  const handleCopy = async () => {
    if (!note.trim()) return;
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback ignored cleanly if clipboard permission is unavailable
    }
  };

  const trimmed = note.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = note.length;

  return (
    <section
      aria-label={`Study Scratchpad for Day ${dayNumber}`}
      className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
    >
      {/* Scratchpad Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <NotebookPen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Study Scratchpad
              </h3>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                Day {dayNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {dayTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {savedLabel && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mr-1">
              Saved
            </span>
          )}

          {onExportReportPdf && (
            <button
              type="button"
              onClick={onExportReportPdf}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-colors cursor-pointer"
              title="Export study progress and all daily notes as a formatted PDF report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Report PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!trimmed}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Copy Day notes"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!note}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={`Clear notes for Day ${dayNumber}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Inline Undo Clear Prompt */}
      {clearedBackup && clearedBackup.day === dayNumber && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-300">
          <span>
            {language === 'hinglish'
              ? `Day ${dayNumber} ke notes clear ho gaye.`
              : `Cleared notes for Day ${dayNumber}.`}
          </span>
          <button
            type="button"
            onClick={handleUndoClear}
            className="inline-flex items-center gap-1 font-semibold underline hover:no-underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={note}
        onChange={handleChange}
        rows={5}
        placeholder={
          language === 'hinglish'
            ? `Day ${dayNumber} ke key points, formulas, code snippets ya doubts yahan likhein... (auto-saved in browser)`
            : `Jot down key takeaways, math derivations, code snippets, or questions for Day ${dayNumber}... (auto-saved locally)`
        }
        aria-label={`Notes for Day ${dayNumber}`}
        className="w-full min-h-[130px] p-3.5 text-xs sm:text-sm leading-relaxed rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 resize-y transition-colors"
      />

      {/* Footer Metadata */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {language === 'hinglish'
            ? `Sirf Day ${dayNumber} ke liye browser mein auto-save hota hai`
            : `Auto-saved per study day in browser storage`}
        </span>
        <span className="font-mono tabular-nums">
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
        </span>
      </div>
    </section>
  );
};
