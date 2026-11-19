import React, { useEffect, useState } from 'react';
import {
  Brain,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  Eye,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Mic
} from 'lucide-react';
import { Language } from '../types';
import {
  SRSCard,
  SRSRating,
  syncCompletedConceptsToSrs,
  isCardDueToday,
  reviewSrsCard,
  previewNextIntervalDays,
  getWarmupCompletedToday,
  markWarmupCompletedToday
} from '../utils/spacedRepetition';

interface MorningWarmupWidgetProps {
  completedConcepts: string[];
  language: Language;
  onOpenMemoryLab?: (subTab?: 'srs' | 'feynman') => void;
}

export const MorningWarmupWidget: React.FC<MorningWarmupWidgetProps> = ({
  completedConcepts,
  language,
  onOpenMemoryLab
}) => {
  const [cards, setCards] = useState<SRSCard[]>(() =>
    syncCompletedConceptsToSrs(completedConcepts)
  );
  const [isWarmupOpen, setIsWarmupOpen] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [reviewedThisSession, setReviewedThisSession] = useState<number>(0);
  const [warmupSecondsLeft, setWarmupSecondsLeft] = useState<number>(180);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [doneToday, setDoneToday] = useState<boolean>(() => getWarmupCompletedToday());

  // Sync whenever completedConcepts changes
  useEffect(() => {
    const synced = syncCompletedConceptsToSrs(completedConcepts);
    setCards(synced);
  }, [completedConcepts]);

  // Listen for weak quiz updates from ConceptQuickQuizModal via custom window event
  useEffect(() => {
    const refresh = () => {
      setCards(syncCompletedConceptsToSrs(completedConcepts));
    };
    window.addEventListener('neuroforge-srs-updated', refresh);
    return () => window.removeEventListener('neuroforge-srs-updated', refresh);
  }, [completedConcepts]);

  useEffect(() => {
    if (!isTimerActive) return;
    const t = setInterval(() => {
      setWarmupSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isTimerActive]);

  const dueCards = cards.filter(isCardDueToday);
  const weakCount = dueCards.filter((c) => c.source === 'weak-quiz').length;
  const milestoneCount = dueCards.length - weakCount;
  const activeCard = dueCards[0] || null;

  const handleStartWarmup = () => {
    setIsWarmupOpen(true);
    setIsFlipped(false);
    setIsTimerActive(true);
  };

  const handleRate = (rating: SRSRating) => {
    if (!activeCard) return;
    const nextCards = reviewSrsCard(activeCard.id, rating);
    setCards(nextCards);
    setIsFlipped(false);
    const nextReviewed = reviewedThisSession + 1;
    setReviewedThisSession(nextReviewed);

    const remainingDue = nextCards.filter(isCardDueToday).length;
    if (remainingDue === 0) {
      setIsTimerActive(false);
      markWarmupCompletedToday();
      setDoneToday(true);
    }
  };

  const mm = String(Math.floor(warmupSecondsLeft / 60)).padStart(2, '0');
  const ss = String(warmupSecondsLeft % 60).padStart(2, '0');

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                3-Minute Morning Warmup · Spaced Repetition
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                3d · 7d · 21d · 60d
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dueCards.length > 0
                ? language === 'hinglish'
                  ? `Aaj ${dueCards.length} recall cards due hain (${milestoneCount} concept reviews, ${weakCount} weak quiz questions).`
                  : `${dueCards.length} review prompt${dueCards.length === 1 ? '' : 's'} queued today (${milestoneCount} milestone recalls, ${weakCount} missed quiz spots).`
                : doneToday || reviewedThisSession > 0
                ? 'All due reviews cleared for today! Your long-term retention schedule is on track.'
                : 'No overdue flashcards right now — check your upcoming 3/7/21/60-day queue or try Feynman 60s explainer.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {dueCards.length > 0 && !isWarmupOpen && (
            <button
              type="button"
              onClick={handleStartWarmup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start 3-Min Warmup ({dueCards.length})</span>
            </button>
          )}
          {onOpenMemoryLab && (
            <button
              type="button"
              onClick={() => onOpenMemoryLab('feynman')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-500" />
              <span>Feynman 60s</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Interactive Morning Warmup Card */}
      {isWarmupOpen && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {mm}:{ss}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {dueCards.length} left · {reviewedThisSession} done
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWarmupSecondsLeft(180);
                  setIsTimerActive(true);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Reset 3-min countdown"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWarmupOpen(false);
                  setIsTimerActive(false);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Hide
              </button>
            </div>
          </div>

          {activeCard ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                    activeCard.source === 'weak-quiz'
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                      : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300'
                  }`}
                >
                  {activeCard.source === 'weak-quiz' ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>WEAK QUIZ SPOT</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>DAY-{activeCard.milestoneStage} RETENTION CHECK</span>
                    </>
                  )}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Phase {activeCard.phaseNumber} · {activeCard.conceptTitle}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {activeCard.prompt}
                </p>

                {isFlipped ? (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Core Intuition & Answer:
                    </div>
                    <p className="whitespace-pre-line">{activeCard.answer}</p>
                    {language === 'hinglish' && activeCard.hinglishAnswer && (
                      <p className="p-2 rounded bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                        <span className="font-semibold">Hinglish Recap: </span>
                        {activeCard.hinglishAnswer}
                      </p>
                    )}

                    {/* SM-2 Rating Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2">
                      {(
                        [
                          { id: 'again', label: 'Again', cls: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
                          { id: 'hard', label: 'Hard', cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
                          { id: 'good', label: 'Good', cls: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
                          { id: 'easy', label: 'Easy', cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' }
                        ] as const
                      ).map((btn) => {
                        const days = previewNextIntervalDays(activeCard, btn.id);
                        return (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleRate(btn.id)}
                            className={`py-1.5 px-2 rounded-lg border text-center transition-opacity hover:opacity-90 cursor-pointer ${btn.cls}`}
                          >
                            <div className="text-[11px] font-bold">{btn.label}</div>
                            <div className="text-[10px] font-mono opacity-80">{days}d</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal Answer & Grade Recall</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Warmup complete! Ready to tackle today’s main study block.</span>
              </div>
              {onOpenMemoryLab && (
                <button
                  type="button"
                  onClick={() => onOpenMemoryLab('srs')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer shrink-0"
                >
                  <span>Inspect Full Deck</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
