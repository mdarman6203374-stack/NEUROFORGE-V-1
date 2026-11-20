import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Headphones,
  Volume2,
  VolumeX,
  Send,
  MonitorSmartphone,
  Flame,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../types';
import { useFocusMusic } from '../utils/focusMusicContext';

interface PeerStudyLoungeViewProps {
  language: Language;
  completedConceptsCount: number;
  completedDaysCount: number;
  userDisplayName?: string | null;
}

export interface StudyLoungeTopic {
  id: string;
  title: string;
  hinglishTitle: string;
  phaseBadge: string;
  description: string;
  defaultMinutes: number;
  accentColor: string;
}

interface OnlinePeerLearner {
  id: string;
  name: string;
  initials: string;
  role: string;
  topicId: string;
  status: 'focusing' | 'ready' | 'break';
  streakDays: number;
  dayNumber: number;
  avatarGradient: string;
  currentTask: string;
}

interface ActiveLocalSession {
  sessionId: string;
  label: string;
  topicId: string;
  lastHeartbeatMs: number;
}

interface SharedFocusTimerState {
  topicId: string;
  durationSeconds: number;
  remainingSecondsAtAnchor: number;
  isRunning: boolean;
  anchorTimestampMs: number;
  updatedBySessionId: string;
  updatedByLabel: string;
  updatedAtMs: number;
  completedSprints: number;
}

interface LoungeCheckIn {
  id: string;
  author: string;
  topicId: string;
  text: string;
  timestamp: string;
  isOwnSession?: boolean;
}

const LOUNGE_TOPICS: StudyLoungeTopic[] = [
  {
    id: 'math-linalg',
    title: 'Linear Algebra & Backprop Calculus',
    hinglishTitle: 'Linear Algebra aur Chain Rule Math',
    phaseBadge: 'Phase 0',
    description: 'Vectors, SVD, eigenvalues, multivariable gradients, and MicroGrad autograd.',
    defaultMinutes: 25,
    accentColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'pytorch-cuda',
    title: 'PyTorch Internals & CUDA Memory',
    hinglishTitle: 'PyTorch Tensors aur GPU Optimization',
    phaseBadge: 'Phase 1',
    description: 'Custom nn.Module layers, mixed precision AMP, and async inference queues.',
    defaultMinutes: 25,
    accentColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'transformers',
    title: 'Transformers & Self-Attention',
    hinglishTitle: 'Transformers aur Multi-Head Attention',
    phaseBadge: 'Phase 4',
    description: 'QKV tensor projections, RoPE positional encoding, KV-cache, and FlashAttention.',
    defaultMinutes: 50,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'hybrid-rag',
    title: 'Hybrid GraphRAG & Reranking',
    hinglishTitle: 'Hybrid Search, Reranking & Evaluation',
    phaseBadge: 'Phase 5',
    description: 'BM25 + dense fusion, cross-encoder rerankers, and RAGAS faithfulness evals.',
    defaultMinutes: 25,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'multi-agent',
    title: 'Multi-Agent Systems & MCP',
    hinglishTitle: 'Autonomous Agents aur MCP Tooling',
    phaseBadge: 'Phase 6',
    description: 'LangGraph state machines, tool execution sandboxes, and guardrail loops.',
    defaultMinutes: 25,
    accentColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'llmops-sysdesign',
    title: 'LLMOps & AI System Design',
    hinglishTitle: 'Production Latency, Quantization & Cost',
    phaseBadge: 'Phase 7',
    description: 'vLLM throughput, AWQ 4-bit quantization, latency budgets, and eval gates.',
    defaultMinutes: 50,
    accentColor: 'text-rose-600 dark:text-rose-400',
  },
];

