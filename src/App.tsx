import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RoadmapView } from './components/RoadmapView';
import { DailySchedulerView } from './components/DailySchedulerView';
import { TwentyMonthMasterPlanView } from './components/TwentyMonthMasterPlanView';
import { HindiChannelsView } from './components/HindiChannelsView';
import { FutureProjectsLab } from './components/FutureProjectsLab';
import { CareersView } from './components/CareersView';
import { FutureOutlookView } from './components/FutureOutlookView';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ExportModal } from './components/ExportModal';
import { StreakCelebrationModal } from './components/StreakCelebrationModal';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { ImageStudioView } from './components/ImageStudioView';
import { ThreeNeuralVisualizer } from './components/ThreeNeuralVisualizer';
import { useAuth } from './firebase/authContext';
import { Language, SchedulePace, ProjectDetails, StreakMilestone, StreakState } from './types';
import {
  STREAK_MILESTONES,
  getMatchedMilestone,
  playMilestoneFanfare,
  fireMilestoneConfetti
} from './data/streakData';
import { Sparkles, Youtube, Calendar, Briefcase, TrendingUp, Code2 } from 'lucide-react';

export default function App() {
  const { user, saveProgress, loadProgress } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('twenty-month-plan');
  const [language, setLanguage] = useState<Language>('hinglish');
  const [pace, setPace] = useState<SchedulePace>('20-months');

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

  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

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

  // Persist concepts, days, and streak
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

  // Load user progress from Firestore when authenticated
  useEffect(() => {
    if (user) {
      loadProgress().then((remoteData) => {
        if (remoteData) {
          if (remoteData.completedConcepts && remoteData.completedConcepts.length > 0) {
            setCompletedConcepts(remoteData.completedConcepts);
          }
          if (remoteData.completedDays && remoteData.completedDays.length > 0) {
            setCompletedDays(remoteData.completedDays);
          }
          if (remoteData.currentStreak !== undefined) {
            setStreakState((prev) => ({
              ...prev,
              currentStreak: remoteData.currentStreak ?? prev.currentStreak,
              longestStreak: remoteData.longestStreak ?? prev.longestStreak,
              lastCompletedDate: remoteData.lastCompletedDate ?? prev.lastCompletedDate,
            }));
          }
        }
      });
    }
  }, [user]);

  // Sync to Firestore whenever progress state changes
  useEffect(() => {
    if (user) {
      saveProgress({
        completedConcepts,
        completedDays,
        currentStreak: streakState.currentStreak,
        longestStreak: streakState.longestStreak,
        lastCompletedDate: streakState.lastCompletedDate,
      });
    }
  }, [completedConcepts, completedDays, streakState, user]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
      {/* Top 3-Zone Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenExport={() => setIsExportModalOpen(true)}
        streakState={streakState}
        onToggleTodayGoal={handleToggleTodayGoal}
        isTodayCompleted={isTodayCompleted}
        onTriggerMilestoneCelebration={(milestone) => setActiveMilestoneCelebration(milestone)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'roadmap' && (
          <RoadmapView
            completedConcepts={completedConcepts}
            completedDays={completedDays}
            toggleConcept={toggleConcept}
            onSelectProject={setSelectedProject}
            language={language}
          />
        )}

        {activeTab === 'twenty-month-plan' && (
          <TwentyMonthMasterPlanView
            language={language}
            onNavigateToDay={(dayNumber) => {
              setPace('20-months');
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
          />
        )}

        {activeTab === '3d-neural' && (
          <ThreeNeuralVisualizer language={language} />
        )}

        {activeTab === 'gemini-copilot' && (
          <GeminiChatbotView language={language} />
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

        {activeTab === 'careers' && (
          <CareersView language={language} />
        )}

        {activeTab === 'future-outlook' && (
          <FutureOutlookView language={language} />
        )}
      </main>

      {/* Footer */}
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
              onClick={() => setActiveTab('roadmap')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Roadmap
            </button>
            <button
              onClick={() => setActiveTab('twenty-month-plan')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              20-Month Plan
            </button>
            <button
              onClick={() => setActiveTab('daily-planner')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Daily Schedule
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
              AI Copilot
            </button>
            <button
              onClick={() => setActiveTab('image-studio')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors cursor-pointer"
            >
              Image Studio
            </button>
            <button
              onClick={() => setActiveTab('hindi-playlists')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Hindi YouTube
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
          </div>
        </div>
      </footer>

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
      />

      {/* Streak Milestone Celebration Modal */}
      <StreakCelebrationModal
        milestone={activeMilestoneCelebration}
        onClose={() => setActiveMilestoneCelebration(null)}
        language={language}
      />
    </div>
  );
}
