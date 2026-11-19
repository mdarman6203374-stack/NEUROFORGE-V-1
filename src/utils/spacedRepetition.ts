import { ROADMAP_PHASES } from '../data/roadmapData';

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSCard {
  id: string;
  conceptId: string;
  phaseNumber: number;
  conceptTitle: string;
  prompt: string;
  hint?: string;
  answer: string;
  hinglishAnswer?: string;
  challengeType?: string;
  source: 'concept-milestone' | 'weak-quiz' | 'custom' | 'ai-generated';
  milestoneStage: 3 | 7 | 21 | 60;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueDate: string; // YYYY-MM-DD
  completedOnDate?: string;
  lastReviewedAt?: string;
  lapseCount: number;
}

export interface FeynmanAttemptRecord {
  id: string;
  conceptId: string;
  conceptTitle: string;
  durationSecondsUsed: number;
  mode: 'voice' | 'text';
  transcript: string;
  clarityScore: number;
  intuitionScore: number;
  simplicityScore: number;
  accuracyScore?: number;
  accuracyNotes?: string[];
  verdictHeadline: string;
  strengths: string[];
  missingIntuition: string[];
  jargonTraps: string[];
  simplifiedAnalogy: string;
  createdAt: string;
}

const SRS_CARDS_KEY = 'ai_mastery_srs_cards_v1';
const CONCEPT_TIMESTAMPS_KEY = 'ai_mastery_concept_timestamps_v1';
const FEYNMAN_HISTORY_KEY = 'ai_mastery_feynman_history_v1';
const WARMUP_DONE_DATE_KEY = 'ai_mastery_warmup_done_date_v1';

export const RETENTION_MILESTONES: Array<3 | 7 | 21 | 60> = [3, 7, 21, 60];

