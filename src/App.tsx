import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RoadmapView } from './components/RoadmapView';
import { DailySchedulerView } from './components/DailySchedulerView';
import { TwentyMonthMasterPlanView } from './components/TwentyMonthMasterPlanView';
import { HindiChannelsView } from './components/HindiChannelsView';
import { FutureProjectsLab } from './components/FutureProjectsLab';
import { CareersView } from './components/CareersView';
import { FutureOutlookView } from './components/FutureOutlookView';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ExportModal, RestoredBackupPayload } from './components/ExportModal';
import { StreakCelebrationModal } from './components/StreakCelebrationModal';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { ImageStudioView } from './components/ImageStudioView';
import { ThreeNeuralVisualizer } from './components/ThreeNeuralVisualizer';
import { CloudSyncModal } from './components/CloudSyncModal';
import { FloatingAiTutor } from './components/FloatingAiTutor';
import { ApiDocsModal } from './components/ApiDocsModal';
import { LoadingPage } from './components/LoadingPage';
import { ScheduleQuickTabs } from './components/ScheduleQuickTabs';
import { AchievementsView } from './components/AchievementsView';
import { DailyQuoteBanner } from './components/DailyQuoteBanner';
import { MemoryRetentionView } from './components/MemoryRetentionView';
import { CodeRagLabView } from './components/CodeRagLabView';
import { useAuth } from './firebase/authContext';
import { Language, SchedulePace, ProjectDetails, StreakMilestone, StreakState, StudyReminderConfig, LearnerTutorContext } from './types';
import {
  STREAK_MILESTONES,
  getMatchedMilestone,
  playMilestoneFanfare,
  fireMilestoneConfetti
} from './data/streakData';
import { ROADMAP_PHASES } from './data/roadmapData';
import { generateDailySchedule } from './data/dailyScheduleData';
import { sendGentleStudyNotification } from './utils/studyNotifications';
import { generateProgressAndNotesPdf } from './utils/pdfGenerator';
import { BellRing, X } from 'lucide-react';

const DEFAULT_REMINDER_CONFIG: StudyReminderConfig = {
  enabled: false,
  time: '20:00',
  daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
  gentleTone: true
};