const ONLINE_PEERS_ROSTER: OnlinePeerLearner[] = [
  {
    id: 'peer-aarav',
    name: 'Aarav Verma',
    initials: 'AV',
    role: 'Backend Dev → AI Engineer',
    topicId: 'hybrid-rag',
    status: 'focusing',
    streakDays: 19,
    dayNumber: 84,
    avatarGradient: 'from-emerald-500 to-teal-600',
    currentTask: 'Benchmarking BM25 + BGE reranker latency < 350ms',
  },
  {
    id: 'peer-ananya',
    name: 'Ananya Joshi',
    initials: 'AJ',
    role: 'SDE-2 · Evening Cohort',
    topicId: 'transformers',
    status: 'focusing',
    streakDays: 27,
    dayNumber: 112,
    avatarGradient: 'from-indigo-500 to-cyan-500',
    currentTask: 'Tracing KV-cache memory growth across 32 layers',
  },
  {
    id: 'peer-rohan',
    name: 'Rohan Kulkarni',
    initials: 'RK',
    role: 'Data Analyst → Applied ML',
    topicId: 'math-linalg',
    status: 'ready',
    streakDays: 11,
    dayNumber: 18,
    avatarGradient: 'from-sky-500 to-blue-600',
    currentTask: 'Deriving Jacobian shapes for custom MLP backward pass',
  },
  {
    id: 'peer-priya',
    name: 'Priya Nair',
    initials: 'PN',
    role: 'Cloud Dev → LLMOps Track',
    topicId: 'llmops-sysdesign',
    status: 'focusing',
    streakDays: 34,
    dayNumber: 165,
    avatarGradient: 'from-rose-500 to-amber-500',
    currentTask: 'Comparing vLLM continuous batching vs TGI P99 latency',
  },
  {
    id: 'peer-kabir',
    name: 'Kabir Sen',
    initials: 'KS',
    role: 'CS Senior · Fast Track',
    topicId: 'pytorch-cuda',
    status: 'ready',
    streakDays: 14,
    dayNumber: 41,
    avatarGradient: 'from-amber-500 to-orange-600',
    currentTask: 'Profiling torch.compile speedups on ResNet blocks',
  },
  {
    id: 'peer-meera',
    name: 'Meera Deshmukh',
    initials: 'MD',
    role: 'Product Eng → Agentic AI',
    topicId: 'multi-agent',
    status: 'break',
    streakDays: 22,
    dayNumber: 138,
    avatarGradient: 'from-violet-500 to-purple-600',
    currentTask: 'Adding human-in-the-loop approval gates to MCP tools',
  },
];

const TIMER_STORAGE_KEY = 'tensorplay_peer_lounge_timer_v1';
const SESSIONS_STORAGE_KEY = 'tensorplay_peer_lounge_sessions_v1';
const CHECKINS_STORAGE_KEY = 'tensorplay_peer_lounge_checkins_v1';
const CHANNEL_NAME = 'tensorplay_peer_lounge_sync';

