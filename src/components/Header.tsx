import React from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Download,
  Languages,
  LogOut,
  Cloud,
  HardDrive,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { Language, StreakMilestone, StreakState } from '../types';
import { StreakTracker } from './StreakTracker';
import { useAuth } from '../firebase/authContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenExport: () => void;
  onOpenCloudSync: () => void;
  onOpenApiDocs?: () => void;
  streakState: StreakState;
  onToggleTodayGoal: () => void;
  isTodayCompleted: boolean;
  onTriggerMilestoneCelebration: (milestone: StreakMilestone) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  onOpenExport,
  onOpenCloudSync,
  onOpenApiDocs,
  streakState,
  onToggleTodayGoal,
  isTodayCompleted,
  onTriggerMilestoneCelebration
}) => {
  const { user, dbMode, syncState, signInWithGoogle, signOut: firebaseSignOut, loading: authLoading } = useAuth();

  const navItems = [
    { id: 'twenty-month-plan', label: 'Master Plan' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'daily-planner', label: 'Daily Planner' },
    { id: 'memory-lab', label: 'Memory Lab' },
    { id: 'code-rag-lab', label: 'Code & RAG Lab' },
    { id: 'hindi-playlists', label: 'YouTube Playlists' },
    { id: '3d-neural', label: '3D Neural Lab' },
    { id: 'gemini-copilot', label: '24/7 AI Tutor' },
    { id: 'image-studio', label: 'Image Studio' },
    { id: 'future-projects', label: 'Future Projects' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'careers', label: 'Careers & Jobs' },
    { id: 'future-outlook', label: 'Future AI 2027+' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Interactive Brand Wordmark */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
            title="TensorPlay AI — Interactive AI Engineering Playground"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-200">
              <Sparkles className="w-5 h-5 text-cyan-200 group-hover:text-white transition-colors" />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white dark:border-slate-900" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
                  Tensor
                  <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 dark:from-cyan-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    Play
                  </span>
                  <span className="ml-1 text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  LIVE LAB
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block -mt-0.5">
                Simulate · Debug · Ship AI
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-3.5 2xl:gap-4 text-xs font-medium overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors whitespace-nowrap py-1 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Auth + Streak + Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Daily Streak Tracker */}
          <StreakTracker
            streakState={streakState}
            onToggleTodayGoal={onToggleTodayGoal}
            isTodayCompleted={isTodayCompleted}
            onTriggerMilestoneCelebration={onTriggerMilestoneCelebration}
            language={language}
          />

          {/* Database Type & Cloud Sync Pill */}
          <button
            type="button"
            onClick={onOpenCloudSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Configure Database Type & Cloud Sync"
          >
            {syncState === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : dbMode === 'firestore-cloud' && user ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden md:inline font-mono text-[11px]">
              {dbMode === 'firestore-cloud' && user
                ? syncState === 'syncing'
                  ? 'Syncing'
                  : 'Firestore'
                : 'Local DB'}
            </span>
          </button>

          {/* Firebase Authentication & Cloud Sync Widget */}
          {!authLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="hidden md:inline font-semibold text-slate-700 dark:text-slate-300 max-w-[90px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={() => firebaseSignOut()}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
                  title="Sign in with Google to sync roadmap progress and streak across devices"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'hinglish' ? 'english' : 'hinglish')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            title="Toggle between Hinglish and English explanations"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="whitespace-nowrap font-mono">{language === 'hinglish' ? 'Hinglish' : 'English'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            aria-label="Toggle dark theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* REST API Explorer Button */}
          {onOpenApiDocs && (
            <button
              type="button"
              onClick={onOpenApiDocs}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              title="Open REST API v1 Explorer & Docs"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>API</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
            title="Export AI/ML Roadmap as PDF or Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF / Plan</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation bar */}
      <div className="xl:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800 gap-2 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};