export default function App() {
  const { user, loading: isAuthLoading, dbMode, saveProgress, loadProgress, subscribeProgress } = useAuth();
  const [showLoadingScreen, setShowLoadingScreen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('twenty-month-plan');
  const [language, setLanguage] = useState<Language>('hinglish');
  const [pace, setPace] = useState<SchedulePace>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_pace');
      return (saved as SchedulePace) || '20-months';
    } catch {
      return '20-months';
    }
  });
  const [selectedPlannerDay, setSelectedPlannerDay] = useState<number>(1);

  // Persistence for user progress
  const [completedConcepts, setCompletedConcepts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_completed_concepts');
      return saved ? JSON.parse(saved) : ['p0-1', 'p0-2'];
    } catch {
      return ['p0-1', 'p0-2'];
    }
  });

  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_completed_days');
      return saved ? JSON.parse(saved) : [1, 2, 3];
    } catch {
      return [1, 2, 3];
    }
  });

  // Streak state management
  const [streakState, setStreakState] = useState<StreakState>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_streak_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      currentStreak: 3,
      longestStreak: 5,
      lastCompletedDate: todayStr,
      historyDates: [todayStr],
      celebratedMilestones: [3]
    };
  });

  const [activeMilestoneCelebration, setActiveMilestoneCelebration] =
    useState<StreakMilestone | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_dark_mode');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [reminderConfig, setReminderConfig] = useState<StudyReminderConfig>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_study_reminder');
      if (saved) return { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_REMINDER_CONFIG;
  });

  const [inAppReminderToast, setInAppReminderToast] = useState<{ title: string; body: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [memoryLabSubTab, setMemoryLabSubTab] = useState<'srs' | 'feynman'>('srs');
  const [codeLabSubTab, setCodeLabSubTab] = useState<'python' | 'rag' | 'bugs'>('python');

  // Exit Focus Mode when leaving Daily Planner or pressing Escape
  useEffect(() => {
    if (activeTab !== 'daily-planner' && isFocusMode) {
      setIsFocusMode(false);
    }
  }, [activeTab, isFocusMode]);

  useEffect(() => {
    if (!isFocusMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Sync dark mode class with root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('ai_mastery_dark_mode', JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  // Persist pace, concepts, days, streak, and study reminder
  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_pace', pace);
    } catch {}
  }, [pace]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_study_reminder', JSON.stringify(reminderConfig));
    } catch {}
  }, [reminderConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'ai_mastery_completed_concepts',
        JSON.stringify(completedConcepts)
      );
    } catch {}
  }, [completedConcepts]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_completed_days', JSON.stringify(completedDays));
    } catch {}
  }, [completedDays]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_mastery_streak_state', JSON.stringify(streakState));
    } catch {}
  }, [streakState]);

  // Background ticker checking every 20s if Daily Study Reminder should fire via Notification API
  useEffect(() => {
    if (!reminderConfig.enabled) return;

    const checkScheduleReminder = () => {
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      if (!reminderConfig.daysOfWeek.includes(currentDayOfWeek)) return;

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;
      const todayKey = now.toISOString().split('T')[0];

      if (currentHHMM === reminderConfig.time && reminderConfig.lastNotifiedDate !== todayKey) {
        const schedule = generateDailySchedule(pace);
        const nextTask = schedule.find((t) => !completedDays.includes(t.dayNumber)) || schedule[0];

        const dispatchResult = sendGentleStudyNotification({
          dayNumber: nextTask.dayNumber,
          taskTitle: nextTask.title,
          hinglishTitle: nextTask.hinglishTitle,
          durationMins: nextTask.durationMins,
          language
        });

        setInAppReminderToast({ title: dispatchResult.title, body: dispatchResult.body });
        setReminderConfig((prev) => ({
          ...prev,
          lastNotifiedDate: todayKey
        }));
      }
    };

    checkScheduleReminder();
    const timer = window.setInterval(checkScheduleReminder, 20000);
    return () => window.clearInterval(timer);
  }, [reminderConfig, pace, completedDays, language]);

  const lastCloudFingerprintRef = useRef<string>('');
  const syncTimerRef = useRef<number | null>(null);

  const computeProgressFingerprint = (payload: {
    completedConcepts: string[];
    completedDays: number[];
    pace: SchedulePace;
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string;
    reminderConfig: StudyReminderConfig;
  }) =>
    JSON.stringify({
      c: [...payload.completedConcepts].sort(),
      d: [...payload.completedDays].sort((a, b) => a - b),
      p: payload.pace,
      cs: payload.currentStreak,
      ls: payload.longestStreak,
      lc: payload.lastCompletedDate,
      r: {
        e: Boolean(payload.reminderConfig.enabled),
        t: payload.reminderConfig.time,
        days: [...(payload.reminderConfig.daysOfWeek || [])].sort((a, b) => a - b),
        ln: payload.reminderConfig.lastNotifiedDate || '',
        g: Boolean(payload.reminderConfig.gentleTone)
      }
    });

  // Load and subscribe in real time to user progress from Firestore when authenticated
  useEffect(() => {
    const applyRemote = (remoteData: any) => {
      if (!remoteData) return;

      const nextConcepts: string[] = Array.isArray(remoteData.completedConcepts)
        ? remoteData.completedConcepts
        : completedConcepts;
      const nextDays: number[] = Array.isArray(remoteData.completedDays)
        ? remoteData.completedDays
        : completedDays;
      const nextPace: SchedulePace = (remoteData.preferredPace as SchedulePace) || pace;
      const nextReminder: StudyReminderConfig = remoteData.studyReminder
        ? { ...reminderConfig, ...remoteData.studyReminder }
        : reminderConfig;
      const nextCurrentStreak =
        remoteData.currentStreak !== undefined ? remoteData.currentStreak : streakState.currentStreak;
      const nextLongestStreak =
        remoteData.longestStreak !== undefined ? remoteData.longestStreak : streakState.longestStreak;
      const nextLastCompletedDate =
        remoteData.lastCompletedDate !== undefined
          ? remoteData.lastCompletedDate
          : streakState.lastCompletedDate;

      const incomingFp = computeProgressFingerprint({
        completedConcepts: nextConcepts,
        completedDays: nextDays,
        pace: nextPace,
        currentStreak: nextCurrentStreak,
        longestStreak: nextLongestStreak,
        lastCompletedDate: nextLastCompletedDate,
        reminderConfig: nextReminder
      });

      // Record cloud snapshot fingerprint BEFORE updating state so write effect does not echo back
      if (incomingFp === lastCloudFingerprintRef.current) {
        return;
      }
      lastCloudFingerprintRef.current = incomingFp;

      if (Array.isArray(remoteData.completedConcepts) && remoteData.completedConcepts.length > 0) {
        setCompletedConcepts((prev) =>
          JSON.stringify([...prev].sort()) === JSON.stringify([...nextConcepts].sort()) ? prev : nextConcepts
        );
      }
      if (Array.isArray(remoteData.completedDays) && remoteData.completedDays.length > 0) {
        setCompletedDays((prev) =>
          JSON.stringify([...prev].sort((a, b) => a - b)) ===
          JSON.stringify([...nextDays].sort((a, b) => a - b))
            ? prev
            : nextDays
        );
      }
      if (remoteData.preferredPace && remoteData.preferredPace !== pace) {
        setPace(nextPace);
      }
      if (remoteData.studyReminder) {
        setReminderConfig((prev) => {
          const merged = { ...prev, ...remoteData.studyReminder };
          return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
        });
      }
      if (remoteData.currentStreak !== undefined) {
        setStreakState((prev) => {
          if (
            prev.currentStreak === nextCurrentStreak &&
            prev.longestStreak === nextLongestStreak &&
            prev.lastCompletedDate === nextLastCompletedDate
          ) {
            return prev;
          }
          return {
            ...prev,
            currentStreak: nextCurrentStreak,
            longestStreak: nextLongestStreak,
            lastCompletedDate: nextLastCompletedDate
          };
        });
      }
    };

    if (user && dbMode === 'firestore-cloud') {
      loadProgress().then(applyRemote).catch(() => {});
      const unsub = subscribeProgress(applyRemote);
      return () => unsub();
    }
  }, [user, dbMode]);

  // Debounced sync to Firestore whenever local progress actually diverges from last cloud snapshot
  useEffect(() => {
    if (!user || dbMode !== 'firestore-cloud') return;

    const currentFp = computeProgressFingerprint({
      completedConcepts,
      completedDays,
      pace,
      currentStreak: streakState.currentStreak,
      longestStreak: streakState.longestStreak,
      lastCompletedDate: streakState.lastCompletedDate,
      reminderConfig
    });

    if (currentFp === lastCloudFingerprintRef.current) {
      return;
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      lastCloudFingerprintRef.current = currentFp;
      saveProgress({
        completedConcepts,
        completedDays,
        currentStreak: streakState.currentStreak,
        longestStreak: streakState.longestStreak,
        lastCompletedDate: streakState.lastCompletedDate,
        preferredPace: pace,
        studyReminder: reminderConfig
      }).catch((err) => {
        console.warn('Background Firestore sync skipped:', err?.message || err);
      });
    }, 450);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [completedConcepts, completedDays, streakState, pace, reminderConfig, user, dbMode]);

  const totalConceptsCount = ROADMAP_PHASES.flatMap((p) => p.concepts).length;

  const learnerContext: LearnerTutorContext = {
    language,
    pace,
    completedConceptsCount: completedConcepts.length,
    totalConceptsCount,
    completedDaysCount: completedDays.length,
    currentStreak: streakState.currentStreak,
    activeTab
  };

  const handleManualSyncNow = async () => {
    await saveProgress({
      completedConcepts,
      completedDays,
      currentStreak: streakState.currentStreak,
      longestStreak: streakState.longestStreak,
      lastCompletedDate: streakState.lastCompletedDate,
      preferredPace: pace,
      studyReminder: reminderConfig
    });
  };

  const toggleConcept = (id: string) => {
    if (completedConcepts.includes(id)) {
      setCompletedConcepts(completedConcepts.filter((c) => c !== id));
    } else {
      setCompletedConcepts([...completedConcepts, id]);
    }
  };

  const checkAndTriggerMilestone = (newStreak: number) => {
    const matched = getMatchedMilestone(newStreak);
    if (matched && !streakState.celebratedMilestones.includes(matched.days)) {
      setTimeout(() => {
        playMilestoneFanfare();
        setActiveMilestoneCelebration(matched);
      }, 250);
      setStreakState((prev) => ({
        ...prev,
        celebratedMilestones: [...prev.celebratedMilestones, matched.days]
      }));
    }
  };

  const toggleDay = (day: number) => {
    const isCompleting = !completedDays.includes(day);
    let newDays: number[];
    if (completedDays.includes(day)) {
      newDays = completedDays.filter((d) => d !== day);
    } else {
      newDays = [...completedDays, day];
    }
    setCompletedDays(newDays);

    const todayStr = new Date().toISOString().split('T')[0];

    if (isCompleting) {
      const newStreak = streakState.currentStreak + 1;
      const newLongest = Math.max(streakState.longestStreak, newStreak);
      setStreakState((prev) => ({
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCompletedDate: todayStr,
        historyDates: Array.from(new Set([...prev.historyDates, todayStr]))
      }));
      checkAndTriggerMilestone(newStreak);
    } else {
      const newStreak = Math.max(0, streakState.currentStreak - 1);
      setStreakState((prev) => ({
        ...prev,
        currentStreak: newStreak
      }));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isTodayCompleted =
    streakState.historyDates.includes(todayStr) ||
    completedDays.length >= streakState.currentStreak;

  const handleToggleTodayGoal = () => {
    if (isTodayCompleted) {
      // Unmark today
      const newStreak = Math.max(0, streakState.currentStreak - 1);
      setStreakState((prev) => ({
        ...prev,
        currentStreak: newStreak,
        historyDates: prev.historyDates.filter((d) => d !== todayStr)
      }));
    } else {
      // Mark today complete!
      const newStreak = streakState.currentStreak + 1;
      const newLongest = Math.max(streakState.longestStreak, newStreak);

      // Also ensure next uncompleted day in daily planner is completed
      let nextDay = 1;
      while (completedDays.includes(nextDay)) {
        nextDay++;
      }
      setCompletedDays((prev) => [...prev, nextDay]);

      setStreakState((prev) => ({
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCompletedDate: todayStr,
        historyDates: [...prev.historyDates, todayStr]
      }));

      fireMilestoneConfetti();
      checkAndTriggerMilestone(newStreak);
    }
  };

  const focusSessionActive = isFocusMode && activeTab === 'daily-planner';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
      {showLoadingScreen && (
        <LoadingPage
          isAuthLoading={isAuthLoading}
          language={language}
          completedConceptsCount={completedConcepts.length}
          currentStreak={streakState.currentStreak}
          onComplete={() => setShowLoadingScreen(false)}
        />
      )}

      {/* Top 3-Zone Navigation Header + Compact Serial Schedule Tabs (Hidden in Focus Mode) */}
      {!focusSessionActive && (
        <>
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            language={language}
            setLanguage={setLanguage}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
            onOpenApiDocs={() => setIsApiDocsOpen(true)}
            streakState={streakState}
            onToggleTodayGoal={handleToggleTodayGoal}
            isTodayCompleted={isTodayCompleted}
            onTriggerMilestoneCelebration={(milestone) => setActiveMilestoneCelebration(milestone)}
          />
          <ScheduleQuickTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            language={language}
            pace={pace}
            completedDaysCount={completedDays.length}
            completedConceptsCount={completedConcepts.length}
            totalConceptsCount={totalConceptsCount}
          />
        </>
      )}

      {/* Main Container */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 ${
          focusSessionActive ? 'max-w-6xl py-5 sm:py-7' : 'max-w-7xl py-8'
        }`}
      >
        {!focusSessionActive && <DailyQuoteBanner language={language} />}

        {activeTab === 'roadmap' && (
          <RoadmapView
            completedConcepts={completedConcepts}
            completedDays={completedDays}
            toggleConcept={toggleConcept}
            onSelectProject={setSelectedProject}
            language={language}
            onOpenRagLab={() => {
              setCodeLabSubTab('rag');
              setActiveTab('code-rag-lab');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'twenty-month-plan' && (
          <TwentyMonthMasterPlanView
            language={language}
            pace={pace}
            onSelectPace={setPace}
            onNavigateToDay={(dayNumber, targetPace) => {
              if (targetPace) {
                setPace(targetPace);
              }
              setSelectedPlannerDay(dayNumber);
              setActiveTab('daily-planner');
            }}
          />
        )}

        {activeTab === 'daily-planner' && (
          <DailySchedulerView
            pace={pace}
            setPace={setPace}
            completedDays={completedDays}
            toggleDay={toggleDay}
            language={language}
            initialDay={selectedPlannerDay}
            reminderConfig={reminderConfig}
            setReminderConfig={setReminderConfig}
            onShowInAppReminder={(title, body) => setInAppReminderToast({ title, body })}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
            completedConcepts={completedConcepts}
            onNavigateMemoryLab={(subTab) => {
              setMemoryLabSubTab(subTab || 'srs');
              setActiveTab('memory-lab');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCodeLab={(subTab) => {
              setCodeLabSubTab(subTab || 'python');
              setActiveTab('code-rag-lab');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExportProgressPdf={() =>
              generateProgressAndNotesPdf({
                pace,
                completedConcepts,
                completedDays,
                language,
                streakState,
                userEmail: user?.email || null
              })
            }
          />
        )}

        {activeTab === 'memory-lab' && (
          <MemoryRetentionView
            completedConcepts={completedConcepts}
            language={language}
            initialSubTab={memoryLabSubTab}
          />
        )}

        {activeTab === 'code-rag-lab' && (
          <CodeRagLabView
            language={language}
            initialSubTab={codeLabSubTab}
          />
        )}

        {activeTab === '3d-neural' && (
          <ThreeNeuralVisualizer language={language} />
        )}

        {activeTab === 'gemini-copilot' && (
          <GeminiChatbotView language={language} learnerContext={learnerContext} />
        )}

        {activeTab === 'image-studio' && (
          <ImageStudioView language={language} />
        )}

        {activeTab === 'hindi-playlists' && (
          <HindiChannelsView language={language} />
        )}

        {activeTab === 'future-projects' && (
          <FutureProjectsLab
            onSelectProject={setSelectedProject}
            language={language}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView
            streakState={streakState}
            completedConcepts={completedConcepts}
            completedDaysCount={completedDays.length}
            language={language}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'careers' && (
          <CareersView
            language={language}
            completedConcepts={completedConcepts}
            completedDays={completedDays}
            pace={pace}
            streakState={streakState}
            userEmail={user?.email || null}
          />
        )}

        {activeTab === 'future-outlook' && (
          <FutureOutlookView language={language} />
        )}
      </main>

      {/* Footer (Hidden in Focus Mode) */}
      {!focusSessionActive && (
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                NeuroForge AI
              </span>
              <span aria-hidden="true">·</span>
              <span>Interactive AI Engineering Mastery OS & Copilot</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <button
                onClick={() => setActiveTab('twenty-month-plan')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                01 Master Plan
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                02 Roadmap
              </button>
              <button
                onClick={() => setActiveTab('daily-planner')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                03 Daily Planner
              </button>
              <button
                onClick={() => setActiveTab('memory-lab')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors cursor-pointer"
              >
                Memory Lab
              </button>
              <button
                onClick={() => setActiveTab('code-rag-lab')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
              >
                Code & RAG Lab
              </button>
              <button
                onClick={() => setActiveTab('hindi-playlists')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                04 YouTube Playlists
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className="hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors cursor-pointer"
              >
                Achievements
              </button>
              <button
                onClick={() => setActiveTab('3d-neural')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors cursor-pointer"
              >
                3D Neural Lab
              </button>
              <button
                onClick={() => setActiveTab('gemini-copilot')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors cursor-pointer"
              >
                24/7 AI Tutor
              </button>
              <button
                onClick={() => setActiveTab('image-studio')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors cursor-pointer"
              >
                Image Studio
              </button>
              <button
                onClick={() => setActiveTab('future-projects')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Visionary Projects
              </button>
              <button
                onClick={() => setActiveTab('careers')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Career Guide
              </button>
              <button
                onClick={() => setIsApiDocsOpen(true)}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-mono font-semibold transition-colors cursor-pointer"
              >
                REST API v1
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        language={language}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pace={pace}
        completedConcepts={completedConcepts}
        completedDays={completedDays}
        language={language}
        streakState={streakState}
        reminderConfig={reminderConfig}
        userEmail={user?.email || null}
        onRestoreBackup={(restored: RestoredBackupPayload) => {
          setPace(restored.pace);
          setLanguage(restored.language);
          setCompletedConcepts(restored.completedConcepts);
          setCompletedDays(restored.completedDays);
          if (restored.streakState) {
            setStreakState(restored.streakState);
          }
          if (restored.reminderConfig) {
            setReminderConfig((prev) => ({ ...prev, ...restored.reminderConfig }));
          }
        }}
      />

      {/* Database Type & Real-time Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        language={language}
        completedConceptsCount={completedConcepts.length}
        completedDaysCount={completedDays.length}
        currentStreak={streakState.currentStreak}
        onSyncNow={handleManualSyncNow}
        onOpenExportBackup={() => setIsExportModalOpen(true)}
      />

      {/* Interactive REST API v1 Explorer */}
      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
        pace={pace}
        completedConcepts={completedConcepts}
        completedDays={completedDays}
      />

      {/* Persistent Always-On 24/7 AI Tutor Drawer (hidden inside full tutor tab and Focus Mode) */}
      {activeTab !== 'gemini-copilot' && !focusSessionActive && (
        <FloatingAiTutor
          learnerContext={learnerContext}
          onOpenFullTutor={() => setActiveTab('gemini-copilot')}
        />
      )}

      {/* Streak Milestone Celebration Modal */}
      <StreakCelebrationModal
        milestone={activeMilestoneCelebration}
        onClose={() => setActiveMilestoneCelebration(null)}
        language={language}
      />

      {/* Gentle In-App Study Reminder Toast */}
      {inAppReminderToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              {inAppReminderToast.title}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {inAppReminderToast.body}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('daily-planner');
                setInAppReminderToast(null);
              }}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Open Daily Study Planner →
            </button>
          </div>
          <button
            type="button"
            onClick={() => setInAppReminderToast(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
