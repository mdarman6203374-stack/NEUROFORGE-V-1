import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Lightbulb,
  CornerDownRight
} from 'lucide-react';
import { Language } from '../types';
import { ROADMAP_PHASES } from '../data/roadmapData';

interface MockAiInterviewerProps {
  completedConcepts: string[];
  language: Language;
}

interface InterviewPrompt {
  question: string;
  focusConceptId: string;
  focusConceptTitle: string;
  constraints: string[];
  hint: string;
}

interface InterviewEval {
  depthScore: number;
  edgeCasesScore: number;
  clarityScore: number;
  overallVerdict: string;
  strongPoints: string[];
  missedPoints: string[];
  followUpQuestion: string;
  modelOutline: string;
}

export const MockAiInterviewer: React.FC<MockAiInterviewerProps> = ({
  completedConcepts,
  language
}) => {
  const [roleTarget, setRoleTarget] = useState<string>('AI / LLM Systems Engineer');
  const [mode, setMode] = useState<'system-design' | 'technical'>('system-design');
  const [focusConceptId, setFocusConceptId] = useState<string>('auto');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<InterviewPrompt | null>(null);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);

  const [answerText, setAnswerText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEval | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);

  const unlockedConceptDetails = useMemo(() => {
    const unlockedSet = new Set(completedConcepts);
    return ROADMAP_PHASES.flatMap((phase) =>
      phase.concepts
        .filter((c) => unlockedSet.has(c.id))
        .map((c) => ({
          id: c.id,
          title: c.title,
          phaseNumber: phase.phaseNumber
        }))
    );
  }, [completedConcepts]);

  const handleGenerateQuestion = async () => {
    setIsAsking(true);
    setAskError(null);
    setEvaluation(null);
    setEvalError(null);
    setShowHint(false);
    setAnswerText('');

    try {
      const res = await fetch('/api/interview/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedConcepts,
          focusConceptId: focusConceptId === 'auto' ? '' : focusConceptId,
          roleTarget,
          mode,
          language,
          previousQuestions
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not start mock interview.');
      }
      setActivePrompt(data.promptData);
      setRoundNumber(1);
      setPreviousQuestions((prev) => [data.promptData.question, ...prev.slice(0, 6)]);
    } catch (err: any) {
      setAskError(err?.message || 'Unable to generate question.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleAnswerFollowUp = () => {
    if (!activePrompt || !evaluation?.followUpQuestion) return;
    setActivePrompt({
      question: evaluation.followUpQuestion,
      focusConceptId: activePrompt.focusConceptId,
      focusConceptTitle: activePrompt.focusConceptTitle,
      constraints: ['Follow-up Round · Go deeper on the mechanism or trade-off'],
      hint: 'Reference specific bottlenecks, latency/VRAM impacts, or failure recovery strategies.'
    });
    setEvaluation(null);
    setEvalError(null);
    setShowHint(false);
    setAnswerText('');
    setRoundNumber((r) => r + 1);
  };

  const handleEvaluateAnswer = async () => {
    if (!activePrompt) return;
    setEvalError(null);
    if (answerText.trim().length < 20) {
      setEvalError('Write at least 2–3 structured sentences covering trade-offs & edge cases.');
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activePrompt.question,
          focusConceptTitle: activePrompt.focusConceptTitle,
          answerText,
          language
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Evaluation failed.');
      }
      setEvaluation(data.evaluation);
    } catch (err: any) {
      setEvalError(err?.message || 'Unable to evaluate response.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-4 h-4" />
              <span>AI TECHNICAL & SYSTEM DESIGN INTERVIEWER</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Calibrated Strictly to Your {unlockedConceptDetails.length} Completed Roadmap Concepts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generates realistic ML/LLM interview questions strictly from topics marked complete in your Roadmap and scores Depth, Edge Cases, and Clarity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={focusConceptId}
              onChange={(e) => setFocusConceptId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-w-[230px]"
              aria-label="Filter unlocked concept"
            >
              <option value="auto">
                Auto-Rotate Unlocked ({unlockedConceptDetails.length})
              </option>
              {unlockedConceptDetails.map((c) => (
                <option key={c.id} value={c.id}>
                  P{c.phaseNumber} · {c.title}
                </option>
              ))}
            </select>

            <select
              value={roleTarget}
              onChange={(e) => setRoleTarget(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              aria-label="Target interview role"
            >
              <option value="AI / LLM Systems Engineer">AI / LLM Systems Engineer</option>
              <option value="Production RAG Architect">Production RAG Architect</option>
              <option value="Deep Learning & Transformers Engineer">DL & Transformers Engineer</option>
              <option value="MLOps & Quantization Lead">MLOps & Inference Lead</option>
            </select>

            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMode('system-design')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  mode === 'system-design'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                System Design
              </button>
              <button
                type="button"
                onClick={() => setMode('technical')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  mode === 'technical'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Deep Technical
              </button>
            </div>

            <button
              type="button"
              disabled={isAsking}
              onClick={handleGenerateQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white cursor-pointer whitespace-nowrap"
            >
              {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{activePrompt ? 'Next Question' : 'Ask Interview Question'}</span>
            </button>
          </div>
        </div>

        {/* Unlocked Concepts Scope Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Unlocked Scope:
          </span>
          {unlockedConceptDetails.length > 0 ? (
            <>
              {unlockedConceptDetails.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFocusConceptId(focusConceptId === c.id ? 'auto' : c.id)}
                  className={`px-2 py-0.5 rounded font-mono border transition-colors cursor-pointer ${
                    focusConceptId === c.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {c.id.toUpperCase()} · {c.title.split(':')[0]}
                </button>
              ))}
              {unlockedConceptDetails.length > 6 && (
                <span className="font-mono text-slate-400">
                  +{unlockedConceptDetails.length - 6} more unlocked
                </span>
              )}
            </>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">
              No completed concepts checked in Roadmap yet — will practice foundational concepts until you check off topics.
            </span>
          )}
        </div>

        {askError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {askError}
          </div>
        )}
      </div>

      {/* Active Question & Answer Workspace */}
      {activePrompt && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  ROUND {roundNumber}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  TESTING: {activePrompt.focusConceptId.toUpperCase()} · {activePrompt.focusConceptTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {activePrompt.question}
            </h3>

            {activePrompt.constraints.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Scale & Engineering Constraints:</div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {activePrompt.constraints.map((c, i) => (
                    <li key={i} className="font-mono text-[11px]">
                      • {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showHint && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <strong>Interviewer Nudge:</strong> {activePrompt.hint}
              </div>
            )}

            <textarea
              rows={7}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Outline your architecture, latency/memory math, failure modes, and trade-offs (English or Hinglish)..."
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {evalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {evalError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isEvaluating}
                onClick={handleEvaluateAnswer}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white cursor-pointer"
              >
                {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isEvaluating ? 'Scoring Depth & Edge Cases...' : 'Submit Interview Answer'}</span>
              </button>
            </div>
          </div>

          {/* Evaluation Scorecard */}
          <div className="lg:col-span-5">
            {evaluation ? (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-300 dark:border-indigo-700 shadow-sm space-y-4">
                <div>
                  <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    Bar-Raiser Scorecard
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {evaluation.overallVerdict}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900">
                    <div className="text-[10px] font-mono text-slate-500">DEPTH</div>
                    <div className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {evaluation.depthScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900">
                    <div className="text-[10px] font-mono text-slate-500">EDGE CASES</div>
                    <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                      {evaluation.edgeCasesScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
                    <div className="text-[10px] font-mono text-slate-500">CLARITY</div>
                    <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {evaluation.clarityScore}%
                    </div>
                  </div>
                </div>

                {evaluation.strongPoints.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Strong Signals:</span>
                    </div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {evaluation.strongPoints.map((s, i) => (
                        <li key={i}>✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.missedPoints.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Edge Cases / Gaps Missed:</span>
                    </div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {evaluation.missedPoints.map((m, i) => (
                        <li key={i}>! {m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.followUpQuestion && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
                    <div className="font-bold text-indigo-800 dark:text-indigo-200">
                      Likely Follow-Up Probe:
                    </div>
                    <p className="text-indigo-950 dark:text-indigo-100 leading-relaxed">
                      {evaluation.followUpQuestion}
                    </p>
                    <button
                      type="button"
                      onClick={handleAnswerFollowUp}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Answer Follow-Up Round</span>
                    </button>
                  </div>
                )}

                {evaluation.modelOutline && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Staff Engineer Reference Outline:
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {evaluation.modelOutline}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Interview Scoring Rubric
                </div>
                <p className="leading-relaxed">
                  Structure your answer in 3 parts: <strong>Architecture & Math</strong>, <strong>Latency/VRAM Trade-offs</strong>, and <strong>Production Failure Modes</strong>. Submit to get scored across Depth, Edge Cases, and Clarity.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