function getOrCreateTabSessionId(): string {
  try {
    const existing = sessionStorage.getItem('tensorplay_tab_session_id');
    if (existing) return existing;
    const created = `sess-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('tensorplay_tab_session_id', created);
    return created;
  } catch {
    return `sess-${Date.now().toString(36)}`;
  }
}

function createInitialTimerState(): SharedFocusTimerState {
  const defaultTopic = LOUNGE_TOPICS[3]; // Hybrid GraphRAG
  return {
    topicId: defaultTopic.id,
    durationSeconds: 25 * 60,
    remainingSecondsAtAnchor: 25 * 60,
    isRunning: false,
    anchorTimestampMs: Date.now(),
    updatedBySessionId: 'initial',
    updatedByLabel: 'Lounge Host',
    updatedAtMs: Date.now(),
    completedSprints: 0,
  };
}

function readTimerState(): SharedFocusTimerState {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return createInitialTimerState();
    const parsed = JSON.parse(raw);
    if (typeof parsed?.topicId === 'string' && typeof parsed?.durationSeconds === 'number') {
      return parsed as SharedFocusTimerState;
    }
  } catch {}
  return createInitialTimerState();
}

function computeLiveRemainingSeconds(state: SharedFocusTimerState, nowMs: number): number {
  if (!state.isRunning) {
    return Math.max(0, state.remainingSecondsAtAnchor);
  }
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - state.anchorTimestampMs) / 1000));
  return Math.max(0, state.remainingSecondsAtAnchor - elapsedSeconds);
}

function readActiveSessions(nowMs: number): ActiveLocalSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const list: ActiveLocalSession[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((s) => nowMs - s.lastHeartbeatMs < 20000)
      : [];
  } catch {
    return [];
  }
}

function readCheckIns(): LoungeCheckIn[] {
  try {
    const raw = localStorage.getItem(CHECKINS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [
    {
      id: 'init-1',
      author: 'Aarav Verma',
      topicId: 'hybrid-rag',
      text: 'Locked in for a 25m sprint testing dense + BM25 RRF fusion scores.',
      timestamp: 'Just now',
    },
    {
      id: 'init-2',
      author: 'Ananya Joshi',
      topicId: 'transformers',
      text: 'Working through scaled dot-product attention dimensional intuition.',
      timestamp: '2m ago',
    },
  ];
}

export const PeerStudyLoungeView: React.FC<PeerStudyLoungeViewProps> = ({
  language,
  completedConceptsCount,
  completedDaysCount,
  userDisplayName,
}) => {
  const [tabSessionId] = useState<string>(() => getOrCreateTabSessionId());
  const sessionDisplayLabel = userDisplayName || `You (${tabSessionId.slice(-4).toUpperCase()})`;

  const [timerState, setTimerState] = useState<SharedFocusTimerState>(() => readTimerState());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [topicFilter, setTopicFilter] = useState<'all' | string>('all');
  const [activeSessions, setActiveSessions] = useState<ActiveLocalSession[]>(() =>
    readActiveSessions(Date.now())
  );
  const [checkIns, setCheckIns] = useState<LoungeCheckIn[]>(() => readCheckIns());
  const [intentionDraft, setIntentionDraft] = useState<string>('');
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(true);
  const [joinedCohortRoom, setJoinedCohortRoom] = useState<boolean>(true);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const completionHandledRef = useRef<number>(0);

  // Access global Focus Music stream controller
  const focusMusic = useFocusMusic();

  const activeTopic = useMemo(
    () => LOUNGE_TOPICS.find((t) => t.id === timerState.topicId) || LOUNGE_TOPICS[0],
    [timerState.topicId]
  );

  const liveRemainingSeconds = computeLiveRemainingSeconds(timerState, nowMs);

  const playCompletionChime = () => {
    if (!chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.65);
      });
    } catch {}
  };

  // Persist + broadcast shared timer changes to all active sessions/tabs
  const commitTimerState = (next: SharedFocusTimerState) => {
    setTimerState(next);
    setNowMs(Date.now());
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    try {
      channelRef.current?.postMessage({ type: 'TIMER_SYNC', payload: next });
    } catch {}
  };

  // Heartbeat registration for local multi-tab session presence
  const publishSessionHeartbeat = (topicIdToReport: string) => {
    const now = Date.now();
    try {
      const existing = readActiveSessions(now).filter((s) => s.sessionId !== tabSessionId);
      const updated: ActiveLocalSession[] = [
        {
          sessionId: tabSessionId,
          label: sessionDisplayLabel,
          topicId: topicIdToReport,
          lastHeartbeatMs: now,
        },
        ...existing,
      ];
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      setActiveSessions(updated);
      channelRef.current?.postMessage({ type: 'SESSIONS_SYNC', payload: updated });
    } catch {}
  };

  // Subscribe to BroadcastChannel + storage events for instant multi-tab sync
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = bc;
        bc.onmessage = (event) => {
          const msg = event.data;
          if (!msg) return;
          if (msg.type === 'TIMER_SYNC' && msg.payload) {
            setTimerState(msg.payload);
            setNowMs(Date.now());
          } else if (msg.type === 'SESSIONS_SYNC' && Array.isArray(msg.payload)) {
            setActiveSessions(msg.payload);
          } else if (msg.type === 'CHECKINS_SYNC' && Array.isArray(msg.payload)) {
            setCheckIns(msg.payload);
          }
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TIMER_STORAGE_KEY && e.newValue) {
        try {
          setTimerState(JSON.parse(e.newValue));
          setNowMs(Date.now());
        } catch {}
      } else if (e.key === SESSIONS_STORAGE_KEY && e.newValue) {
        try {
          setActiveSessions(readActiveSessions(Date.now()));
        } catch {}
      } else if (e.key === CHECKINS_STORAGE_KEY && e.newValue) {
        try {
          setCheckIns(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    publishSessionHeartbeat(timerState.topicId);

    const heartbeatInterval = window.setInterval(() => {
      publishSessionHeartbeat(timerState.topicId);
    }, 4000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(heartbeatInterval);
      try {
        const remaining = readActiveSessions(Date.now()).filter(
          (s) => s.sessionId !== tabSessionId
        );
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(remaining));
        bc?.postMessage({ type: 'SESSIONS_SYNC', payload: remaining });
        bc?.close();
      } catch {}
    };
  }, [tabSessionId]);

  // Update local heartbeat topic whenever topic changes
  useEffect(() => {
    publishSessionHeartbeat(timerState.topicId);
  }, [timerState.topicId]);

  // 1-second tick while running & automatic sprint completion check
  useEffect(() => {
    const tick = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (timerState.isRunning) {
        const rem = computeLiveRemainingSeconds(timerState, current);
        if (rem <= 0 && completionHandledRef.current !== timerState.anchorTimestampMs) {
          completionHandledRef.current = timerState.anchorTimestampMs;
          playCompletionChime();
          confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
          commitTimerState({
            ...timerState,
            isRunning: false,
            remainingSecondsAtAnchor: 0,
            anchorTimestampMs: current,
            updatedBySessionId: tabSessionId,
            updatedByLabel: sessionDisplayLabel,
            updatedAtMs: current,
            completedSprints: timerState.completedSprints + 1,
          });
        }
      }
    }, 500);
    return () => window.clearInterval(tick);
  }, [timerState, chimeEnabled]);

  const handleSelectTopicAndSync = (topicId: string, autoStart = false, durationMins?: number) => {
    const topic = LOUNGE_TOPICS.find((t) => t.id === topicId) || LOUNGE_TOPICS[0];
    const secs = (durationMins ?? topic.defaultMinutes) * 60;
    const now = Date.now();
    setJoinedCohortRoom(true);
    commitTimerState({
      ...timerState,
      topicId: topic.id,
      durationSeconds: secs,
      remainingSecondsAtAnchor: secs,
      isRunning: autoStart,
      anchorTimestampMs: now,
      updatedBySessionId: tabSessionId,
      updatedByLabel: sessionDisplayLabel,
      updatedAtMs: now,
    });
  };

  const handleToggleStartPause = () => {
    const now = Date.now();
    const currentRemaining = computeLiveRemainingSeconds(timerState, now);

    if (timerState.isRunning) {
      commitTimerState({
        ...timerState,
        isRunning: false,
        remainingSecondsAtAnchor: currentRemaining,
        anchorTimestampMs: now,
        updatedBySessionId: tabSessionId,
        updatedByLabel: sessionDisplayLabel,
        updatedAtMs: now,
      });
    } else {
      const restartSecs = currentRemaining <= 0 ? timerState.durationSeconds : currentRemaining;
      commitTimerState({
        ...timerState,
        isRunning: true,
        remainingSecondsAtAnchor: restartSecs,
        anchorTimestampMs: now,
        updatedBySessionId: tabSessionId,
        updatedByLabel: sessionDisplayLabel,
        updatedAtMs: now,
      });
    }
  };

  const handleResetTimer = (newDurationMinutes?: number) => {
    const now = Date.now();
    const secs = newDurationMinutes ? newDurationMinutes * 60 : timerState.durationSeconds;
    commitTimerState({
      ...timerState,
      durationSeconds: secs,
      remainingSecondsAtAnchor: secs,
      isRunning: false,
      anchorTimestampMs: now,
      updatedBySessionId: tabSessionId,
      updatedByLabel: sessionDisplayLabel,
      updatedAtMs: now,
    });
  };

  const handleAddFiveMinutes = () => {
    const now = Date.now();
    const currentRem = computeLiveRemainingSeconds(timerState, now);
    commitTimerState({
      ...timerState,
      durationSeconds: Math.max(timerState.durationSeconds, currentRem + 300),
      remainingSecondsAtAnchor: currentRem + 300,
      anchorTimestampMs: now,
      updatedBySessionId: tabSessionId,
      updatedByLabel: sessionDisplayLabel,
      updatedAtMs: now,
    });
  };

  const handlePostIntention = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = intentionDraft.trim();
    if (!cleaned) return;
    const entry: LoungeCheckIn = {
      id: `ci-${Date.now()}`,
      author: sessionDisplayLabel,
      topicId: timerState.topicId,
      text: cleaned,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwnSession: true,
    };
    const nextList = [entry, ...checkIns].slice(0, 20);
    setCheckIns(nextList);
    setIntentionDraft('');
    try {
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(nextList));
      channelRef.current?.postMessage({ type: 'CHECKINS_SYNC', payload: nextList });
    } catch {}
  };

  const filteredPeers = useMemo(() => {
    return ONLINE_PEERS_ROSTER.filter(
      (p) => topicFilter === 'all' || p.topicId === topicFilter
    );
  }, [topicFilter]);

  const mins = Math.floor(liveRemainingSeconds / 60);
  const secs = liveRemainingSeconds % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPct =
    timerState.durationSeconds > 0
      ? Math.round(
          ((timerState.durationSeconds - liveRemainingSeconds) / timerState.durationSeconds) * 100
        )
      : 0;

  const ringRadius = 64;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressPct / 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PEER STUDY LOUNGE</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-indigo-300">
                {ONLINE_PEERS_ROSTER.length + Math.max(1, activeSessions.length)} Online Now ·{' '}
                {Math.max(1, activeSessions.length)} Local Tab Session(s) Synced
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {language === 'hinglish'
                ? 'Live Peer Study Lounge & Synchronized Focus Timer'
                : 'Peer Study Lounge & Synchronized Focus Timer'}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {language === 'hinglish'
                ? 'Online learners ke saath topic chunein aur ek shared Focus Timer start karein — timer aapke sabhi active browser sessions mein live sync hota hai.'
                : 'Browse active learners by study topic, join a focus room, and run a shared Focus Timer synchronized in real time across your active local browser sessions.'}
            </p>
          </div>

          {/* Live Room Status Card */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0 space-y-2 min-w-[230px]">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>ACTIVE ROOM</span>
              <span className="text-emerald-400 font-bold">{activeTopic.phaseBadge}</span>
            </div>
            <div className="text-sm font-bold text-white truncate max-w-[240px]">
              {language === 'hinglish' ? activeTopic.hinglishTitle : activeTopic.title}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-700/60">
              <span>{timerState.completedSprints} sprints finished</span>
              <span className="font-mono text-indigo-300">
                {completedConceptsCount} concepts · {completedDaysCount}d
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 12-Col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Topic Selector & Online Learners Directory */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Choose Topic Room */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Select Study Topic Room to Sync
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Click any room to switch & sync timer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LOUNGE_TOPICS.map((topic) => {
                const isSelected = timerState.topicId === topic.id;
                const peerCountInTopic = ONLINE_PEERS_ROSTER.filter(
                  (p) => p.topicId === topic.id
                ).length;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopicAndSync(topic.id, false)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/30'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className={`font-bold ${topic.accentColor}`}>{topic.phaseBadge}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {peerCountInTopic} peers · {topic.defaultMinutes}m
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {language === 'hinglish' ? topic.hinglishTitle : topic.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {topic.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Online Learners & Active Local Sessions */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Online Learners ({filteredPeers.length + activeSessions.length})
                </h2>
              </div>

              {/* Filter by Topic */}
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                aria-label="Filter online learners by topic"
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Topics ({ONLINE_PEERS_ROSTER.length})</option>
                {LOUNGE_TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.phaseBadge}: {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Local Browser Sessions Strip */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                  <MonitorSmartphone className="w-3.5 h-3.5" />
                  Synced Local Sessions ({Math.max(1, activeSessions.length)})
                </span>
                <span>Open another tab to watch live cross-session sync</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(activeSessions.length > 0
                  ? activeSessions
                  : [
                      {
                        sessionId: tabSessionId,
                        label: sessionDisplayLabel,
                        topicId: timerState.topicId,
                        lastHeartbeatMs: nowMs,
                      },
                    ]
                ).map((sess) => {
                  const sessTopic =
                    LOUNGE_TOPICS.find((t) => t.id === sess.topicId) || LOUNGE_TOPICS[0];
                  const isMe = sess.sessionId === tabSessionId;
                  return (
                    <div
                      key={sess.sessionId}
                      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold">{isMe ? 'This Tab' : sess.label}</span>
                      <span className="opacity-75 text-[10px] font-mono">
                        · {sessTopic.phaseBadge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peer Learners Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPeers.map((peer) => {
                const peerTopic =
                  LOUNGE_TOPICS.find((t) => t.id === peer.topicId) || LOUNGE_TOPICS[0];
                const isSameTopic = timerState.topicId === peer.topicId;

                return (
                  <div
                    key={peer.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      isSameTopic
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-tr ${peer.avatarGradient} text-white font-bold text-xs flex items-center justify-center`}
                            >
                              {peer.initials}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                peer.status === 'focusing'
                                  ? 'bg-emerald-500'
                                  : peer.status === 'ready'
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-400'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {peer.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {peer.role}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 shrink-0">
                          <Flame className="w-3 h-3" />
                          {peer.streakDays}d
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className={`font-bold ${peerTopic.accentColor}`}>
                            {peerTopic.phaseBadge} · {peerTopic.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                          {peer.currentTask}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                        {peer.status === 'focusing'
                          ? 'In Deep Focus'
                          : peer.status === 'ready'
                          ? 'Starting Sprint'
                          : 'Short Break'}{' '}
                        · Day {peer.dayNumber}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSelectTopicAndSync(
                            peer.topicId,
                            true,
                            peerTopic.defaultMinutes
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                          isSameTopic && timerState.isRunning
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>
                          {isSameTopic && timerState.isRunning ? 'Synced' : 'Join Sprint'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Shared Synchronized Focus Timer + Intentions + Music */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          {/* Synchronized Shared Focus Timer Card */}
          <div
            className={`p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm space-y-5 transition-colors ${
              timerState.isRunning
                ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Radio
                    className={`w-3.5 h-3.5 ${
                      timerState.isRunning ? 'text-emerald-500 animate-pulse' : ''
                    }`}
                  />
                  <span>Shared Focus Timer</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {joinedCohortRoom ? `Room: ${activeTopic.title}` : 'Solo Draft'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChimeEnabled((prev) => !prev)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                title={chimeEnabled ? 'Mute sprint completion chime' : 'Enable sprint chime'}
                aria-label={chimeEnabled ? 'Mute sprint chime' : 'Enable sprint chime'}
              >
                {chimeEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Circular Countdown Stage */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 148 148">
                  <circle
                    cx="74"
                    cy="74"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="74"
                    cy="74"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className={`transition-all duration-500 ${
                      timerState.isRunning
                        ? 'text-emerald-500'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {formattedCountdown}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                    {timerState.isRunning
                      ? 'SYNCED RUNNING'
                      : liveRemainingSeconds === 0
                      ? 'SPRINT COMPLETE'
                      : 'READY TO SYNC'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-center">
                Last synced by <span className="font-semibold text-slate-700 dark:text-slate-200">{timerState.updatedByLabel}</span>
              </div>
            </div>

            {/* Duration Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 25, 50, 5].map((minsOpt) => {
                const isSelectedPreset = Math.round(timerState.durationSeconds / 60) === minsOpt;
                return (
                  <button
                    key={minsOpt}
                    type="button"
                    onClick={() => handleResetTimer(minsOpt)}
                    className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isSelectedPreset
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {minsOpt === 5 ? '5m Brk' : `${minsOpt}m`}
                  </button>
                );
              })}
            </div>

            {/* Primary Transport Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleStartPause}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                  timerState.isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {timerState.isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Shared Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Shared Focus Timer</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAddFiveMinutes}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold cursor-pointer"
                title="Add 5 minutes to shared sprint"
              >
                +5m
              </button>

              <button
                type="button"
                onClick={() => handleResetTimer()}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Reset shared timer"
                aria-label="Reset shared focus timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Focus Stream Tie-In */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Headphones className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {focusMusic.activeStream.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {focusMusic.activeStream.categoryLabel} · {focusMusic.isPlaying ? 'Playing' : 'Paused'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => focusMusic.togglePlay()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer"
                >
                  {focusMusic.isPlaying ? 'Pause' : 'Play Audio'}
                </button>
                <button
                  type="button"
                  onClick={() => focusMusic.stepStream(1)}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer"
                  title="Next curated focus stream"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Room Intentions & Synced Sprint Check-Ins */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sprint Check-Ins ({activeTopic.phaseBadge})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Live local sync</span>
            </div>

            <form onSubmit={handlePostIntention} className="flex gap-2">
              <input
                type="text"
                value={intentionDraft}
                onChange={(e) => setIntentionDraft(e.target.value)}
                maxLength={140}
                placeholder={`Post your focus goal for ${activeTopic.phaseBadge}...`}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!intentionDraft.trim()}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {checkIns.map((ci) => {
                const topicMeta = LOUNGE_TOPICS.find((t) => t.id === ci.topicId);
                return (
                  <div
                    key={ci.id}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      ci.isOwnSession
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/70'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {ci.author}
                      </span>
                      <span>
                        {topicMeta?.phaseBadge || ''} · {ci.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug">{ci.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
