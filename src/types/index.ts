export type Language = 'hinglish' | 'english';

export type SchedulePace =
  | '20-months'
  | '16-months'
  | '14-months'
  | '12-months'
  | '6-months'
  | '3-months'
  | '2-hours-daily';

export type MasterPlanMonths = 20 | 16 | 14 | 12;

export type DatabaseStorageMode = 'firestore-cloud' | 'local-browser';

export type SyncStatusState = 'synced' | 'syncing' | 'local-only' | 'error';

export interface LearnerTutorContext {
  language: Language;
  pace: SchedulePace;
  completedConceptsCount: number;
  totalConceptsCount: number;
  completedDaysCount: number;
  currentStreak: number;
  activeTab?: string;
}

export interface StudyReminderConfig {
  enabled: boolean;
  time: string; // 24h HH:MM format, e.g., "19:30"
  daysOfWeek: number[]; // 0 (Sun) to 6 (Sat)
  lastNotifiedDate?: string; // YYYY-MM-DD
  gentleTone: boolean;
}

export interface MonthMilestone {
  monthNumber: number;
  monthLabel: string;
  phaseId: string;
  phaseNumber: number;
  title: string;
  hinglishTitle: string;
  focusSummary: string;
  deliverables: string[];
  totalStudyHours: number;
}
 
export interface ConceptItem {
  id: string;
  title: string;
  description: string;
  hinglishDesc?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estHours: number;
}

export interface HindiResource {
  channelName: string;
  channelUrl: string;
  playlistTitle: string;
  playlistUrl: string;
  hostName: string;
  whyRecommended: string;
  hinglishTip: string;
  totalVideos?: number;
  tags: string[];
}

export interface ProjectDetails {
  id: string;
  title: string;
  category: 'Standard Resume' | 'Visionary Future';
  tagline: string;
  problemStatement: string;
  solutionArchitecture: string[];
  techStack: string[];
  noveltyFactor: string; // why it's unique / future-proof
  resumeBullets: string[];
  githubReadmeSnippet: string;
  keyMetrics: string;
}

export interface RoadmapPhase {
  id: string;
  phaseNumber: number;
  title: string;
  hinglishTitle: string;
  subtitle: string;
  durationWeeks: number;
  overview: string;
  hinglishOverview: string;
  concepts: ConceptItem[];
  hindiResources: HindiResource[];
  standardProject: ProjectDetails;
  visionaryProject: ProjectDetails;
  keyMilestones: string[];
}

export interface DailyTask {
  dayNumber: number;
  phaseId: string;
  phaseNumber: number;
  title: string;
  hinglishTitle: string;
  focusArea: 'Concept' | 'Coding' | 'Project' | 'Revision';
  durationMins: number;
  learningGoal: string;
  hinglishGoal: string;
  recommendedHindiPlaylist: string;
  playlistSearchQuery: string;
  handsOnTask: string;
  quickCheckQuestion: string;
  quickCheckAnswer: string;
}

export interface CareerRole {
  id: string;
  title: string;
  hinglishTitle: string;
  averageSalaryUSD: string;
  averageSalaryINR: string;
  demandLevel: 'Exploding' | 'Very High' | 'High';
  coreResponsibilities: string[];
  requiredSkills: string[];
  recommendedProjects: string[];
  topHiringSectors: string[];
  interviewQuestions: {
    question: string;
    answer: string;
    hinglishExplanation: string;
  }[];
}

export interface FutureTrend {
  id: string;
  title: string;
  timeframe: string;
  category: 'Compute' | 'Architecture' | 'Agents' | 'Hardware' | 'Security';
  summary: string;
  hinglishSummary: string;
  keyDrivers: string[];
  engineeringImplications: string[];
  actionItemForLearners: string;
}

export interface StreakMilestone {
  days: number;
  title: string;
  hinglishTitle: string;
  badge: string;
  description: string;
  hinglishDesc: string;
  rewardIcon: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  historyDates: string[];
  celebratedMilestones: number[];
}
