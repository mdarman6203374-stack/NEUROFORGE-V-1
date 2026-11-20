import React, { useEffect, useRef, useState } from 'react';
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
  Terminal,
  Menu,
  X,
  CalendarRange,
  Map,
  CalendarCheck2,
  Users,
  Brain,
  Code2,
  Youtube,
  Box,
  Bot,
  Image as ImageIcon,
  Rocket,
  Trophy,
  Briefcase,
  Cpu,
  ChevronRight,
  FileCheck2,
  Database,
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

interface NavItemDef {
  id: string;
  label: string;
  desc: string;
  hinglishDesc: string;
  group: 'Study Plan' | 'Interactive Labs' | 'Projects & Career';
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'twenty-month-plan',
    label: 'Master Plan',
    desc: '20-Month structured AI engineering timeline',
    hinglishDesc: '20-month step-by-step roadmap & schedule',
    group: 'Study Plan',
    icon: CalendarRange,
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    desc: '9 core phases & 36 interactive concept checklists',
    hinglishDesc: 'Phases 0–8 concepts & progress tracker',
    group: 'Study Plan',
    icon: Map,
  },
  {
    id: 'daily-planner',
    label: 'Daily Planner',
    desc: 'Daily study routine, scratchpad & Focus Mode',
    hinglishDesc: 'Rozana ka study target, notes & Pomodoro',
    group: 'Study Plan',
    icon: CalendarCheck2,
  },
  {
    id: 'peer-lounge',
    label: 'Peer Lounge',
    desc: 'Online learners & synchronized Focus Timer',
    hinglishDesc: 'Live peer rooms & synced Focus Timer',
    group: 'Study Plan',
    icon: Users,
  },
  {
    id: 'hindi-playlists',
    label: 'YouTube Playlists',
    desc: 'Curated Hindi & Hinglish AI engineering playlists',
    hinglishDesc: 'Top Hindi YouTube playlists phase-wise',
    group: 'Study Plan',
    icon: Youtube,
  },
  {
    id: 'memory-lab',
    label: 'Memory Lab',
    desc: 'Spaced repetition & Gemini active recall flashcards',
    hinglishDesc: 'SRS revision & AI flashcard drills',
    group: 'Interactive Labs',
    icon: Brain,
  },
  {
    id: 'code-rag-lab',
    label: 'Code & RAG Lab',
    desc: 'Python runner, RAG simulator & System Design sandbox',
    hinglishDesc: 'Live Python, RAG & System Design sandbox',
    group: 'Interactive Labs',
    icon: Code2,
  },
  {
    id: 'vram-calculator',
    label: 'VRAM & Cost Calc',
    desc: 'Size GPU VRAM (T4/L4/A100/H100) & API vs self-host cost',
    hinglishDesc: '7B/70B GPU VRAM aur monthly cost calculator',
    group: 'Interactive Labs',
    icon: Cpu,
  },
  {
    id: 'dataset-lab',
    label: 'Dataset & Leakage',
    desc: 'Clean messy ML CSVs & fix train/test data leakage in Python',
    hinglishDesc: 'Messy CSVs clean karein aur train/test leakage fix karein',
    group: 'Interactive Labs',
    icon: Database,
  },
  {
    id: '3d-neural',
    label: '3D Neural Lab',
    desc: 'Interactive 3D attention & tensor visualizer',
    hinglishDesc: '3D neural network & attention explorer',
    group: 'Interactive Labs',
    icon: Box,
  },
  {
    id: 'gemini-copilot',
    label: '24/7 AI Tutor',
    desc: 'TensorMentor chat, search grounding & voice mentor',
    hinglishDesc: 'TensorMentor AI chat & live voice',
    group: 'Interactive Labs',
    icon: Bot,
  },
  {
    id: 'image-studio',
    label: 'Image Studio',
    desc: 'Generate your 20-month roadmap poster & visuals',
    hinglishDesc: 'Custom 20-month roadmap & diagram synth',
    group: 'Interactive Labs',
    icon: ImageIcon,
  },
  {
    id: 'future-projects',
    label: 'Future Projects',
    desc: 'Production & visionary capstone specifications',
    hinglishDesc: 'Resume & visionary AI capstone specs',
    group: 'Projects & Career',
    icon: Rocket,
  },
  {
    id: 'achievements',
    label: 'Achievements',
    desc: 'Badges, streak milestones & study activity',
    hinglishDesc: 'Badges, milestones & streak records',
    group: 'Projects & Career',
    icon: Trophy,
  },
  {
    id: 'careers',
    label: 'Careers & Jobs',
    desc: 'Domain radar, portfolio builder & mock interviews',
    hinglishDesc: 'Skill radar, resume builder & mock interview',
    group: 'Projects & Career',
    icon: Briefcase,
  },
  {
    id: 'career-kit',
    label: 'Career Kit',
    desc: '1-click ATS Resume, LinkedIn & GitHub README generator',
    hinglishDesc: '1-click Resume, LinkedIn bio & GitHub README',
    group: 'Projects & Career',
    icon: FileCheck2,
  },
  {
    id: 'future-outlook',
    label: 'Future AI 2027+',
    desc: 'Reasoning models, test-time compute & edge AI',
    hinglishDesc: '2027+ reasoning, test-time & edge trends',
    group: 'Projects & Career',
    icon: Cpu,
  },
];

