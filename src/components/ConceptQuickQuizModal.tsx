import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Brain,
  AlertCircle
} from 'lucide-react';
import { Language } from '../types';

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedQuizPayload {
  conceptId: string;
  conceptTitle: string;
  phaseNumber: number;
  phaseTitle: string;
  modelUsed: string;
  questions: QuizQuestionItem[];
}

interface ConceptQuickQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptId: string | null;
  conceptTitle: string;
  language: Language;
  isConceptCompleted: boolean;
  onMarkConceptCompleted?: (id: string) => void;
}

export const ConceptQuickQuizModal: React.FC<ConceptQuickQuizModalProps> = ({
  isOpen,
  onClose,
  conceptId,
  conceptTitle,
  language,
  isConceptCompleted,
  onMarkConceptCompleted
}) => {
  const [quizData, setQuizData] = useState<GeneratedQuizPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadQuiz = async (targetConceptId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedAnswers({});
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: targetConceptId,
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate quiz questions.');
      }
      setQuizData(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to connect to Gemini Quick Quiz generator.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && conceptId) {
      setQuizData(null);
      loadQuiz(conceptId);
    }
  }, [isOpen, conceptId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !conceptId) return null;

  const questions = quizData?.questions || [];
  const answeredCount = questions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const scorePercent =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick Quiz for ${conceptTitle}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 my-6">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                <span>Quick Quiz</span>
                <span aria-hidden="true">·</span>
                <span>{conceptId.toUpperCase()}</span>
                {quizData?.modelUsed && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal lowercase">
                      {quizData.modelUsed}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                {quizData?.conceptTitle || conceptTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {questions.length > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                {correctCount}/{questions.length}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Quick Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quiz Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-10 space-y-5">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Generating 5 multiple-choice questions...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Crafting conceptual and practical questions for{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {conceptTitle}
                  </span>
                </p>
              </div>

              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="h-3.5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                      <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 text-center space-y-3">
              <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Could not generate Quick Quiz
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto leading-relaxed">
                  {errorMsg}
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadQuiz(conceptId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Quiz</span>
              </button>
            </div>
          ) : (
            <>
              {/* Score Banner when all 5 questions are answered */}
              {allAnswered && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Quiz Completed · {scorePercent}% Score
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      You answered {correctCount} of {questions.length} correctly.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isConceptCompleted && onMarkConceptCompleted && correctCount >= 3 && (
                      <button
                        type="button"
                        onClick={() => onMarkConceptCompleted(conceptId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Concept Mastered</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => loadQuiz(conceptId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>New 5 Questions</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 5 Multiple-Choice Questions */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => {
                  const chosen = selectedAnswers[q.id];
                  const isAnswered = chosen !== undefined;
                  const isRight = isAnswered && chosen === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-2 tabular-nums">
                            Q{qIdx + 1}.
                          </span>
                          {q.question}
                        </h3>

                        {isAnswered && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${
                              isRight
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isRight ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Correct</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Incorrect</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isSelectedOpt = chosen === optIdx;
                          const isCorrectOpt = optIdx === q.correctIndex;

                          let btnClasses =
                            'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600';

                          if (isAnswered) {
                            if (isCorrectOpt) {
                              btnClasses =
                                'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold';
                            } else if (isSelectedOpt && !isCorrectOpt) {
                              btnClasses =
                                'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200';
                            } else {
                              btnClasses =
                                'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 text-slate-400 dark:text-slate-500';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isAnswered}
                              onClick={() =>
                                setSelectedAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: optIdx
                                }))
                              }
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-[13px] transition-colors flex items-start gap-2.5 ${
                                isAnswered ? 'cursor-default' : 'cursor-pointer'
                              } ${btnClasses}`}
                            >
                              <span className="font-mono font-bold text-[11px] mt-0.5 shrink-0">
                                {letter}.
                              </span>
                              <span className="flex-1 leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Explanation:{' '}
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Answered: {answeredCount}/{questions.length || 5}
          </span>
          <div className="flex items-center gap-2">
            {!isLoading && questions.length > 0 && (
              <button
                type="button"
                onClick={() => loadQuiz(conceptId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