export function formatIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function addDaysToIso(baseIso: string, days: number): string {
  const dt = new Date(`${baseIso}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  return formatIsoDate(dt);
}

export function getTodayIso(): string {
  return formatIsoDate(new Date());
}

export function loadConceptTimestamps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CONCEPT_TIMESTAMPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveConceptTimestamps(map: Record<string, string>) {
  try {
    localStorage.setItem(CONCEPT_TIMESTAMPS_KEY, JSON.stringify(map));
  } catch {}
}

export function loadSrsCards(): SRSCard[] {
  try {
    const raw = localStorage.getItem(SRS_CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSrsCards(cards: SRSCard[]) {
  try {
    localStorage.setItem(SRS_CARDS_KEY, JSON.stringify(cards));
  } catch {}
}

export function loadFeynmanHistory(): FeynmanAttemptRecord[] {
  try {
    const raw = localStorage.getItem(FEYNMAN_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFeynmanAttempt(attempt: FeynmanAttemptRecord): FeynmanAttemptRecord[] {
  const existing = loadFeynmanHistory();
  const next = [attempt, ...existing.slice(0, 29)];
  try {
    localStorage.setItem(FEYNMAN_HISTORY_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function getWarmupCompletedToday(): boolean {
  try {
    return localStorage.getItem(WARMUP_DONE_DATE_KEY) === getTodayIso();
  } catch {
    return false;
  }
}

export function markWarmupCompletedToday() {
  try {
    localStorage.setItem(WARMUP_DONE_DATE_KEY, getTodayIso());
  } catch {}
}

/**
 * Synchronizes completedConcepts with SRS flashcards following the 3 / 7 / 21 / 60-day schedule.
 * Newly encountered pre-seeded concepts receive realistic historical completion offsets (-3d, -7d)
 * so learners immediately have active due cards ready for Morning Warmup.
 */
export function syncCompletedConceptsToSrs(completedConcepts: string[]): SRSCard[] {
  const today = getTodayIso();
  const timestamps = loadConceptTimestamps();
  const cards = loadSrsCards();

  // Build quick lookup from ROADMAP_PHASES
  const conceptLookup = new Map<
    string,
    { phaseNumber: number; title: string; description: string; hinglishDesc?: string }
  >();
  for (const phase of ROADMAP_PHASES) {
    for (const concept of phase.concepts) {
      conceptLookup.set(concept.id, {
        phaseNumber: phase.phaseNumber,
        title: concept.title,
        description: concept.description,
        hinglishDesc: concept.hinglishDesc
      });
    }
  }

  let tsChanged = false;
  const backfillOffsets = [-3, -7, -21, -2];

  completedConcepts.forEach((cid, idx) => {
    if (!timestamps[cid]) {
      // Seed first few pre-existing concepts as completed 3 or 7 days ago so queue works immediately
      const offsetDays = cards.length === 0 && idx < backfillOffsets.length ? backfillOffsets[idx] : 0;
      timestamps[cid] = offsetDays === 0 ? today : addDaysToIso(today, offsetDays);
      tsChanged = true;
    }
  });

  if (tsChanged) {
    saveConceptTimestamps(timestamps);
  }

  const existingById = new Map(cards.map((c) => [c.id, c]));
  let cardsChanged = false;

  // Create/ensure concept milestone card for every completed concept
  for (const cid of completedConcepts) {
    const cardId = `concept-srs-${cid}`;
    if (!existingById.has(cardId)) {
      const meta = conceptLookup.get(cid);
      if (!meta) continue;
      const completedOn = timestamps[cid] || today;
      const firstDue = addDaysToIso(completedOn, 3);
      const newCard: SRSCard = {
        id: cardId,
        conceptId: cid,
        phaseNumber: meta.phaseNumber,
        conceptTitle: meta.title,
        prompt: `Explain the core intuition & mechanics of "${meta.title}" — what problem does it solve and how does it work under the hood?`,
        answer: meta.description,
        hinglishAnswer: meta.hinglishDesc,
        source: 'concept-milestone',
        milestoneStage: 3,
        repetitions: 0,
        intervalDays: 3,
        easeFactor: 2.5,
        dueDate: firstDue,
        completedOnDate: completedOn,
        lapseCount: 0
      };
      existingById.set(cardId, newCard);
      cardsChanged = true;
    }
  }

  // Keep weak-quiz, custom, and still-completed concept cards
  const completedSet = new Set(completedConcepts);
  const nextCards = Array.from(existingById.values()).filter((card) => {
    if (card.source === 'concept-milestone') {
      const keep = completedSet.has(card.conceptId);
      if (!keep) cardsChanged = true;
      return keep;
    }
    return true;
  });

  if (cardsChanged) {
    saveSrsCards(nextCards);
  }

  return nextCards;
}

export function enqueueWeakQuizQuestions(
  conceptId: string,
  conceptTitle: string,
  phaseNumber: number,
  wrongQuestions: Array<{
    id: string;
    question: string;
    correctOption: string;
    explanation: string;
  }>
): SRSCard[] {
  const today = getTodayIso();
  const cards = loadSrsCards();
  const map = new Map(cards.map((c) => [c.id, c]));

  for (const wq of wrongQuestions) {
    // Stable hash-like ID based on question text slice so duplicate quiz runs reinforce rather than duplicate
    const slug = wq.question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 28);
    const cardId = `weak-${conceptId}-${slug || wq.id}`;
    const existing = map.get(cardId);
    map.set(cardId, {
      id: cardId,
      conceptId,
      phaseNumber,
      conceptTitle,
      prompt: wq.question,
      answer: `Correct Answer: ${wq.correctOption}\n\nWhy: ${wq.explanation}`,
      source: 'weak-quiz',
      milestoneStage: 3,
      repetitions: 0,
      intervalDays: 1,
      easeFactor: existing ? Math.max(1.3, existing.easeFactor - 0.15) : 2.3,
      dueDate: today, // Immediate review due today!
      lastReviewedAt: existing?.lastReviewedAt,
      lapseCount: (existing?.lapseCount || 0) + 1
    });
  }

  const next = Array.from(map.values());
  saveSrsCards(next);
  return next;
}

export function getNextMilestoneStage(intervalDays: number): 3 | 7 | 21 | 60 {
  if (intervalDays < 7) return 3;
  if (intervalDays < 21) return 7;
  if (intervalDays < 60) return 21;
  return 60;
}

export function previewNextIntervalDays(card: SRSCard, rating: SRSRating): number {
  if (rating === 'again') return 1;
  if (rating === 'hard') return Math.max(2, Math.round(card.intervalDays * 0.7));

  // Progressive 3 -> 7 -> 21 -> 60-day schedule followed by SM-2 EF multiplier
  const current = card.intervalDays;
  let nextBase = 3;
  if (current < 3) nextBase = 3;
  else if (current < 7) nextBase = 7;
  else if (current < 21) nextBase = 21;
  else if (current < 60) nextBase = 60;
  else nextBase = Math.round(current * card.easeFactor);

  if (rating === 'easy') {
    if (current < 7) return 7;
    if (current < 21) return 21;
    if (current < 60) return 60;
    return Math.round(nextBase * 1.3);
  }

  return nextBase;
}

export function reviewSrsCard(cardId: string, rating: SRSRating): SRSCard[] {
  const today = getTodayIso();
  const cards = loadSrsCards();

  const next = cards.map((card) => {
    if (card.id !== cardId) return card;

    const quality = rating === 'again' ? 1 : rating === 'hard' ? 3 : rating === 'good' ? 4 : 5;
    const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    const nextEf = Math.min(2.9, Math.max(1.3, Number((card.easeFactor + efDelta).toFixed(2))));

    const nextInterval = previewNextIntervalDays(card, rating);
    const nextReps = rating === 'again' ? 0 : card.repetitions + 1;
    const nextDue = addDaysToIso(today, nextInterval);

    return {
      ...card,
      repetitions: nextReps,
      intervalDays: nextInterval,
      milestoneStage: getNextMilestoneStage(nextInterval),
      easeFactor: nextEf,
      dueDate: nextDue,
      lastReviewedAt: new Date().toISOString(),
      lapseCount: rating === 'again' ? card.lapseCount + 1 : card.lapseCount
    };
  });

  saveSrsCards(next);
  return next;
}

export function isCardDueToday(card: SRSCard): boolean {
  return card.dueDate <= getTodayIso();
}

export function addCustomSrsCard(
  conceptId: string,
  conceptTitle: string,
  phaseNumber: number,
  prompt: string,
  answer: string
): SRSCard[] {
  const today = getTodayIso();
  const cards = loadSrsCards();
  const newCard: SRSCard = {
    id: `custom-${Date.now()}`,
    conceptId,
    phaseNumber,
    conceptTitle,
    prompt: prompt.trim(),
    answer: answer.trim(),
    source: 'custom',
    milestoneStage: 3,
    repetitions: 0,
    intervalDays: 3,
    easeFactor: 2.5,
    dueDate: today,
    lapseCount: 0
  };
  const next = [newCard, ...cards];
  saveSrsCards(next);
  return next;
}

export interface GeneratedFlashcardPayload {
  conceptId: string;
  conceptTitle: string;
  phaseNumber: number;
  challengeType?: string;
  prompt: string;
  hint?: string;
  answer: string;
  hinglishAnswer?: string;
}

export function addGeneratedSrsCards(
  generated: GeneratedFlashcardPayload[]
): { cards: SRSCard[]; addedCount: number; firstNewId: string | null } {
  const today = getTodayIso();
  const existing = loadSrsCards();
  const existingPrompts = new Set(existing.map((c) => c.prompt.trim().toLowerCase()));

  const freshCards: SRSCard[] = [];
  generated.forEach((item, idx) => {
    const cleanPrompt = item.prompt.trim();
    if (!cleanPrompt || existingPrompts.has(cleanPrompt.toLowerCase())) {
      return;
    }
    existingPrompts.add(cleanPrompt.toLowerCase());
    freshCards.push({
      id: `ai-srs-${item.conceptId}-${Date.now()}-${idx}`,
      conceptId: item.conceptId,
      phaseNumber: item.phaseNumber,
      conceptTitle: item.conceptTitle,
      challengeType: item.challengeType || 'AI Challenge',
      prompt: cleanPrompt,
      hint: item.hint?.trim() || undefined,
      answer: item.answer.trim(),
      hinglishAnswer: item.hinglishAnswer?.trim() || undefined,
      source: 'ai-generated',
      milestoneStage: 3,
      repetitions: 0,
      intervalDays: 3,
      easeFactor: 2.5,
      dueDate: today,
      lapseCount: 0
    });
  });

  const next = [...freshCards, ...existing];
  saveSrsCards(next);
  return {
    cards: next,
    addedCount: freshCards.length,
    firstNewId: freshCards[0]?.id || null
  };
}
