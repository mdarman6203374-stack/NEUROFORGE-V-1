import React, { useEffect, useState } from 'react';
import {
  Bug,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { Language } from '../types';
import { TENSOR_BUG_PUZZLES } from '../data/codingLabsData';

interface TensorBugSpotterProps {
  language: Language;
}

export const TensorBugSpotter: React.FC<TensorBugSpotterProps> = ({ language }) => {
  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [clickedLine, setClickedLine] = useState<number | null>(null);
  const [selectedFixIdx, setSelectedFixIdx] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const puzzle = TENSOR_BUG_PUZZLES[puzzleIdx];
  const lineMatched = clickedLine === puzzle.buggyLineNumber;
  const solved = lineMatched && selectedFixIdx !== null && puzzle.fixOptions[selectedFixIdx]?.isCorrect;

  useEffect(() => {
    if (!isActive || solved) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isActive, solved]);

  const handleLineClick = (lineNo: number) => {
    if (!isActive && secondsLeft === 60) {
      setIsActive(true);
    }
    setClickedLine(lineNo);
    setSelectedFixIdx(null);
  };

  const handlePickFix = (optIdx: number) => {
    setSelectedFixIdx(optIdx);
    const chosen = puzzle.fixOptions[optIdx];
    if (chosen?.isCorrect) {
      setIsActive(false);
      setScore((s) => s + 10 + Math.floor(secondsLeft / 4));
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }
  };

  const loadPuzzle = (nextIdx: number) => {
    setPuzzleIdx(nextIdx);
    setClickedLine(null);
    setSelectedFixIdx(null);
    setSecondsLeft(60);
    setIsActive(true);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
            <Bug className="w-4 h-4" />
            <span>60-SECOND TENSOR SHAPE & BUG SPOTTER</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Puzzle {puzzleIdx + 1}/{TENSOR_BUG_PUZZLES.length}: {puzzle.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} pts · {streak}x</span>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono text-sm font-extrabold tabular-nums flex items-center gap-1.5 ${
              secondsLeft <= 15 && isActive
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-600 dark:text-rose-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>00:{String(secondsLeft).padStart(2, '0')}</span>
          </div>
          {!isActive && !solved && (
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              title="Start 60s countdown"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Shape Context & Difficulty */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
        <span className="font-mono text-slate-700 dark:text-slate-200">
          <strong>Shapes:</strong> {puzzle.shapeContext}
        </span>
        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-semibold text-[11px]">
          {puzzle.category} · {puzzle.difficulty}
        </span>
      </div>

      {/* Step 1: Click the Broken Line */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Step 1: Click the exact buggy line in the PyTorch / ML snippet below:
        </div>

        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden divide-y divide-slate-900">
          {puzzle.codeLines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isClicked = clickedLine === lineNum;
            const isBuggy = lineNum === puzzle.buggyLineNumber;

            let rowClass = 'hover:bg-slate-900/90 text-slate-200';
            if (isClicked && isBuggy) {
              rowClass = 'bg-emerald-950/70 text-emerald-200 border-l-4 border-emerald-500';
            } else if (isClicked && !isBuggy) {
              rowClass = 'bg-rose-950/60 text-rose-200 border-l-4 border-rose-500';
            }

            return (
              <button
                key={lineNum}
                type="button"
                onClick={() => handleLineClick(lineNum)}
                className={`w-full text-left px-3.5 py-2.5 font-mono text-xs flex items-center gap-3 transition-colors cursor-pointer ${rowClass}`}
              >
                <span className="w-5 text-slate-500 select-none text-right tabular-nums">
                  {lineNum}
                </span>
                <span className="flex-1 whitespace-pre">{lineText}</span>
                {isClicked && (
                  <span className="text-[10px] font-bold shrink-0">
                    {isBuggy ? 'BUG FOUND!' : 'NOT THIS LINE'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Pick Fix */}
      {lineMatched && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
          <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            Step 2: Bug spotted on Line {puzzle.buggyLineNumber}! Choose the clean production fix:
          </div>

          <div className="space-y-2">
            {puzzle.fixOptions.map((opt, idx) => {
              const picked = selectedFixIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickFix(idx)}
                  className={`w-full text-left p-3 rounded-xl border font-mono text-xs transition-all cursor-pointer space-y-1.5 ${
                    picked
                      ? opt.isCorrect
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-500'
                        : 'bg-rose-950 text-rose-200 border-rose-500'
                      : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <pre className="whitespace-pre-wrap leading-relaxed">{opt.code}</pre>
                    {picked &&
                      (opt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ))}
                  </div>
                  {picked && (
                    <div className="text-[11px] font-sans opacity-90 pt-1 border-t border-white/10">
                      {opt.reason}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation after solving or timeout */}
      {(solved || secondsLeft === 0) && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-white">
            Root-Cause Breakdown (Line {puzzle.buggyLineNumber}):
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {language === 'hinglish' ? puzzle.hinglishExplanation : puzzle.bugExplanation}
          </p>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => loadPuzzle(puzzleIdx)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Puzzle</span>
        </button>

        <button
          type="button"
          onClick={() => loadPuzzle((puzzleIdx + 1) % TENSOR_BUG_PUZZLES.length)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
        >
          <span>Next Bug Puzzle</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
