import { DailyTask, SchedulePace } from '../types';

export interface RebalancedWeekendTask {
  weekendIndex: number;
  weekendLabel: string;
  absorbedDays: Array<{ dayNumber: number; title: string; estCatchupMins: number }>;
  totalWeekendMins: number;
}

export interface RebalancePlanState {
  createdAt: string;
  pace: SchedulePace;
  missedDaysCount: number;
  weekendSlots: RebalancedWeekendTask[];
  preservedTimelineLabel: string;
}

export interface YoutubeTimestampBookmark {
  id: string;
  playlistKey: string;
  playlistTitle: string;
  timestamp: string; // e.g. "14:32"
  note: string;
  linkedDay: number;
  createdAt: string;
}

const REBALANCE_PLAN_KEY = 'ai_mastery_rebalance_plan_v1';
const YOUTUBE_BOOKMARKS_KEY = 'ai_mastery_yt_timestamps_v1';
const SCRATCHPAD_PREFIX = 'ai_mastery_scratchpad_day_';

export function loadRebalancePlan(): RebalancePlanState | null {
  try {
    const raw = localStorage.getItem(REBALANCE_PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearRebalancePlan() {
  try {
    localStorage.removeItem(REBALANCE_PLAN_KEY);
  } catch {}
}

/**
 * Generates and persists a catch-up schedule spreading missed day blocks across the next 1-3 weekends
 * without extending the selected master completion timeline (20/16/14/12/6/3 months).
 */
export function computeAndSaveRebalancePlan(
  pace: SchedulePace,
  schedule: DailyTask[],
  completedDays: number[],
  currentDay: number,
  missedDaysCount: number
): RebalancePlanState {
  const safeMissed = Math.min(7, Math.max(1, Math.round(missedDaysCount)));

  // Pick uncompleted days starting near currentDay or behind currentDay
  const uncompleted = schedule.filter((t) => !completedDays.includes(t.dayNumber));
  const candidatePool = uncompleted.filter((t) => t.dayNumber >= Math.max(1, currentDay - safeMissed));
  const toCatchUp = (candidatePool.length >= safeMissed ? candidatePool : uncompleted).slice(0, safeMissed);

  // Compress each missed block to ~65% essentials (concept core + key exercise) across upcoming weekends
  const weekendCount = safeMissed <= 2 ? 1 : safeMissed <= 4 ? 2 : 3;
  const slots: RebalancedWeekendTask[] = Array.from({ length: weekendCount }, (_, idx) => ({
    weekendIndex: idx + 1,
    weekendLabel: idx === 0 ? 'This Weekend (Sat–Sun)' : `Weekend +${idx + 1}`,
    absorbedDays: [],
    totalWeekendMins: 0
  }));

  toCatchUp.forEach((task, i) => {
    const bucket = slots[i % weekendCount];
    const compactMins = Math.max(35, Math.round((task.durationMins || 120) * 0.55));
    bucket.absorbedDays.push({
      dayNumber: task.dayNumber,
      title: task.title,
      estCatchupMins: compactMins
    });
    bucket.totalWeekendMins += compactMins;
  });

  const timelineMap: Record<SchedulePace, string> = {
    '20-months': '20-Month Timeline Preserved',
    '16-months': '16-Month Timeline Preserved',
    '14-months': '14-Month Timeline Preserved',
    '12-months': '12-Month Timeline Preserved',
    '6-months': '6-Month Timeline Preserved',
    '3-months': '3-Month Timeline Preserved',
    '2-hours-daily': 'Target End Date Preserved'
  };

  const plan: RebalancePlanState = {
    createdAt: new Date().toISOString(),
    pace,
    missedDaysCount: toCatchUp.length,
    weekendSlots: slots.filter((s) => s.absorbedDays.length > 0),
    preservedTimelineLabel: timelineMap[pace] || 'Target Timeline Preserved'
  };

  try {
    localStorage.setItem(REBALANCE_PLAN_KEY, JSON.stringify(plan));
  } catch {}

  return plan;
}

export function loadYoutubeBookmarks(): YoutubeTimestampBookmark[] {
  try {
    const raw = localStorage.getItem(YOUTUBE_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveYoutubeBookmarks(items: YoutubeTimestampBookmark[]) {
  try {
    localStorage.setItem(YOUTUBE_BOOKMARKS_KEY, JSON.stringify(items));
  } catch {}
}

export function addYoutubeTimestampBookmark(params: {
  playlistKey: string;
  playlistTitle: string;
  timestamp: string;
  note: string;
  linkedDay: number;
}): YoutubeTimestampBookmark[] {
  const cleanTs = params.timestamp.trim() || '00:00';
  const cleanNote = params.note.trim() || 'Key timestamp note';
  const safeDay = Math.max(1, Math.round(params.linkedDay) || 1);

  const entry: YoutubeTimestampBookmark = {
    id: `yt-${Date.now()}`,
    playlistKey: params.playlistKey,
    playlistTitle: params.playlistTitle,
    timestamp: cleanTs,
    note: cleanNote,
    linkedDay: safeDay,
    createdAt: new Date().toISOString()
  };

  const existing = loadYoutubeBookmarks();
  const next = [entry, ...existing];
  saveYoutubeBookmarks(next);

  // Append automatically into Study Scratchpad for linkedDay
  try {
    const key = `${SCRATCHPAD_PREFIX}${safeDay}`;
    const prevText = localStorage.getItem(key) || '';
    const noteLine = `[YT ${cleanTs} · ${params.playlistTitle}] ${cleanNote}`;
    const updatedText = prevText.trim() ? `${prevText.trimEnd()}\n${noteLine}` : noteLine;
    localStorage.setItem(key, updatedText);
    window.dispatchEvent(new CustomEvent('neuroforge-scratchpad-updated', { detail: { dayNumber: safeDay } }));
  } catch {}

  return next;
}

export function deleteYoutubeTimestampBookmark(id: string): YoutubeTimestampBookmark[] {
  const next = loadYoutubeBookmarks().filter((b) => b.id !== id);
  saveYoutubeBookmarks(next);
  return next;
}