const NAV_GROUPS: Array<NavItemDef['group']> = [
  'Study Plan',
  'Interactive Labs',
  'Projects & Career',
];

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
  onTriggerMilestoneCelebration,
}) => {
  const {
    user,
    dbMode,
    syncState,
    signInWithGoogle,
    signOut: firebaseSignOut,
    loading: authLoading,
  } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const activeNavItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const ActiveIcon = activeNavItem.icon;

  // Close 3-lines menu on Escape or click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSelectNav = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: 3-Lines Menu Trigger + Interactive Brand Wordmark + Current Page Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="main-nav-drawer"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            title="Open all sections (Master Plan, Roadmap, Daily Planner, Peer Lounge & more)"
            className={`inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isMenuOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
            }`}
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="text-xs font-semibold hidden md:inline">Menu</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('roadmap')}
            className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group min-w-0"
            title="TensorPlay AI — Interactive AI Engineering Playground"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-200 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-200 group-hover:text-white transition-colors" />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white dark:border-slate-900" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
                  Tensor
                  <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 dark:from-cyan-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    Play
                  </span>
                  <span className="ml-1 text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="hidden xl:inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 shrink-0">
                  LIVE LAB
                </span>
              </div>
              <span className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5 truncate">
                Simulate · Debug · Ship AI
              </span>
            </div>
          </button>

          {/* Active Section Indicator (shown cleanly on wide screens) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/70 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer truncate max-w-[180px] shrink-0"
            title="Switch section"
          >
            <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{activeNavItem.label}</span>
            <ChevronRight
              className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                isMenuOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>

        {/* Zone 3: Streak + Cloud Sync + Auth + Language + Theme + API + Export */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Configure Database Type & Cloud Sync"
          >
            {syncState === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : dbMode === 'firestore-cloud' && user ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden xl:inline font-mono text-[11px]">
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
                <div className="flex items-center gap-1.5 p-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
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
                  <span className="hidden xl:inline font-semibold text-slate-700 dark:text-slate-300 max-w-[90px] truncate">
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
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
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
                  <span className="hidden lg:inline">Sign In</span>
                </button>
              )}
            </>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'hinglish' ? 'english' : 'hinglish')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            title="Toggle between Hinglish and English explanations"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline whitespace-nowrap font-mono">
              {language === 'hinglish' ? 'Hinglish' : 'English'}
            </span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            aria-label="Toggle dark theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* REST API Explorer Button */}
          {onOpenApiDocs && (
            <button
              type="button"
              onClick={onOpenApiDocs}
              className="hidden md:flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              title="Open REST API v1 Explorer & Docs"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>API</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
            title="Export AI/ML Roadmap as PDF or Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Export PDF / Plan</span>
          </button>
        </div>
      </div>

      {/* Expandable 3-Lines Navigation Menu Panel */}
      {isMenuOpen && (
        <div
          id="main-nav-drawer"
          role="navigation"
          aria-label="All website sections"
          className="absolute inset-x-0 top-16 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {NAV_GROUPS.map((group) => {
                const items = NAV_ITEMS.filter((item) => item.group === group);
                return (
                  <div key={group} className="space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      {group}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectNav(item.id)}
                            className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500/20'
                                : 'bg-slate-50/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.label}
                                </span>
                                {isActive && (
                                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {language === 'hinglish' ? item.hinglishDesc : item.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Utility Controls Strip for narrow mobile viewports */}
            <div className="sm:hidden pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setLanguage(language === 'hinglish' ? 'english' : 'hinglish')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-mono">{language === 'hinglish' ? 'Hinglish' : 'English'}</span>
              </button>

              {onOpenApiDocs && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenApiDocs();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                  <span>REST API</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
