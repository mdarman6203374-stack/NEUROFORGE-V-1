import React, { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Mic,
  MicOff,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  Eye,
  Sparkles,
  AlertTriangle,
  Plus,
  Clock,
  Layers,
  Award,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { Language } from '../types';
import {
  SRSCard,
  SRSRating,
  FeynmanAttemptRecord,
  syncCompletedConceptsToSrs,
  isCardDueToday,
  reviewSrsCard,
  previewNextIntervalDays,
  addCustomSrsCard,
  addGeneratedSrsCards,
  loadFeynmanHistory,
  saveFeynmanAttempt,
  markWarmupCompletedToday
} from '../utils/spacedRepetition';

interface MemoryRetentionViewProps {
  completedConcepts: string[];
  language: Language;
  initialSubTab?: 'srs' | 'feynman';
}

export const MemoryRetentionView: React.FC<MemoryRetentionViewProps> = ({
  completedConcepts,
  language,
  initialSubTab = 'srs'
}) => {
  const [subTab, setSubTab] = useState<'srs' | 'feynman'>(initialSubTab);

  // SRS State
  const [cards, setCards] = useState<SRSCard[]>(() =>
    syncCompletedConceptsToSrs(completedConcepts)
  );
  const [srsFilter, setSrsFilter] = useState<'due' | 'weak' | 'ai' | 'all'>('due');
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [showCardHint, setShowCardHint] = useState<boolean>(false);
  const [userRecallAttempt, setUserRecallAttempt] = useState<string>('');

  // Gemini AI Flashcard Challenge Generator State
  const [aiScopeConceptId, setAiScopeConceptId] = useState<string>('all-completed');
  const [aiChallengeStyle, setAiChallengeStyle] = useState<'mixed' | 'intuition' | 'scenario' | 'math-code'>('mixed');
  const [aiCardCount, setAiCardCount] = useState<number>(4);
  const [isGeneratingCards, setIsGeneratingCards] = useState<boolean>(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const [aiGenNotice, setAiGenNotice] = useState<string | null>(null);

  // Quick Custom Card Builder
  const [showAddCard, setShowAddCard] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<string>('');
  const [newAnswer, setNewAnswer] = useState<string>('');

  // Feynman 60s State
  const allConcepts = ROADMAP_PHASES.flatMap((phase) =>
    phase.concepts.map((c) => ({
      ...c,
      phaseNumber: phase.phaseNumber,
      phaseTitle: phase.title,
      isCompleted: completedConcepts.includes(c.id)
    }))
  );
  const completedConceptList = allConcepts.filter((c) => c.isCompleted);
  const selectableConcepts =
    completedConceptList.length > 0 ? completedConceptList : allConcepts;

  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    () => selectableConcepts[0]?.id || 'p0-1'
  );
  const [feynmanText, setFeynmanText] = useState<string>('');
  const [feynmanSecondsLeft, setFeynmanSecondsLeft] = useState<number>(60);
  const [isSprintRunning, setIsSprintRunning] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [usedVoiceMode, setUsedVoiceMode] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<FeynmanAttemptRecord | null>(null);
  const [feynmanHistory, setFeynmanHistory] = useState<FeynmanAttemptRecord[]>(() =>
    loadFeynmanHistory()
  );

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    setCards(syncCompletedConceptsToSrs(completedConcepts));
  }, [completedConcepts]);

  // 60-second sprint countdown timer
  useEffect(() => {
    if (!isSprintRunning) return;
    const t = setInterval(() => {
      setFeynmanSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsSprintRunning(false);
          stopVoiceRecognition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isSprintRunning]);

  const stopVoiceRecognition = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setIsListeningVoice(false);
  };

  useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, []);

  const speechApiSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const startVoiceDictation = () => {
    setVoiceError(null);
    if (!speechApiSupported) {
      setVoiceError('Browser microphone speech-to-text is unavailable here — type your 60s explanation below instead.');
      return;
    }

    try {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === 'hinglish' ? 'en-IN' : 'en-US';

      const baseText = feynmanText.trim() ? `${feynmanText.trim()} ` : '';
      let finalSegment = '';

      rec.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalSegment += `${transcript} `;
          } else {
            interim += transcript;
          }
        }
        setFeynmanText(`${baseText}${finalSegment}${interim}`.trim());
      };

      rec.onerror = (ev: any) => {
        setVoiceError(`Mic notice: ${ev?.error || 'microphone interrupted'}. You can keep typing anytime.`);
        setIsListeningVoice(false);
      };

      rec.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListeningVoice(true);
      setUsedVoiceMode(true);
      if (!isSprintRunning) {
        setFeynmanSecondsLeft(60);
        setIsSprintRunning(true);
      }
    } catch {
      setVoiceError('Could not start microphone dictation. Please type your explanation.');
    }
  };

  const handleEvaluateFeynman = async () => {
    setIsSprintRunning(false);
    stopVoiceRecognition();
    setEvalError(null);

    if (feynmanText.trim().length < 15) {
      setEvalError('Explain in at least 1–2 sentences so Gemini can grade intuition and jargon.');
      return;
    }

    const conceptMeta =
      allConcepts.find((c) => c.id === selectedConceptId) || allConcepts[0];

    setIsEvaluating(true);
    try {
      const durationUsed = Math.max(5, 60 - feynmanSecondsLeft);
      const res = await fetch('/api/feynman/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: conceptMeta.id,
          conceptTitle: conceptMeta.title,
          explanationText: feynmanText.trim(),
          language,
          durationSecondsUsed: durationUsed
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Evaluation failed.');
      }

      const ev = data.evaluation;
      const record: FeynmanAttemptRecord = {
        id: `feyn-${Date.now()}`,
        conceptId: conceptMeta.id,
        conceptTitle: conceptMeta.title,
        durationSecondsUsed: durationUsed,
        mode: usedVoiceMode ? 'voice' : 'text',
        transcript: feynmanText.trim(),
        clarityScore: ev.clarityScore,
        intuitionScore: ev.intuitionScore,
        simplicityScore: ev.simplicityScore,
        accuracyScore: ev.accuracyScore ?? ev.intuitionScore,
        accuracyNotes: ev.accuracyNotes || [],
        verdictHeadline: ev.verdictHeadline,
        strengths: ev.strengths || [],
        missingIntuition: ev.missingIntuition || [],
        jargonTraps: ev.jargonTraps || [],
        simplifiedAnalogy: ev.simplifiedAnalogy || '',
        createdAt: new Date().toISOString()
      };

      setLatestResult(record);
      setFeynmanHistory(saveFeynmanAttempt(record));
    } catch (err: any) {
      setEvalError(err?.message || 'Unable to grade explanation right now.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Filtered SRS cards
  const dueCards = cards.filter(isCardDueToday);
  const weakQuizCards = cards.filter((c) => c.source === 'weak-quiz');
  const aiGeneratedCards = cards.filter((c) => c.source === 'ai-generated');
  const filteredCards =
    srsFilter === 'due'
      ? dueCards
      : srsFilter === 'weak'
      ? weakQuizCards
      : srsFilter === 'ai'
      ? aiGeneratedCards
      : cards;

  const safeIdx =
    filteredCards.length > 0 ? Math.min(selectedCardIdx, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeIdx] || null;

  const handleRateCard = (rating: SRSRating) => {
    if (!activeCard) return;
    const nextCards = reviewSrsCard(activeCard.id, rating);
    setCards(nextCards);
    setIsCardFlipped(false);
    setShowCardHint(false);
    setUserRecallAttempt('');
    setSelectedCardIdx(0);
    if (nextCards.filter(isCardDueToday).length === 0) {
      markWarmupCompletedToday();
    }
  };

  const handleCreateCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || !newAnswer.trim()) return;
    const conceptMeta =
      allConcepts.find((c) => c.id === selectedConceptId) || allConcepts[0];
    const next = addCustomSrsCard(
      conceptMeta.id,
      conceptMeta.title,
      conceptMeta.phaseNumber,
      newPrompt,
      newAnswer
    );
    setCards(next);
    setNewPrompt('');
    setNewAnswer('');
    setShowAddCard(false);
    setShowCardHint(false);
    setUserRecallAttempt('');
    setSrsFilter('due');
  };

  const handleGenerateAiFlashcards = async () => {
    setAiGenError(null);
    setAiGenNotice(null);

    const targetPool =
      aiScopeConceptId === 'all-completed'
        ? selectableConcepts
        : selectableConcepts.filter((c) => c.id === aiScopeConceptId);

    if (targetPool.length === 0) {
      setAiGenError('Complete at least one roadmap concept first to generate AI recall challenges.');
      return;
    }

    // Shuffle pool slightly when generating from multiple completed concepts so fresh mixes appear
    const orderedPool =
      targetPool.length > 1
        ? [...targetPool].sort(() => Math.random() - 0.5).slice(0, 8)
        : targetPool;

    setIsGeneratingCards(true);
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepts: orderedPool.map((c) => ({
            id: c.id,
            phaseNumber: c.phaseNumber,
            title: c.title,
            description: c.description
          })),
          count: aiCardCount,
          challengeStyle: aiChallengeStyle,
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate AI flashcards.');
      }

      const { cards: nextCards, addedCount } = addGeneratedSrsCards(data.cards || []);
      setCards(nextCards);
      setSrsFilter('ai');
      setSelectedCardIdx(0);
      setIsCardFlipped(false);
      setShowCardHint(false);
      setUserRecallAttempt('');
      setAiGenNotice(
        `Generated ${addedCount} dynamic Gemini recall challenge${addedCount === 1 ? '' : 's'} (${data.modelUsed || 'gemini-4-hydrogen'}).`
      );
    } catch (err: any) {
      setAiGenError(err?.message || 'Unable to generate Gemini flashcards right now.');
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const stageCounts = {
    d3: cards.filter((c) => c.milestoneStage === 3).length,
    d7: cards.filter((c) => c.milestoneStage === 7).length,
    d21: cards.filter((c) => c.milestoneStage === 21).length,
    d60: cards.filter((c) => c.milestoneStage === 60).length
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              <span>Memory & Retention Engine · Zero-Forget System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'hinglish'
                ? 'Spaced Repetition (3/7/21/60d) + Feynman 60s Explainer'
                : 'Spaced Repetition Flashcards & Feynman 60s Explainer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'hinglish'
                ? 'Purane phases bhoolne se bachein: har completed concept 3, 7, 21 aur 60 din par auto-queue hota hai, aur galat Quick Quiz questions turant review deck mein aa jate hain.'
                : 'Lock AI concepts into permanent memory: completed topics automatically queue at 3, 7, 21, and 60-day intervals alongside missed Quick Quiz questions, plus AI-graded 60-second Feynman drills.'}
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setSubTab('srs')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'srs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>SRS Flashcards ({dueCards.length} due)</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('feynman')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subTab === 'feynman'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Feynman 60s Explainer</span>
            </button>
          </div>
        </div>

        {/* Retention Stage Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 font-mono text-[10px]">DAY 3 STAGE</div>
            <div className="text-base font-bold font-mono tabular-nums">{stageCounts.d3} cards</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 font-mono text-[10px]">DAY 7 STAGE</div>
            <div className="text-base font-bold font-mono tabular-nums">{stageCounts.d7} cards</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 font-mono text-[10px]">DAY 21 STAGE</div>
            <div className="text-base font-bold font-mono tabular-nums">{stageCounts.d21} cards</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 font-mono text-[10px]">DAY 60+ MASTERED</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
              {stageCounts.d60} cards
            </div>
          </div>
        </div>
      </div>

      {subTab === 'srs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Gemini Challenge Generator + Filter + Active Card Player */}
          <div className="lg:col-span-8 space-y-4">
            {/* Gemini Dynamic Concept Flashcard Generator */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini Dynamic Active-Recall Generator</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {completedConceptList.length > 0
                      ? `Generate fresh challenge questions strictly from your ${completedConceptList.length} completed concepts.`
                      : 'Generate sample active-recall challenges from Phase 0 foundations or unlock more concepts in Roadmap.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingCards}
                  onClick={handleGenerateAiFlashcards}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  {isGeneratingCards ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Challenges...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate {aiCardCount} AI Cards</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  aria-label="Select completed concept scope"
                  value={aiScopeConceptId}
                  onChange={(e) => setAiScopeConceptId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all-completed">
                    All Completed ({selectableConcepts.length} concepts)
                  </option>
                  {selectableConcepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      Phase {c.phaseNumber} · {c.title}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Select challenge focus"
                  value={aiChallengeStyle}
                  onChange={(e) => setAiChallengeStyle(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="mixed">Style: Mixed Active Recall</option>
                  <option value="intuition">Style: First-Principles Why</option>
                  <option value="scenario">Style: Production Failure & Trade-offs</option>
                  <option value="math-code">Style: Math Shapes & Code Drills</option>
                </select>

                <select
                  aria-label="Select card count"
                  value={aiCardCount}
                  onChange={(e) => setAiCardCount(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={3}>Batch: 3 Dynamic Cards</option>
                  <option value={4}>Batch: 4 Dynamic Cards</option>
                  <option value={6}>Batch: 6 Dynamic Cards</option>
                </select>
              </div>

              {aiGenError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiGenError}</span>
                </div>
              )}

              {aiGenNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{aiGenNotice}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSrsFilter('due');
                    setSelectedCardIdx(0);
                    setIsCardFlipped(false);
                    setShowCardHint(false);
                    setUserRecallAttempt('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    srsFilter === 'due'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Due Today ({dueCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSrsFilter('ai');
                    setSelectedCardIdx(0);
                    setIsCardFlipped(false);
                    setShowCardHint(false);
                    setUserRecallAttempt('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    srsFilter === 'ai'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  AI Challenges ({aiGeneratedCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSrsFilter('weak');
                    setSelectedCardIdx(0);
                    setIsCardFlipped(false);
                    setShowCardHint(false);
                    setUserRecallAttempt('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    srsFilter === 'weak'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Weak Quiz ({weakQuizCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSrsFilter('all');
                    setSelectedCardIdx(0);
                    setIsCardFlipped(false);
                    setShowCardHint(false);
                    setUserRecallAttempt('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    srsFilter === 'all'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({cards.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCard((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add Custom Flashcard</span>
              </button>
            </div>

            {showAddCard && (
              <form
                onSubmit={handleCreateCustomCard}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Create Custom Recall Flashcard (Starts at 3-Day Schedule)
                </div>
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Recall Prompt / Question (e.g., Why divide QK^T by sqrt(d_k)?)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <textarea
                  rows={2}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Core Answer & Intuition..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCard(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    Save to Queue
                  </button>
                </div>
              </form>
            )}

            {/* Interactive Flashcard */}
            {activeCard ? (
              <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        activeCard.source === 'weak-quiz'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : activeCard.source === 'ai-generated'
                          ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {activeCard.source === 'weak-quiz'
                        ? 'WEAK QUIZ RECOVERY'
                        : activeCard.source === 'ai-generated'
                        ? `GEMINI · ${(activeCard.challengeType || 'ACTIVE RECALL').toUpperCase()}`
                        : `MILESTONE ${activeCard.milestoneStage}D`}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      Phase {activeCard.phaseNumber}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    Card {safeIdx + 1} of {filteredCards.length} · Due {activeCard.dueDate}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {activeCard.conceptTitle}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {activeCard.prompt}
                  </h2>
                </div>

                {/* Optional Hint Toggle & Active Recall Self-Check Scratch Area */}
                {!isCardFlipped && (
                  <div className="space-y-3">
                    {activeCard.hint && (
                      <div>
                        {showCardHint ? (
                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong>Hint:</strong> {activeCard.hint}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowCardHint(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Need a subtle hint before flipping?</span>
                          </button>
                        )}
                      </div>
                    )}

                    <textarea
                      rows={2}
                      value={userRecallAttempt}
                      onChange={(e) => setUserRecallAttempt(e.target.value)}
                      placeholder={
                        language === 'hinglish'
                          ? '(Optional) Flip karne se pehle apna quick answer yahan likhkar recall test karein...'
                          : '(Optional) Jot down your quick answer from memory before flipping to compare...'
                      }
                      className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                    />
                  </div>
                )}

                {isCardFlipped ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                    {userRecallAttempt.trim() && (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                          Your Recall Attempt
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {userRecallAttempt.trim()}
                        </p>
                      </div>
                    )}

                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Answer & Intuition
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {activeCard.answer}
                    </p>
                    {activeCard.hinglishAnswer && (
                      <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200">
                        <span className="font-bold">
                          {language === 'hinglish' ? 'Hinglish Intuition: ' : 'Core Takeaway: '}
                        </span>
                        {activeCard.hinglishAnswer}
                      </div>
                    )}

                    <div className="pt-2 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Rate recall confidence to schedule next review (SM-2):
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(
                          [
                            { id: 'again', label: 'Forgot (Reset)', cls: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200' },
                            { id: 'hard', label: 'Hard Recall', cls: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200' },
                            { id: 'good', label: 'Good (Standard)', cls: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200' },
                            { id: 'easy', label: 'Instant / Easy', cls: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' }
                          ] as const
                        ).map((opt) => {
                          const nextDays = previewNextIntervalDays(activeCard, opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleRateCard(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] cursor-pointer ${opt.cls}`}
                            >
                              <div className="text-xs font-bold">{opt.label}</div>
                              <div className="text-[11px] font-mono opacity-80">
                                Next: {nextDays} {nextDays === 1 ? 'day' : 'days'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCardFlipped(true)}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Flip Card & Reveal Intuition</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {srsFilter === 'weak'
                    ? 'No Weak Quick-Quiz Spots Queued!'
                    : srsFilter === 'ai'
                    ? 'No Gemini AI Challenges Generated Yet'
                    : 'Queue Cleared for Today!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {srsFilter === 'ai'
                    ? 'Click "Generate AI Cards" above to create concept-specific active recall challenges from your completedConcepts.'
                    : 'Generate fresh Gemini AI Cards above, switch to "All" cards, or practice a 60-second Feynman explanation.'}
                </p>
              </div>
            )}
          </div>

          {/* Right: Upcoming Queue Browser */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Queue Explorer</span>
              <span className="font-mono">{filteredCards.length} items</span>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredCards.map((c, idx) => {
                const isSelected = idx === safeIdx;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCardIdx(idx);
                      setIsCardFlipped(false);
                      setShowCardHint(false);
                      setUserRecallAttempt('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span
                        className={
                          c.source === 'weak-quiz'
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : c.source === 'ai-generated'
                            ? 'text-violet-600 dark:text-violet-400 font-bold'
                            : 'text-indigo-600 dark:text-indigo-400 font-bold'
                        }
                      >
                        {c.source === 'weak-quiz'
                          ? 'WEAK SPOT'
                          : c.source === 'ai-generated'
                          ? 'AI RECALL'
                          : `${c.intervalDays}D INTERVAL`}
                      </span>
                      <span className="text-slate-400">Due {c.dueDate}</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {c.conceptTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {c.prompt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Sub-Tab 2: Feynman Technique 60-Second Voice/Text Explainer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  60-Second Feynman Technique Challenge
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Teach a concept as if explaining to a 12-year-old or first-year student — zero fluff.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`px-3 py-1.5 rounded-xl border font-mono text-base font-extrabold tabular-nums flex items-center gap-1.5 ${
                    isSprintRunning
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>00:{String(feynmanSecondsLeft).padStart(2, '0')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isSprintRunning) {
                      setIsSprintRunning(false);
                    } else {
                      if (feynmanSecondsLeft === 0) setFeynmanSecondsLeft(60);
                      setIsSprintRunning(true);
                    }
                  }}
                  className={`p-2 rounded-xl text-white cursor-pointer ${
                    isSprintRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  title={isSprintRunning ? 'Pause 60s timer' : 'Start 60s sprint'}
                >
                  {isSprintRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSprintRunning(false);
                    setFeynmanSecondsLeft(60);
                    stopVoiceRecognition();
                  }}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  title="Reset 60s sprint"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Completed Concept Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="feynman-concept-select"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Select Completed Concept to Explain
                </label>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {completedConceptList.length} completed unlocked
                </span>
              </div>
              <select
                id="feynman-concept-select"
                value={selectedConceptId}
                onChange={(e) => {
                  setSelectedConceptId(e.target.value);
                  setLatestResult(null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {completedConceptList.length > 0 && (
                  <optgroup label={`Completed Concepts (${completedConceptList.length})`}>
                    {completedConceptList.map((c) => (
                      <option key={c.id} value={c.id}>
                        ✓ Phase {c.phaseNumber} · {c.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {allConcepts.some((c) => !c.isCompleted) && (
                  <optgroup label="Upcoming Roadmap Concepts (Preview)">
                    {allConcepts
                      .filter((c) => !c.isCompleted)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          Phase {c.phaseNumber} · {c.title}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Voice Dictation + Text Explanation Box */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Plain-Language Explanation ({language === 'hinglish' ? 'English / Hinglish' : 'English'})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isListeningVoice) {
                      stopVoiceRecognition();
                    } else {
                      startVoiceDictation();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    isListeningVoice
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isListeningVoice ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop Voice Mic</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Speak 60s Explanation</span>
                    </>
                  )}
                </button>
              </div>

              {voiceError && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                  {voiceError}
                </div>
              )}

              <textarea
                rows={6}
                value={feynmanText}
                onChange={(e) => {
                  setFeynmanText(e.target.value);
                  if (!isListeningVoice) setUsedVoiceMode(false);
                }}
                placeholder={
                  language === 'hinglish'
                    ? 'Speak or type in simple Hinglish/English — jaise aap kisi dost ko bina heavy jargon ke yeh concept samjha rahe ho...'
                    : 'Explain the intuition, why it matters, and a concrete example in simple words (hit Speak or type here)...'
                }
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {evalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{evalError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] font-mono text-slate-500">
                  {feynmanText.trim() ? feynmanText.trim().split(/\s+/).length : 0} words
                </span>
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={handleEvaluateFeynman}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEvaluating ? 'Grading with Gemini...' : 'Grade My Explanation'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Evaluation Scorecard + Past Attempts */}
          <div className="lg:col-span-5 space-y-4">
            {latestResult ? (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-300 dark:border-indigo-700 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                      Feynman Evaluation
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {latestResult.verdictHeadline}
                    </h3>
                  </div>
                  <Award className="w-5 h-5 text-amber-500 shrink-0" />
                </div>

                {/* 4 Score Gauges: Clarity, Intuition, Low Jargon, Accuracy */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">CLARITY</div>
                    <div className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {latestResult.clarityScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">INTUITION</div>
                    <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {latestResult.intuitionScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">LOW JARGON</div>
                    <div className="text-lg font-extrabold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
                      {latestResult.simplicityScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ACCURACY</div>
                    <div className="text-lg font-extrabold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                      {latestResult.accuracyScore ?? latestResult.intuitionScore}%
                    </div>
                  </div>
                </div>

                {latestResult.strengths.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">What Clicked:</div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {latestResult.strengths.map((s, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestResult.missingIntuition.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Missing Intuition / Gaps:</div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {latestResult.missingIntuition.map((m, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-amber-500 font-bold">!</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestResult.jargonTraps.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-rose-600 dark:text-rose-400">Unexplained Jargon Flagged:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {latestResult.jargonTraps.map((j, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-mono text-rose-700 dark:text-rose-300"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {latestResult.accuracyNotes && latestResult.accuracyNotes.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sky-600 dark:text-sky-400">
                      Technical Accuracy Check:
                    </div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {latestResult.accuracyNotes.map((note, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-sky-500 font-bold">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestResult.simplifiedAnalogy && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Feynman Master Analogy:
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {latestResult.simplifiedAnalogy}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  How the Feynman Rubric Works
                </div>
                <p className="leading-relaxed">
                  True AI engineers don’t hide behind buzzwords. Gemini checks whether you clearly explained the underlying intuition, avoids unexplained acronyms, and stays technically accurate within 60 seconds.
                </p>
              </div>
            )}

            {feynmanHistory.length > 0 && (
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recent Feynman Attempts ({feynmanHistory.length})
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {feynmanHistory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLatestResult(item)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.conceptTitle}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.mode.toUpperCase()} · {item.durationSecondsUsed}s
                        </div>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0 tabular-nums">
                        {item.clarityScore}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
