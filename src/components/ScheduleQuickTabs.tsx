import React from 'react';
import {
  CalendarRange,
  Map,
  CalendarCheck2,
  Youtube,
  ChevronRight
} from 'lucide-react';
import { Language, SchedulePace } from '../types';

interface ScheduleQuickTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  pace: SchedulePace;
  completedDaysCount: number;
  completedConceptsCount: number;
  totalConceptsCount: number;
}

export const ScheduleQuickTabs: React.FC<ScheduleQuickTabsProps> = ({
  activeTab,
  setActiveTab,
  language,
  pace,
  completedDaysCount,
  completedConceptsCount,
  totalConceptsCount
}) => {
  const paceLabel =
    pace === '12-months'
      ? '12-Month Plan'
      : pace === '14-months'
      ? '14-Month Plan'
      : pace === '16-months'
      ? '16-Month Plan'
      : '20-Month Plan';

  const serialScheduleTabs = [
    {
      step: '01',
      id: 'twenty-month-plan',
      label: 'Master Plan',
      sublabel: language === 'hinglish' ? 'Schedule' : 'Timeline',
      icon: CalendarRange
    },
    {
      step: '02',
      id: 'roadmap',
      label: 'Roadmap',
      sublabel: 'Phase 0–7',
      icon: Map
    },
    {
      step: '03',
      id: 'daily-planner',
      label: 'Daily Planner',
      sublabel: language === 'hinglish' ? 'Aaj ka Target' : 'Daily Block',
      icon: CalendarCheck2
    },
    {
      step: '04',
      id: 'hindi-playlists',
      label: 'YouTube Playlist',
      sublabel: language === 'hinglish' ? 'Video Lectures' : 'Playlists',
      icon: Youtube
    }
  ];

  return (
    <div
      aria-label="Serial study schedule navigation"
      className="bg-slate-50/95 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/90 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
        {/* Compact Serialwise Schedule Tabs */}
        <div
          role="tablist"
          aria-label="Study schedule steps"
          className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
        >
          {serialScheduleTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isYoutube = tab.id === 'hindi-playlists';

            return (
              <React.Fragment key={tab.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`group flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] tabular-nums font-bold ${
                      isActive
                        ? 'text-indigo-100'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {tab.step}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : isYoutube
                        ? 'text-red-500'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  />
                  <span>{tab.label}</span>
                  <span
                    className={`hidden sm:inline text-[10px] font-normal ${
                      isActive
                        ? 'text-indigo-100/90'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    · {tab.sublabel}
                  </span>
                </button>

                {idx < serialScheduleTabs.length - 1 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side Schedule Context Summary */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
          <span>{paceLabel}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span>
            {completedConceptsCount}/{totalConceptsCount} concepts
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {completedDaysCount}d done
          </span>
        </div>
      </div>
    </div>
  );
};
