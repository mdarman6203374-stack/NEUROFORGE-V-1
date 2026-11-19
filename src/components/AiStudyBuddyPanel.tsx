import React, { useMemo, useState, useEffect } from 'react';
import {
  Users,
  Send,
  NotebookPen,
  Sparkles,
  UserPlus,
  Check,
  BookmarkPlus,
  Trash2,
  BookOpen
} from 'lucide-react';
import { DailyTask, Language } from '../types';

interface AiStudyBuddyPanelProps {
  activeTask: DailyTask;
  language: Language;
  completedDaysCount: number;
}

type BuddyStyle = 'code-first' | 'math-intuition' | 'hinglish-peer' | 'systems';

interface StudyBuddyPersona {
  id: string;
  name: string;
  initials: string;
  roleTitle: string;
  style: BuddyStyle;
  styleLabel: string;
  favoritePhases: number[];
  avatarGradient: string;
  studyTipPrefix: string;
  hinglishTipPrefix: string;
}

interface SharedNoteMessage {
  id: string;
  buddyId: string;
  dayNumber: number;
  topic: string;
  author: 'you' | 'buddy';
  text: string;
  timestamp: string;
}

const STUDY_BUDDY_ROSTER: StudyBuddyPersona[] = [
  {
    id: 'aarav-verma',
    name: 'Aarav Verma',
    initials: 'AV',
    roleTitle: 'Backend Dev → AI Engineer',
    style: 'code-first',
    styleLabel: 'Code-First Builder',
    favoritePhases: [0, 1, 4, 5, 6],
    avatarGradient: 'from-indigo-500 to-cyan-500',
    studyTipPrefix: 'Code check-in',
    hinglishTipPrefix: 'Code perspective'
  },
  {
    id: 'ananya-joshi',
    name: 'Ananya Joshi',
    initials: 'AJ',
    roleTitle: 'SDE-2 · Evening Learner',
    style: 'hinglish-peer',
    styleLabel: 'Hinglish Notes Buddy',
    favoritePhases: [0, 2, 3, 5, 7],
    avatarGradient: 'from-amber-500 to-rose-500',
    studyTipPrefix: 'Intuition summary',
    hinglishTipPrefix: 'Hinglish breakdown'
  },
  {
    id: 'rohan-kulkarni',
    name: 'Rohan Kulkarni',
    initials: 'RK',
    roleTitle: 'Data Analyst → Applied ML',
    style: 'math-intuition',
    styleLabel: 'First-Principles Math',
    favoritePhases: [0, 2, 3, 4, 8],
    avatarGradient: 'from-emerald-500 to-teal-600',
    studyTipPrefix: 'Shape & math check',
    hinglishTipPrefix: 'Math & shape check'
  },
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    initials: 'PN',
    roleTitle: 'Cloud Dev → LLMOps Track',
    style: 'systems',
    styleLabel: 'Production & Scale',
    favoritePhases: [1, 5, 6, 7, 8],
    avatarGradient: 'from-violet-500 to-indigo-600',
    studyTipPrefix: 'Latency & production note',
    hinglishTipPrefix: 'Production trade-off'
  },
  {
    id: 'kabir-sen',
    name: 'Kabir Sen',
    initials: 'KS',
    roleTitle: 'Final-Year CS · Fast Track',
    style: 'code-first',
    styleLabel: 'PyTorch & Paper Reader',
    favoritePhases: [1, 3, 4, 6, 8],
    avatarGradient: 'from-sky-500 to-blue-600',
    studyTipPrefix: 'Implementation note',
    hinglishTipPrefix: 'PyTorch tip'
  }
];

function readDayScratchpad(dayNumber: number): string {
  try {
    return localStorage.getItem(`ai_mastery_scratchpad_day_${dayNumber}`) || '';
  } catch {
    return '';
  }
}

function buildBuddySnapshotNote(
  buddy: StudyBuddyPersona,
  task: DailyTask,
  language: Language
): string {
  if (language === 'hinglish') {
    if (buddy.style === 'code-first') {
      return `Day ${task.dayNumber} (${task.focusArea}) par abhi Python drill test kar raha hoon — "${task.handsOnTask.slice(0, 72)}..."`;
    }
    if (buddy.style === 'math-intuition') {
      return `${task.focusArea} mein edge cases aur input/output dimensions verify kar raha hoon before moving forward.`;
    }
    if (buddy.style === 'systems') {
      return `Phase 0${task.phaseNumber} ke is concept ko production cost & latency trade-offs ke saath map kar rahi hoon.`;
    }
    return `"${task.hinglishTitle}" ke 3 crisp revision bullets scratchpad mein save kiye — quick recall easy ho gaya!`;
  }

  if (buddy.style === 'code-first') {
    return `Currently coding today's ${task.focusArea} exercise and testing boundary cases in Python.`;
  }
  if (buddy.style === 'math-intuition') {
    return `Writing down step-by-step intuition & shape invariants for Phase 0${task.phaseNumber}: ${task.focusArea}.`;
  }
  if (buddy.style === 'systems') {
    return `Mapping ${task.focusArea} to real deployment bottlenecks, memory usage, and failure recovery.`;
  }
  return `Summarizing "${task.title}" into 3 plain-English takeaways to lock it in before tomorrow.`;
}

function buildBuddyReply(
  buddy: StudyBuddyPersona,
  sharedText: string,
  task: DailyTask,
  language: Language
): string {
  const words = sharedText.trim().split(/\s+/).length;
  const keywordMatch =
    sharedText.toLowerCase().includes('rag') ||
    sharedText.toLowerCase().includes('lora') ||
    sharedText.toLowerCase().includes('matrix') ||
    sharedText.toLowerCase().includes('shape') ||
    sharedText.toLowerCase().includes('attention');

  if (language === 'hinglish') {
    return `${buddy.hinglishTipPrefix}: Bahut solid Day ${task.dayNumber} note (${words} words)! ${
      keywordMatch
        ? `Main bhi ${task.focusArea} ke same internals compare kar raha/rahi hoon.`
        : `Is note ko "${task.focusArea}" ke hands-on drill ke saath link karna kaafi helpful rahega.`
    } Ek quick check: kya aapne today's retention question bina answer dekhe solve kiya?`;
  }

  return `${buddy.studyTipPrefix}: Clean progress note on ${task.focusArea} (${words} words)! ${
    keywordMatch
      ? `I'm reviewing those exact mechanics for Phase 0${task.phaseNumber} right now too.`
      : `Connecting this directly to today's hands-on coding drill will make recall effortless.`
  } Quick peer check: try explaining your key takeaway in 2 sentences without peeking at your notes!`;
}

export const AiStudyBuddyPanel: React.FC<AiStudyBuddyPanelProps> = ({
  activeTask,
  language,
  completedDaysCount
}) => {
  const [styleFilter, setStyleFilter] = useState<'all' | BuddyStyle>('all');
  const [selectedBuddyId, setSelectedBuddyId] = useState<string>('aarav-verma');
  const [pairedBuddyIds, setPairedBuddyIds] = useState<string[]>(['ananya-joshi']);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [sharedMessages, setSharedMessages] = useState<SharedNoteMessage[]>([]);
  const [scratchpadPreview, setScratchpadPreview] = useState<string>(() =>
    readDayScratchpad(activeTask.dayNumber)
  );
  const [savedToScratchpadId, setSavedToScratchpadId] = useState<string | null>(null);

  // Sync scratchpad availability whenever active day changes or user edits notes
  useEffect(() => {
    const refresh = () => {
      setScratchpadPreview(readDayScratchpad(activeTask.dayNumber));
    };
    refresh();
    window.addEventListener('neuroforge-scratchpad-updated', refresh);
    return () => window.removeEventListener('neuroforge-scratchpad-updated', refresh);
  }, [activeTask.dayNumber]);

  const rankedBuddies = useMemo(() => {
    return STUDY_BUDDY_ROSTER.map((buddy, idx) => {
      const phaseMatch = buddy.favoritePhases.includes(activeTask.phaseNumber);
      const matchPct = phaseMatch ? 94 + ((activeTask.dayNumber + idx) % 6) : 84 + (idx % 6);
      const simulatedDay = Math.max(1, activeTask.dayNumber + (idx % 3) - 1);

      return {
        ...buddy,
        matchPct,
        simulatedDay,
        currentSnippet: buildBuddySnapshotNote(buddy, activeTask, language)
      };
    })
      .filter((b) => styleFilter === 'all' || b.style === styleFilter)
      .sort((a, b) => b.matchPct - a.matchPct);
  }, [activeTask, language, styleFilter]);

  const selectedBuddy =
    rankedBuddies.find((b) => b.id === selectedBuddyId) || rankedBuddies[0] || STUDY_BUDDY_ROSTER[0];

  const activeThreadMessages = useMemo(
    () => sharedMessages.filter((m) => m.buddyId === selectedBuddy.id),
    [sharedMessages, selectedBuddy.id]
  );

  const togglePairBuddy = (buddyId: string) => {
    setPairedBuddyIds((prev) =>
      prev.includes(buddyId) ? prev.filter((id) => id !== buddyId) : [...prev, buddyId]
    );
  };

  const handleLoadDayScratchpad = () => {
    const existing = readDayScratchpad(activeTask.dayNumber).trim();
    if (existing) {
      setNoteDraft(existing);
    } else {
      setNoteDraft(
        `Day ${activeTask.dayNumber} (${activeTask.focusArea}) Progress:\n- Goal studied: ${activeTask.title}\n- Key insight: `
      );
    }
  };

  const handleShareNote = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = noteDraft.trim();
    if (!cleaned) return;

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: SharedNoteMessage = {
      id: `user-${Date.now()}`,
      buddyId: selectedBuddy.id,
      dayNumber: activeTask.dayNumber,
      topic: activeTask.focusArea,
      author: 'you',
      text: cleaned,
      timestamp: nowLabel
    };

    const replyMsg: SharedNoteMessage = {
      id: `buddy-${Date.now() + 1}`,
      buddyId: selectedBuddy.id,
      dayNumber: activeTask.dayNumber,
      topic: activeTask.focusArea,
      author: 'buddy',
      text: buildBuddyReply(selectedBuddy, cleaned, activeTask, language),
      timestamp: nowLabel
    };

    setSharedMessages((prev) => [...prev, userMsg, replyMsg]);
    if (!pairedBuddyIds.includes(selectedBuddy.id)) {
      setPairedBuddyIds((prev) => [...prev, selectedBuddy.id]);
    }
    setNoteDraft('');
  };

  const handleSaveBuddyInsightToScratchpad = (msgId: string, text: string) => {
    try {
      const key = `ai_mastery_scratchpad_day_${activeTask.dayNumber}`;
      const existing = localStorage.getItem(key) || '';
      const entry = `[Study Buddy · ${selectedBuddy.name}]: ${text}`;
      const next = existing.trim() ? `${existing.trim()}\n\n${entry}` : entry;
      localStorage.setItem(key, next);
      window.dispatchEvent(
        new CustomEvent('neuroforge-scratchpad-updated', {
          detail: { dayNumber: activeTask.dayNumber }
        })
      );
      setSavedToScratchpadId(msgId);
      window.setTimeout(() => setSavedToScratchpadId(null), 1800);
    } catch {
      // Ignore storage errors gracefully
    }
  };

  const handleRemoveMessage = (msgId: string) => {
    setSharedMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  return (
    <section
      aria-label={`AI Study Buddy cohort for Day ${activeTask.dayNumber}`}
      className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {language === 'hinglish' ? 'AI Study Buddy Cohort' : 'AI Study Buddy'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                Topic: {activeTask.focusArea}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'hinglish'
                ? `Day ${activeTask.dayNumber} (Phase 0${activeTask.phaseNumber}) padhne wale simulated peers ke saath notes share karein.`
                : `Matched peer personas currently studying Phase 0${activeTask.phaseNumber} (${activeTask.focusArea}) — share progress notes in local state.`}
            </p>
          </div>
        </div>

        {/* Learning Style Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 self-start sm:self-center">
          {(
            [
              { id: 'all', label: 'All Peers' },
              { id: 'code-first', label: 'Code' },
              { id: 'math-intuition', label: 'Math' },
              { id: 'hinglish-peer', label: 'Hinglish' }
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStyleFilter(f.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                styleFilter === f.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Matched Study Buddies (Left) + Local Note Sharing Thread (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Matched Study Personas List */}
        <div className="xl:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Peers on This Topic ({rankedBuddies.length})</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {pairedBuddyIds.length} Paired
            </span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {rankedBuddies.map((buddy) => {
              const isSelected = buddy.id === selectedBuddy.id;
              const isPaired = pairedBuddyIds.includes(buddy.id);
              const msgCount = sharedMessages.filter((m) => m.buddyId === buddy.id).length;

              return (
                <div
                  key={buddy.id}
                  onClick={() => setSelectedBuddyId(buddy.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedBuddyId(buddy.id);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${buddy.avatarGradient} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {buddy.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {buddy.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 tabular-nums">
                            {buddy.matchPct}% match
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {buddy.roleTitle} · Day {buddy.simulatedDay}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePairBuddy(buddy.id);
                      }}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                        isPaired
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isPaired ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      <span>{isPaired ? 'Paired' : 'Pair'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                    “{buddy.currentSnippet}”
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{buddy.styleLabel}</span>
                    {msgCount > 0 && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {msgCount} shared notes
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Peer Note Exchange & Local Progress Sharing */}
        <div className="xl:col-span-7 flex flex-col justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
          {/* Active Buddy Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${selectedBuddy.avatarGradient} text-white font-bold text-xs flex items-center justify-center`}
              >
                {selectedBuddy.initials}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{selectedBuddy.name}</span>
                  <span className="text-[10px] font-mono font-normal text-slate-500 dark:text-slate-400">
                    · {selectedBuddy.styleLabel}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Studying Phase 0{activeTask.phaseNumber}: {activeTask.focusArea} ({completedDaysCount}{' '}
                  days completed by you)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadDayScratchpad}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/70 transition-colors cursor-pointer"
              title={`Copy your Day ${activeTask.dayNumber} scratchpad note into the share box`}
            >
              <NotebookPen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>
                {scratchpadPreview.trim()
                  ? `Load Day ${activeTask.dayNumber} Scratchpad`
                  : `Draft Day ${activeTask.dayNumber} Template`}
              </span>
            </button>
          </div>

          {/* Shared Progress Notes Feed (Local State) */}
          <div className="space-y-2.5 min-h-[170px] max-h-64 overflow-y-auto pr-1">
            {/* Initial Topic Note from Persona */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {selectedBuddy.name}&apos;s Study Log · Day {activeTask.dayNumber}
                </span>
                <span>Topic: {activeTask.focusArea}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {buildBuddySnapshotNote(selectedBuddy, activeTask, language)}
              </p>
            </div>

            {activeThreadMessages.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
                {language === 'hinglish'
                  ? `Apne Day ${activeTask.dayNumber} ke progress notes share karein — ${selectedBuddy.name} instant study feedback dega.`
                  : `Share your current progress notes or key takeaways below to exchange study feedback with ${selectedBuddy.name}.`}
              </div>
            ) : (
              activeThreadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    msg.author === 'you'
                      ? 'bg-indigo-600 text-white border-indigo-600 ml-4 sm:ml-8'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 mr-4 sm:mr-8'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 text-[10px] font-mono ${
                      msg.author === 'you' ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span className="font-bold">
                      {msg.author === 'you' ? 'You' : selectedBuddy.name} · Day {msg.dayNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMessage(msg.id)}
                        className="opacity-70 hover:opacity-100 cursor-pointer"
                        title="Remove from local thread"
                        aria-label="Remove shared note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {msg.author === 'buddy' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveBuddyInsightToScratchpad(msg.id, msg.text)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {savedToScratchpadId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Saved to Day {activeTask.dayNumber} Notes</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3 h-3 text-amber-500" />
                            <span>Save Tip to Scratchpad</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Share Progress Note Form */}
          <form onSubmit={handleShareNote} className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <textarea
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={
                language === 'hinglish'
                  ? `${selectedBuddy.name} ke saath Day ${activeTask.dayNumber} (${activeTask.focusArea}) ke progress notes ya doubts share karein...`
                  : `Share your Day ${activeTask.dayNumber} (${activeTask.focusArea}) progress notes, formulas, or insights with ${selectedBuddy.name}...`
              }
              aria-label={`Share progress notes with ${selectedBuddy.name}`}
              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Shared in session local state · {activeThreadMessages.length} notes in thread
              </span>
              <button
                type="submit"
                disabled={!noteDraft.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share Progress Note</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
