import { ROADMAP_PHASES } from '../data/roadmapData';
import { generateDailySchedule } from '../data/dailyScheduleData';
import { HINDI_CHANNELS_DATA } from '../data/hindiChannelsData';
import { CAREER_ROLES_DATA } from '../data/careerData';
import { PYTHON_AI_BOOK_CHAPTERS } from '../data/pythonBookData';
import { evaluateUserBadges } from '../data/badgesData';
import { Language, SchedulePace, StreakState, StudyReminderConfig } from '../types';
import { ProjectArtifactRecord } from './projectArtifacts';
import { FeynmanAttemptRecord, SRSCard } from './spacedRepetition';
import { RebalancePlanState, YoutubeTimestampBookmark } from './workflowFeatures';

export type CsvTier = 'schema' | 'firestore' | 'activity' | 'curriculum';

export interface CsvColumnDef {
  name: string;
  type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP';
  nullable: boolean;
  keyType: 'PK' | 'FK' | 'PK,FK' | '';
  references: string;
  description: string;
}

export type CsvRowRecord = Record<string, string | number | boolean | null | undefined>;

export interface CsvTableDef {
  tableName: string;
  fileName: string;
  folder: '' | 'firestore' | 'activity' | 'curriculum';
  tier: CsvTier;
  description: string;
  primaryKey: string;
  sourceLabel: string;
  columns: CsvColumnDef[];
  rows: CsvRowRecord[];
}

export interface FirestoreExportSnapshot {
  sourceStatus: 'live-firestore' | 'local-fallback' | 'schema-seed';
  authEmail?: string | null;
  users: Array<{
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  userProgress: Array<{
    userId: string;
    completedConcepts?: string[];
    completedDays?: number[];
    currentStreak?: number;
    longestStreak?: number;
    lastCompletedDate?: string;
    preferredPace?: string;
    studyReminder?: Partial<StudyReminderConfig>;
    updatedAt?: string;
  }>;
  chatSessions: Array<{
    sessionId: string;
    userId: string;
    title: string;
    model?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  chatMessages: Array<{
    messageId: string;
    sessionId: string;
    userId: string;
    role: string;
    content: string;
    sources?: Array<{ title?: string; url?: string }>;
    createdAt?: string;
  }>;
  generatedImages: Array<{
    imageId: string;
    userId: string;
    prompt: string;
    imageUrl?: string;
    aspectRatio?: string;
    createdAt?: string;
  }>;
}

export interface ActivityExportSnapshot {
  userId: string;
  pace: SchedulePace;
  language: Language;
  completedConcepts: string[];
  completedDays: number[];
  streakState: StreakState;
  reminderConfig?: StudyReminderConfig;
  projectArtifacts: Record<string, ProjectArtifactRecord>;
  srsCards: SRSCard[];
  conceptTimestamps: Record<string, string>;
  feynmanAttempts: FeynmanAttemptRecord[];
  scratchpads: Array<{ dayNumber: number; wordCount: number; content: string }>;
  pomodoroLogs: Array<{
    id?: string;
    date?: string;
    durationMins?: number;
    mode?: string;
    completedAt?: string;
  }>;
  youtubeBookmarks: YoutubeTimestampBookmark[];
  rebalancePlan: RebalancePlanState | null;
  bookReadChapterIds: string[];
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeTableToCsv(
  columns: CsvColumnDef[],
  rows: CsvRowRecord[],
  includeUtf8Bom = false
): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.name)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(row[col.name])).join(',')
  );
  const body = [headerLine, ...dataLines].join('\r\n') + '\r\n';
  return includeUtf8Bom ? '\uFEFF' + body : body;
}

export function buildNormalizedDatabaseTables(params: {
  firestore: FirestoreExportSnapshot;
  activity: ActivityExportSnapshot;
}): CsvTableDef[] {
  const { firestore, activity } = params;
  const tables: CsvTableDef[] = [];

  const sourceTagFirestore =
    firestore.sourceStatus === 'live-firestore'
      ? 'Firebase Firestore (Live)'
      : firestore.sourceStatus === 'local-fallback'
      ? 'Local Mirror + Firestore Schema'
      : 'Firestore Blueprint + Seed Row';

  // ---------------------------------------------------------------------------
  // 1. FIRESTORE BACKEND COLLECTIONS (1NF NORMALIZED)
  // ---------------------------------------------------------------------------
  tables.push({
    tableName: 'users',
    fileName: 'users.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: 'Firestore /users/{userId} account profiles keyed by Firebase Auth UID.',
    primaryKey: 'uid',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'uid', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Firebase Auth user UID' },
      { name: 'email', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Primary user email' },
      { name: 'displayName', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Profile display name' },
      { name: 'photoURL', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Avatar URL' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'ISO creation timestamp' },
      { name: 'updatedAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'ISO last update timestamp' },
    ],
    rows: firestore.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || '',
      photoURL: u.photoURL || '',
      createdAt: u.createdAt || '',
      updatedAt: u.updatedAt || '',
    })),
  });

  tables.push({
    tableName: 'user_progress',
    fileName: 'user_progress.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: 'Firestore /userProgress/{userId} scalar progress metrics and flattened studyReminder settings.',
    primaryKey: 'userId',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'users.uid', description: 'Owner UID' },
      { name: 'currentStreak', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Active daily streak count' },
      { name: 'longestStreak', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'All-time longest streak' },
      { name: 'lastCompletedDate', type: 'DATE', nullable: true, keyType: '', references: '', description: 'YYYY-MM-DD of last completed day' },
      { name: 'preferredPace', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Active study pace track' },
      { name: 'reminderEnabled', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Daily study notification toggle' },
      { name: 'reminderTime', type: 'STRING', nullable: true, keyType: '', references: '', description: 'HH:MM 24h reminder time' },
      { name: 'reminderGentleTone', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Gentle copy mode flag' },
      { name: 'reminderLastNotifiedDate', type: 'DATE', nullable: true, keyType: '', references: '', description: 'Last notification ISO date' },
      { name: 'updatedAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'Last cloud sync timestamp' },
    ],
    rows: firestore.userProgress.map((p) => ({
      userId: p.userId,
      currentStreak: p.currentStreak ?? 0,
      longestStreak: p.longestStreak ?? 0,
      lastCompletedDate: p.lastCompletedDate || '',
      preferredPace: p.preferredPace || '20-months',
      reminderEnabled: Boolean(p.studyReminder?.enabled),
      reminderTime: p.studyReminder?.time || '20:00',
      reminderGentleTone: p.studyReminder?.gentleTone ?? true,
      reminderLastNotifiedDate: p.studyReminder?.lastNotifiedDate || '',
      updatedAt: p.updatedAt || '',
    })),
  });

  // Normalized child: userProgress.completedConcepts[]
  const completedConceptRows: CsvRowRecord[] = [];
  firestore.userProgress.forEach((p) => {
    const concepts = Array.isArray(p.completedConcepts) ? p.completedConcepts : [];
    concepts.forEach((cid) => {
      completedConceptRows.push({
        userId: p.userId,
        conceptId: cid,
        completedDate: activity.conceptTimestamps[cid] || '',
      });
    });
  });

  tables.push({
    tableName: 'user_progress_completed_concepts',
    fileName: 'user_progress_completed_concepts.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: '1NF normalized child table for userProgress.completedConcepts array mapped to roadmap_concepts.',
    primaryKey: 'userId, conceptId',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'user_progress.userId', description: 'Learner UID' },
      { name: 'conceptId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'roadmap_concepts.conceptId', description: 'Completed roadmap concept ID' },
      { name: 'completedDate', type: 'DATE', nullable: true, keyType: '', references: '', description: 'Recorded completion date (from SRS timestamps)' },
    ],
    rows: completedConceptRows,
  });

  // Normalized child: userProgress.completedDays[]
  const completedDayRows: CsvRowRecord[] = [];
  firestore.userProgress.forEach((p) => {
    const days = Array.isArray(p.completedDays) ? p.completedDays : [];
    days.forEach((dayNum) => {
      completedDayRows.push({
        userId: p.userId,
        dayNumber: dayNum,
      });
    });
  });

  tables.push({
    tableName: 'user_progress_completed_days',
    fileName: 'user_progress_completed_days.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: '1NF normalized child table for userProgress.completedDays integer array.',
    primaryKey: 'userId, dayNumber',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'user_progress.userId', description: 'Learner UID' },
      { name: 'dayNumber', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: 'Completed planner day index' },
    ],
    rows: completedDayRows,
  });

  // Normalized child: userProgress.studyReminder.daysOfWeek[]
  const reminderDayRows: CsvRowRecord[] = [];
  firestore.userProgress.forEach((p) => {
    const dows = Array.isArray(p.studyReminder?.daysOfWeek) ? p.studyReminder!.daysOfWeek : [];
    dows.forEach((dow) => {
      reminderDayRows.push({
        userId: p.userId,
        dayOfWeek: dow,
        dayLabel: WEEKDAY_NAMES[dow] || `Day-${dow}`,
      });
    });
  });

  tables.push({
    tableName: 'user_progress_reminder_days',
    fileName: 'user_progress_reminder_days.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: '1NF normalized child table for userProgress.studyReminder.daysOfWeek array (0=Sun..6=Sat).',
    primaryKey: 'userId, dayOfWeek',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'user_progress.userId', description: 'Learner UID' },
      { name: 'dayOfWeek', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: 'Weekday integer (0-6)' },
      { name: 'dayLabel', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Human-readable weekday name' },
    ],
    rows: reminderDayRows,
  });

  // Firestore chatSessions
  tables.push({
    tableName: 'chat_sessions',
    fileName: 'chat_sessions.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: 'Firestore /chatSessions/{sessionId} AI Tutor conversation metadata.',
    primaryKey: 'sessionId',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'sessionId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Chat session ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Owner UID' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Session title' },
      { name: 'model', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Gemini model alias' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'Session created ISO timestamp' },
      { name: 'updatedAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'Last activity ISO timestamp' },
    ],
    rows: firestore.chatSessions.map((s) => ({
      sessionId: s.sessionId,
      userId: s.userId,
      title: s.title,
      model: s.model || 'gemini-4-hydrogen',
      createdAt: s.createdAt || '',
      updatedAt: s.updatedAt || '',
    })),
  });

  // Firestore chatSessions/{sessionId}/messages/{messageId}
  const chatSourceRows: CsvRowRecord[] = [];
  firestore.chatMessages.forEach((m) => {
    const srcs = Array.isArray(m.sources) ? m.sources : [];
    srcs.forEach((src, idx) => {
      chatSourceRows.push({
        messageId: m.messageId,
        sessionId: m.sessionId,
        userId: m.userId,
        sourceIndex: idx + 1,
        title: src.title || '',
        url: src.url || '',
      });
    });
  });

  tables.push({
    tableName: 'chat_messages',
    fileName: 'chat_messages.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: 'Firestore /chatSessions/{sessionId}/messages/{messageId} conversation messages.',
    primaryKey: 'messageId',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'messageId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Unique message document ID' },
      { name: 'sessionId', type: 'STRING', nullable: false, keyType: 'FK', references: 'chat_sessions.sessionId', description: 'Parent session ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Owner UID' },
      { name: 'role', type: 'STRING', nullable: false, keyType: '', references: '', description: 'user | model | system' },
      { name: 'content', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Message markdown text' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'ISO message timestamp' },
    ],
    rows: firestore.chatMessages.map((m) => ({
      messageId: m.messageId,
      sessionId: m.sessionId,
      userId: m.userId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt || '',
    })),
  });

  tables.push({
    tableName: 'chat_message_sources',
    fileName: 'chat_message_sources.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: '1NF normalized child table for Google Search grounding sources[] inside chat messages.',
    primaryKey: 'messageId, sourceIndex',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'messageId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'chat_messages.messageId', description: 'Parent message ID' },
      { name: 'sourceIndex', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1-based citation order' },
      { name: 'sessionId', type: 'STRING', nullable: false, keyType: 'FK', references: 'chat_sessions.sessionId', description: 'Parent session ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Owner UID' },
      { name: 'title', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Web page title' },
      { name: 'url', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Source URI' },
    ],
    rows: chatSourceRows,
  });

  tables.push({
    tableName: 'generated_images',
    fileName: 'generated_images.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: 'Firestore /generatedImages/{imageId} Image Studio prompts & asset references.',
    primaryKey: 'imageId',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'imageId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Generated image doc ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Owner UID' },
      { name: 'prompt', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Generation prompt' },
      { name: 'aspectRatio', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Aspect ratio e.g. 16:9' },
      { name: 'imageUrl', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Asset URI or truncated data prefix' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'ISO creation timestamp' },
    ],
    rows: firestore.generatedImages.map((img) => ({
      imageId: img.imageId,
      userId: img.userId,
      prompt: img.prompt,
      aspectRatio: img.aspectRatio || '16:9',
      imageUrl: (img.imageUrl || '').startsWith('data:')
        ? `${img.imageUrl!.slice(0, 64)}...[base64-omitted]`
        : img.imageUrl || '',
      createdAt: img.createdAt || '',
    })),
  });

  tables.push({
    tableName: 'streak_history_dates',
    fileName: 'streak_history_dates.csv',
    folder: 'firestore',
    tier: 'firestore',
    description: '1NF normalized log of active streak study dates (historyDates[]).',
    primaryKey: 'userId, activityDate',
    sourceLabel: sourceTagFirestore,
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'activityDate', type: 'DATE', nullable: false, keyType: 'PK', references: '', description: 'YYYY-MM-DD active study date' },
      { name: 'celebratedMilestoneDays', type: 'INTEGER', nullable: true, keyType: '', references: '', description: 'Matched milestone if applicable' },
    ],
    rows: (activity.streakState.historyDates || []).map((dt) => ({
      userId: activity.userId,
      activityDate: dt,
      celebratedMilestoneDays: activity.streakState.celebratedMilestones?.includes(
        activity.streakState.currentStreak
      )
        ? activity.streakState.currentStreak
        : null,
    })),
  });

  // ---------------------------------------------------------------------------
  // 2. USER ACTIVITY & BROWSER PERSISTENCE STORES (1NF NORMALIZED)
  // ---------------------------------------------------------------------------
  tables.push({
    tableName: 'project_artifacts',
    fileName: 'project_artifacts.csv',
    folder: 'activity',
    tier: 'activity',
    description: 'Portfolio & GitHub shipping status and flattened README verification checklist per project.',
    primaryKey: 'projectId',
    sourceLabel: 'Browser Store (projectArtifacts)',
    columns: [
      { name: 'projectId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'projects.projectId', description: 'Capstone project ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'status', type: 'STRING', nullable: false, keyType: '', references: '', description: 'planned | in-progress | shipped' },
      { name: 'githubUrl', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Repository URL' },
      { name: 'demoUrl', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Live demo URL' },
      { name: 'latestCommitHash', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Git commit SHA' },
      { name: 'chkArchitecture', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'README Problem & Architecture checked' },
      { name: 'chkSetup', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Reproducible setup checked' },
      { name: 'chkBenchmarks', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Benchmarks & evals checked' },
      { name: 'chkDemoMedia', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Demo GIF / screenshots checked' },
      { name: 'updatedAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'Last updated ISO timestamp' },
    ],
    rows: Object.values(activity.projectArtifacts).map((rec) => ({
      projectId: rec.projectId,
      userId: activity.userId,
      status: rec.status,
      githubUrl: rec.githubUrl || '',
      demoUrl: rec.demoUrl || '',
      latestCommitHash: rec.latestCommitHash || '',
      chkArchitecture: Boolean(rec.checklist?.problemAndArchitecture),
      chkSetup: Boolean(rec.checklist?.reproducibleSetup),
      chkBenchmarks: Boolean(rec.checklist?.benchmarksAndEvals),
      chkDemoMedia: Boolean(rec.checklist?.demoGifOrScreenshots),
      updatedAt: rec.updatedAt || '',
    })),
  });

  tables.push({
    tableName: 'srs_cards',
    fileName: 'srs_cards.csv',
    folder: 'activity',
    tier: 'activity',
    description: 'Memory Lab Spaced-Repetition (SM-2) flashcards queue and review scheduling state.',
    primaryKey: 'id',
    sourceLabel: 'Browser Store (srsCards)',
    columns: [
      { name: 'id', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'SRS card identifier' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'conceptId', type: 'STRING', nullable: false, keyType: 'FK', references: 'roadmap_concepts.conceptId', description: 'Linked concept ID' },
      { name: 'phaseNumber', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Roadmap phase number' },
      { name: 'conceptTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Concept title' },
      { name: 'source', type: 'STRING', nullable: false, keyType: '', references: '', description: 'concept-milestone | weak-quiz | custom | ai-generated' },
      { name: 'milestoneStage', type: 'INTEGER', nullable: false, keyType: '', references: '', description: '3 | 7 | 21 | 60 day milestone' },
      { name: 'repetitions', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Consecutive recall count' },
      { name: 'intervalDays', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Next review interval in days' },
      { name: 'easeFactor', type: 'FLOAT', nullable: false, keyType: '', references: '', description: 'SM-2 ease multiplier' },
      { name: 'dueDate', type: 'DATE', nullable: false, keyType: '', references: '', description: 'YYYY-MM-DD due date' },
      { name: 'completedOnDate', type: 'DATE', nullable: true, keyType: '', references: '', description: 'Initial concept completion date' },
      { name: 'lastReviewedAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'Last review ISO timestamp' },
      { name: 'lapseCount', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Times rated Again' },
      { name: 'prompt', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Active-recall prompt' },
      { name: 'answer', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Reference answer' },
    ],
    rows: activity.srsCards.map((c) => ({
      id: c.id,
      userId: activity.userId,
      conceptId: c.conceptId,
      phaseNumber: c.phaseNumber,
      conceptTitle: c.conceptTitle,
      source: c.source,
      milestoneStage: c.milestoneStage,
      repetitions: c.repetitions,
      intervalDays: c.intervalDays,
      easeFactor: c.easeFactor,
      dueDate: c.dueDate,
      completedOnDate: c.completedOnDate || '',
      lastReviewedAt: c.lastReviewedAt || '',
      lapseCount: c.lapseCount,
      prompt: c.prompt,
      answer: c.answer,
    })),
  });

  const feynmanFeedbackRows: CsvRowRecord[] = [];
  activity.feynmanAttempts.forEach((att) => {
    const pushGroup = (kind: string, arr?: string[]) => {
      (arr || []).forEach((txt, i) => {
        feynmanFeedbackRows.push({
          attemptId: att.id,
          feedbackType: kind,
          itemOrder: i + 1,
          itemText: txt,
        });
      });
    };
    pushGroup('strength', att.strengths);
    pushGroup('missingIntuition', att.missingIntuition);
    pushGroup('jargonTrap', att.jargonTraps);
    pushGroup('accuracyNote', att.accuracyNotes);
  });

  tables.push({
    tableName: 'feynman_attempts',
    fileName: 'feynman_attempts.csv',
    folder: 'activity',
    tier: 'activity',
    description: '60-second Feynman Technique learner explanations graded by Gemini.',
    primaryKey: 'id',
    sourceLabel: 'Browser Store (feynmanHistory)',
    columns: [
      { name: 'id', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Attempt ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'conceptId', type: 'STRING', nullable: false, keyType: 'FK', references: 'roadmap_concepts.conceptId', description: 'Evaluated concept ID' },
      { name: 'conceptTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Concept title' },
      { name: 'mode', type: 'STRING', nullable: false, keyType: '', references: '', description: 'voice | text' },
      { name: 'durationSecondsUsed', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Seconds spent' },
      { name: 'clarityScore', type: 'INTEGER', nullable: false, keyType: '', references: '', description: '0-100 score' },
      { name: 'intuitionScore', type: 'INTEGER', nullable: false, keyType: '', references: '', description: '0-100 score' },
      { name: 'simplicityScore', type: 'INTEGER', nullable: false, keyType: '', references: '', description: '0-100 score' },
      { name: 'accuracyScore', type: 'INTEGER', nullable: true, keyType: '', references: '', description: '0-100 score' },
      { name: 'verdictHeadline', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Summary verdict' },
      { name: 'transcript', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Student explanation text' },
      { name: 'simplifiedAnalogy', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Gemini reference analogy' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: false, keyType: '', references: '', description: 'Attempt ISO timestamp' },
    ],
    rows: activity.feynmanAttempts.map((a) => ({
      id: a.id,
      userId: activity.userId,
      conceptId: a.conceptId,
      conceptTitle: a.conceptTitle,
      mode: a.mode,
      durationSecondsUsed: a.durationSecondsUsed,
      clarityScore: a.clarityScore,
      intuitionScore: a.intuitionScore,
      simplicityScore: a.simplicityScore,
      accuracyScore: a.accuracyScore ?? null,
      verdictHeadline: a.verdictHeadline,
      transcript: a.transcript,
      simplifiedAnalogy: a.simplifiedAnalogy,
      createdAt: a.createdAt,
    })),
  });

  tables.push({
    tableName: 'feynman_feedback_items',
    fileName: 'feynman_feedback_items.csv',
    folder: 'activity',
    tier: 'activity',
    description: '1NF normalized child table for Feynman strengths[], missingIntuition[], jargonTraps[], and accuracyNotes[].',
    primaryKey: 'attemptId, feedbackType, itemOrder',
    sourceLabel: 'Browser Store (feynmanHistory)',
    columns: [
      { name: 'attemptId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'feynman_attempts.id', description: 'Parent attempt ID' },
      { name: 'feedbackType', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'strength | missingIntuition | jargonTrap | accuracyNote' },
      { name: 'itemOrder', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1-based item index' },
      { name: 'itemText', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Feedback bullet text' },
    ],
    rows: feynmanFeedbackRows,
  });

  tables.push({
    tableName: 'study_scratchpad_notes',
    fileName: 'study_scratchpad_notes.csv',
    folder: 'activity',
    tier: 'activity',
    description: 'Per-day Markdown study notes persisted from the Daily Planner Scratchpad.',
    primaryKey: 'dayNumber',
    sourceLabel: 'Browser Store (scratchpadNotes)',
    columns: [
      { name: 'dayNumber', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: 'Study day number' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'wordCount', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Computed word count' },
      { name: 'noteContent', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Full note text' },
    ],
    rows: activity.scratchpads.map((s) => ({
      dayNumber: s.dayNumber,
      userId: activity.userId,
      wordCount: s.wordCount,
      noteContent: s.content,
    })),
  });

  tables.push({
    tableName: 'pomodoro_logs',
    fileName: 'pomodoro_logs.csv',
    folder: 'activity',
    tier: 'activity',
    description: 'Completed Pomodoro focus sessions logged by date and duration.',
    primaryKey: 'id',
    sourceLabel: 'Browser Store (pomodoroLogs)',
    columns: [
      { name: 'id', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Session log ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'dateIso', type: 'DATE', nullable: false, keyType: '', references: '', description: 'YYYY-MM-DD session date' },
      { name: 'durationMins', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Focus minutes completed' },
      { name: 'mode', type: 'STRING', nullable: false, keyType: '', references: '', description: 'focus | break' },
      { name: 'completedAt', type: 'TIMESTAMP', nullable: true, keyType: '', references: '', description: 'Completion ISO timestamp' },
    ],
    rows: activity.pomodoroLogs.map((log, i) => ({
      id: log.id || `pomo-${i + 1}`,
      userId: activity.userId,
      dateIso: log.date || (log.completedAt ? log.completedAt.split('T')[0] : ''),
      durationMins: log.durationMins ?? 25,
      mode: log.mode || 'focus',
      completedAt: log.completedAt || '',
    })),
  });

  tables.push({
    tableName: 'youtube_bookmarks',
    fileName: 'youtube_bookmarks.csv',
    folder: 'activity',
    tier: 'activity',
    description: 'Saved Hindi YouTube lecture timestamp bookmarks linked to Daily Planner days.',
    primaryKey: 'id',
    sourceLabel: 'Browser Store (ytTimestamps)',
    columns: [
      { name: 'id', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Bookmark ID' },
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'playlistKey', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Channel/playlist slug' },
      { name: 'playlistTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Playlist title' },
      { name: 'timestamp', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Video timestamp MM:SS' },
      { name: 'note', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Learner note' },
      { name: 'linkedDay', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Linked study day' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: false, keyType: '', references: '', description: 'ISO timestamp' },
    ],
    rows: activity.youtubeBookmarks.map((b) => ({
      id: b.id,
      userId: activity.userId,
      playlistKey: b.playlistKey,
      playlistTitle: b.playlistTitle,
      timestamp: b.timestamp,
      note: b.note,
      linkedDay: b.linkedDay,
      createdAt: b.createdAt,
    })),
  });

  const rebalanceRows: CsvRowRecord[] = [];
  if (activity.rebalancePlan?.weekendSlots) {
    activity.rebalancePlan.weekendSlots.forEach((slot) => {
      slot.absorbedDays.forEach((d) => {
        rebalanceRows.push({
          userId: activity.userId,
          pace: activity.rebalancePlan!.pace,
          weekendIndex: slot.weekendIndex,
          weekendLabel: slot.weekendLabel,
          dayNumber: d.dayNumber,
          title: d.title,
          estCatchupMins: d.estCatchupMins,
          createdAt: activity.rebalancePlan!.createdAt,
        });
      });
    });
  }

  tables.push({
    tableName: 'weekend_rebalance_slots',
    fileName: 'weekend_rebalance_slots.csv',
    folder: 'activity',
    tier: 'activity',
    description: '1NF normalized catch-up blocks generated when missed study days are rebalanced into weekends.',
    primaryKey: 'userId, weekendIndex, dayNumber',
    sourceLabel: 'Browser Store (rebalancePlan)',
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'pace', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Schedule pace track' },
      { name: 'weekendIndex', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1..3 weekend bucket' },
      { name: 'weekendLabel', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Readable weekend label' },
      { name: 'dayNumber', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: 'Absorbed study day' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Study day title' },
      { name: 'estCatchupMins', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Compressed catch-up minutes' },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: false, keyType: '', references: '', description: 'Plan generation timestamp' },
    ],
    rows: rebalanceRows,
  });

  tables.push({
    tableName: 'book_read_progress',
    fileName: 'book_read_progress.csv',
    folder: 'activity',
    tier: 'activity',
    description: 'Completed chapters tracked inside the interactive Python & AI Engineering Book reader.',
    primaryKey: 'userId, chapterId',
    sourceLabel: 'Browser Store (pythonBookRead)',
    columns: [
      { name: 'userId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'users.uid', description: 'Learner UID' },
      { name: 'chapterId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'python_book_chapters.chapterId', description: 'Completed chapter ID' },
      { name: 'completed', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Completion flag' },
    ],
    rows: activity.bookReadChapterIds.map((chId) => ({
      userId: activity.userId,
      chapterId: chId,
      completed: true,
    })),
  });

  // ---------------------------------------------------------------------------
  // 3. CURRICULUM & BACKEND /api/v1 REFERENCE DATASETS (1NF NORMALIZED)
  // ---------------------------------------------------------------------------
  tables.push({
    tableName: 'roadmap_phases',
    fileName: 'roadmap_phases.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: 'Core 9 curriculum phases (Phase 0 to Phase 8) served by /api/v1/roadmap.',
    primaryKey: 'phaseId',
    sourceLabel: 'Curriculum (/api/v1/roadmap)',
    columns: [
      { name: 'phaseId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Unique phase ID' },
      { name: 'phaseNumber', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Sequential phase 0..8' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'English title' },
      { name: 'hinglishTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish title' },
      { name: 'subtitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Phase focus summary' },
      { name: 'durationWeeks', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Estimated duration in weeks' },
      { name: 'overview', type: 'STRING', nullable: false, keyType: '', references: '', description: 'English overview' },
      { name: 'hinglishOverview', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish overview' },
    ],
    rows: ROADMAP_PHASES.map((p) => ({
      phaseId: p.id,
      phaseNumber: p.phaseNumber,
      title: p.title,
      hinglishTitle: p.hinglishTitle,
      subtitle: p.subtitle,
      durationWeeks: p.durationWeeks,
      overview: p.overview,
      hinglishOverview: p.hinglishOverview,
    })),
  });

  tables.push({
    tableName: 'roadmap_concepts',
    fileName: 'roadmap_concepts.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: 'All 36 core curriculum concepts linked to roadmap_phases via phaseId.',
    primaryKey: 'conceptId',
    sourceLabel: 'Curriculum (/api/v1/roadmap/concepts)',
    columns: [
      { name: 'conceptId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Concept ID e.g. p0-1' },
      { name: 'phaseId', type: 'STRING', nullable: false, keyType: 'FK', references: 'roadmap_phases.phaseId', description: 'Parent phase ID' },
      { name: 'phaseNumber', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Parent phase number' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Concept title' },
      { name: 'difficulty', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Beginner | Intermediate | Advanced' },
      { name: 'estHours', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Estimated study hours' },
      { name: 'description', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Technical description' },
      { name: 'hinglishDesc', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Hinglish intuitive explanation' },
    ],
    rows: ROADMAP_PHASES.flatMap((p) =>
      p.concepts.map((c) => ({
        conceptId: c.id,
        phaseId: p.id,
        phaseNumber: p.phaseNumber,
        title: c.title,
        difficulty: c.difficulty,
        estHours: c.estHours,
        description: c.description,
        hinglishDesc: c.hinglishDesc || '',
      }))
    ),
  });

  const dailyTasks = generateDailySchedule(activity.pace || '20-months');
  tables.push({
    tableName: 'daily_schedule',
    fileName: 'daily_schedule.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: `Generated day-by-day study schedule for active pace (${activity.pace || '20-months'}) via /api/v1/schedule.`,
    primaryKey: 'dayNumber',
    sourceLabel: `Curriculum (${activity.pace || '20-months'})`,
    columns: [
      { name: 'dayNumber', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: 'Sequential study day' },
      { name: 'pace', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Active schedule pace' },
      { name: 'phaseId', type: 'STRING', nullable: false, keyType: 'FK', references: 'roadmap_phases.phaseId', description: 'Mapped phase ID' },
      { name: 'phaseNumber', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Phase number 0..8' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Daily task title' },
      { name: 'hinglishTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish task title' },
      { name: 'focusArea', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Concept | Coding | Project | Revision' },
      { name: 'durationMins', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Planned minutes' },
      { name: 'handsOnTask', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Coding deliverable' },
    ],
    rows: dailyTasks.map((t) => ({
      dayNumber: t.dayNumber,
      pace: activity.pace || '20-months',
      phaseId: t.phaseId,
      phaseNumber: t.phaseNumber,
      title: t.title,
      hinglishTitle: t.hinglishTitle,
      focusArea: t.focusArea,
      durationMins: t.durationMins,
      handsOnTask: t.handsOnTask,
    })),
  });

  // Projects + normalized techStack & resumeBullets child tables
  const projectRows: CsvRowRecord[] = [];
  const projectTechRows: CsvRowRecord[] = [];
  const projectBulletRows: CsvRowRecord[] = [];

  ROADMAP_PHASES.forEach((p) => {
    [p.standardProject, p.visionaryProject].forEach((proj) => {
      projectRows.push({
        projectId: proj.id,
        phaseId: p.id,
        phaseNumber: p.phaseNumber,
        category: proj.category,
        title: proj.title,
        tagline: proj.tagline,
        noveltyFactor: proj.noveltyFactor,
        keyMetrics: proj.keyMetrics,
        problemStatement: proj.problemStatement,
      });
      proj.techStack.forEach((tech, idx) => {
        projectTechRows.push({
          projectId: proj.id,
          techOrder: idx + 1,
          technology: tech,
        });
      });
      proj.resumeBullets.forEach((bullet, idx) => {
        projectBulletRows.push({
          projectId: proj.id,
          bulletOrder: idx + 1,
          bulletText: bullet,
        });
      });
    });
  });

  tables.push({
    tableName: 'projects',
    fileName: 'projects.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: '18 Standard Resume & Visionary Future capstone projects served by /api/v1/projects.',
    primaryKey: 'projectId',
    sourceLabel: 'Curriculum (/api/v1/projects)',
    columns: [
      { name: 'projectId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Project ID' },
      { name: 'phaseId', type: 'STRING', nullable: false, keyType: 'FK', references: 'roadmap_phases.phaseId', description: 'Mapped phase ID' },
      { name: 'phaseNumber', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Phase index' },
      { name: 'category', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Standard Resume | Visionary Future' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Project title' },
      { name: 'tagline', type: 'STRING', nullable: false, keyType: '', references: '', description: 'One-line project summary' },
      { name: 'noveltyFactor', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Differentiator' },
      { name: 'keyMetrics', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Target metrics' },
      { name: 'problemStatement', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Problem statement' },
    ],
    rows: projectRows,
  });

  tables.push({
    tableName: 'project_tech_stack',
    fileName: 'project_tech_stack.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: '1NF normalized child table for project techStack[] arrays.',
    primaryKey: 'projectId, techOrder',
    sourceLabel: 'Curriculum (/api/v1/projects)',
    columns: [
      { name: 'projectId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'projects.projectId', description: 'Parent project ID' },
      { name: 'techOrder', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1-based stack order' },
      { name: 'technology', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Framework or library name' },
    ],
    rows: projectTechRows,
  });

  tables.push({
    tableName: 'project_resume_bullets',
    fileName: 'project_resume_bullets.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: '1NF normalized child table for project resumeBullets[] arrays.',
    primaryKey: 'projectId, bulletOrder',
    sourceLabel: 'Curriculum (/api/v1/projects)',
    columns: [
      { name: 'projectId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'projects.projectId', description: 'Parent project ID' },
      { name: 'bulletOrder', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1-based bullet index' },
      { name: 'bulletText', type: 'STRING', nullable: false, keyType: '', references: '', description: 'ATS-formatted bullet line' },
    ],
    rows: projectBulletRows,
  });

  const hindiRows: CsvRowRecord[] = [];
  HINDI_CHANNELS_DATA.forEach((ch) => {
    ch.playlists.forEach((pl, idx) => {
      hindiRows.push({
        playlistId: `${ch.id}-pl-${idx + 1}`,
        channelId: ch.id,
        channelName: ch.name,
        creator: ch.creator,
        playlistTitle: pl.title,
        topic: pl.topic,
        phaseMapped: pl.phaseMapped,
        level: pl.level,
        totalVideos: pl.totalVideos,
        url: pl.url,
        description: pl.description,
      });
    });
  });

  tables.push({
    tableName: 'hindi_playlists',
    fileName: 'hindi_playlists.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: 'Flattened 1NF catalog of Hindi & Hinglish AI YouTube playlists from /api/v1/resources/hindi.',
    primaryKey: 'playlistId',
    sourceLabel: 'Curriculum (/api/v1/resources/hindi)',
    columns: [
      { name: 'playlistId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Generated playlist ID' },
      { name: 'channelId', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Channel slug' },
      { name: 'channelName', type: 'STRING', nullable: false, keyType: '', references: '', description: 'YouTube channel name' },
      { name: 'creator', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Instructor name' },
      { name: 'playlistTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Playlist title' },
      { name: 'topic', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Core subject focus' },
      { name: 'phaseMapped', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Mapped roadmap phase' },
      { name: 'level', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Beginner | Intermediate | Advanced' },
      { name: 'totalVideos', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Video count' },
      { name: 'url', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Playlist link' },
      { name: 'description', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Curriculum coverage summary' },
    ],
    rows: hindiRows,
  });

  tables.push({
    tableName: 'career_roles',
    fileName: 'career_roles.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: 'AI Engineering job roles, compensation bands & demand levels served by /api/v1/careers.',
    primaryKey: 'roleId',
    sourceLabel: 'Curriculum (/api/v1/careers)',
    columns: [
      { name: 'roleId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Role identifier' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Role title' },
      { name: 'hinglishTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish title' },
      { name: 'averageSalaryUSD', type: 'STRING', nullable: false, keyType: '', references: '', description: 'USD salary band' },
      { name: 'averageSalaryINR', type: 'STRING', nullable: false, keyType: '', references: '', description: 'INR salary band' },
      { name: 'demandLevel', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Exploding | Very High | High' },
    ],
    rows: CAREER_ROLES_DATA.map((r) => ({
      roleId: r.id,
      title: r.title,
      hinglishTitle: r.hinglishTitle,
      averageSalaryUSD: r.averageSalaryUSD,
      averageSalaryINR: r.averageSalaryINR,
      demandLevel: r.demandLevel,
    })),
  });

  // Python & AI Book normalized tables
  const bookSectionRows: CsvRowRecord[] = [];
  const bookQaRows: CsvRowRecord[] = [];
  PYTHON_AI_BOOK_CHAPTERS.forEach((ch) => {
    ch.sections.forEach((sec, idx) => {
      bookSectionRows.push({
        chapterId: ch.id,
        sectionOrder: idx + 1,
        heading: sec.heading,
        englishBody: sec.englishBody,
        hinglishBody: sec.hinglishBody,
      });
    });
    ch.interviewQAs.forEach((qa, idx) => {
      bookQaRows.push({
        chapterId: ch.id,
        qaOrder: idx + 1,
        question: qa.question,
        englishAnswer: qa.englishAnswer,
        hinglishAnswer: qa.hinglishAnswer,
      });
    });
  });

  tables.push({
    tableName: 'python_book_chapters',
    fileName: 'python_book_chapters.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: '12 interactive Python & AI Engineering handbook chapters (Beginner Python to Interview Prep).',
    primaryKey: 'chapterId',
    sourceLabel: 'Interactive Book Catalog',
    columns: [
      { name: 'chapterId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Chapter ID ch-01..ch-12' },
      { name: 'chapterNumber', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Sequential number' },
      { name: 'part', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Book Part I..V' },
      { name: 'level', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Beginner | Intermediate | Advanced | Interview Prep' },
      { name: 'roadmapPhase', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Mapped roadmap phase' },
      { name: 'estMinutes', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Estimated read time' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'English chapter title' },
      { name: 'hinglishTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish chapter title' },
      { name: 'codeTitle', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Runnable lab filename' },
    ],
    rows: PYTHON_AI_BOOK_CHAPTERS.map((ch) => ({
      chapterId: ch.id,
      chapterNumber: ch.number,
      part: ch.part,
      level: ch.level,
      roadmapPhase: ch.roadmapPhase,
      estMinutes: ch.estMinutes,
      title: ch.title,
      hinglishTitle: ch.hinglishTitle,
      codeTitle: ch.codeTitle,
    })),
  });

  tables.push({
    tableName: 'python_book_sections',
    fileName: 'python_book_sections.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: '1NF normalized child table of bilingual sections belonging to python_book_chapters.',
    primaryKey: 'chapterId, sectionOrder',
    sourceLabel: 'Interactive Book Catalog',
    columns: [
      { name: 'chapterId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'python_book_chapters.chapterId', description: 'Parent chapter ID' },
      { name: 'sectionOrder', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1-based section order' },
      { name: 'heading', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Section heading' },
      { name: 'englishBody', type: 'STRING', nullable: false, keyType: '', references: '', description: 'English explanation' },
      { name: 'hinglishBody', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish explanation' },
    ],
    rows: bookSectionRows,
  });

  tables.push({
    tableName: 'python_book_interview_qa',
    fileName: 'python_book_interview_qa.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: '1NF normalized child table of interview preparation Q&As per Python/AI Book chapter.',
    primaryKey: 'chapterId, qaOrder',
    sourceLabel: 'Interactive Book Catalog',
    columns: [
      { name: 'chapterId', type: 'STRING', nullable: false, keyType: 'PK,FK', references: 'python_book_chapters.chapterId', description: 'Parent chapter ID' },
      { name: 'qaOrder', type: 'INTEGER', nullable: false, keyType: 'PK', references: '', description: '1-based Q&A order' },
      { name: 'question', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Interview question' },
      { name: 'englishAnswer', type: 'STRING', nullable: false, keyType: '', references: '', description: 'English answer' },
      { name: 'hinglishAnswer', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Hinglish answer' },
    ],
    rows: bookQaRows,
  });

  const evaluatedBadges = evaluateUserBadges(
    activity.streakState,
    activity.completedConcepts,
    activity.language,
    activity.completedDays.length
  );

  tables.push({
    tableName: 'badges_catalog',
    fileName: 'badges_catalog.csv',
    folder: 'curriculum',
    tier: 'curriculum',
    description: 'Achievement milestones evaluated against current user streak and learned concepts.',
    primaryKey: 'badgeId',
    sourceLabel: 'Achievement Engine (Live Progress)',
    columns: [
      { name: 'badgeId', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Badge ID' },
      { name: 'title', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Badge name' },
      { name: 'category', type: 'STRING', nullable: false, keyType: '', references: '', description: 'streak | curriculum' },
      { name: 'tier', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Bronze | Silver | Gold | Platinum' },
      { name: 'requirementLabel', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Unlock rule' },
      { name: 'unlocked', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Whether currently unlocked' },
      { name: 'currentProgress', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Current progress value' },
      { name: 'targetProgress', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Target threshold' },
      { name: 'progressPercent', type: 'INTEGER', nullable: false, keyType: '', references: '', description: '0-100 completion percent' },
    ],
    rows: evaluatedBadges.map((b) => ({
      badgeId: b.id,
      title: b.title,
      category: b.category,
      tier: b.tier,
      requirementLabel: b.requirementLabel,
      unlocked: b.unlocked,
      currentProgress: b.currentProgress,
      targetProgress: b.targetProgress,
      progressPercent: b.progressPercent,
    })),
  });

  // ---------------------------------------------------------------------------
  // 0. SCHEMA DICTIONARY CATALOG (PREPENDED AT INDEX 0)
  // ---------------------------------------------------------------------------
  const schemaRows: CsvRowRecord[] = [];
  tables.forEach((tbl) => {
    tbl.columns.forEach((col, colIdx) => {
      schemaRows.push({
        tableName: tbl.tableName,
        fileName: tbl.folder ? `${tbl.folder}/${tbl.fileName}` : tbl.fileName,
        tier: tbl.tier,
        columnOrder: colIdx + 1,
        columnName: col.name,
        dataType: col.type,
        nullable: col.nullable,
        keyConstraint: col.keyType,
        foreignKeyRef: col.references,
        tableRowCount: tbl.rows.length,
        columnDescription: col.description,
      });
    });
  });

  const schemaDictionaryTable: CsvTableDef = {
    tableName: 'schema_dictionary',
    fileName: 'schema_dictionary.csv',
    folder: '',
    tier: 'schema',
    description: 'Master data dictionary listing every normalized CSV table, column type, PK/FK link, and row count.',
    primaryKey: 'tableName, columnName',
    sourceLabel: 'Auto-Introspected Schema Registry',
    columns: [
      { name: 'tableName', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'Logical table name' },
      { name: 'fileName', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Relative CSV file path' },
      { name: 'tier', type: 'STRING', nullable: false, keyType: '', references: '', description: 'firestore | activity | curriculum' },
      { name: 'columnOrder', type: 'INTEGER', nullable: false, keyType: '', references: '', description: '1-based column position' },
      { name: 'columnName', type: 'STRING', nullable: false, keyType: 'PK', references: '', description: 'CSV column header name' },
      { name: 'dataType', type: 'STRING', nullable: false, keyType: '', references: '', description: 'SQL / relational column type' },
      { name: 'nullable', type: 'BOOLEAN', nullable: false, keyType: '', references: '', description: 'Whether empty values allowed' },
      { name: 'keyConstraint', type: 'STRING', nullable: true, keyType: '', references: '', description: 'PK, FK, or PK,FK' },
      { name: 'foreignKeyRef', type: 'STRING', nullable: true, keyType: '', references: '', description: 'Referenced parent table.column' },
      { name: 'tableRowCount', type: 'INTEGER', nullable: false, keyType: '', references: '', description: 'Current exported rows in table' },
      { name: 'columnDescription', type: 'STRING', nullable: false, keyType: '', references: '', description: 'Semantic field documentation' },
    ],
    rows: schemaRows,
  };

  return [schemaDictionaryTable, ...tables];
}

// -----------------------------------------------------------------------------
// Zero-Dependency CRC-32 + Store-Mode ZIP Builder (Browser & Node Safe)
// -----------------------------------------------------------------------------
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32Bytes(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildZipArchive(files: Array<{ path: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32Bytes(dataBytes);

    // Local File Header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression method 0 (STORE)
    lv.setUint16(10, 0, true); // Mod time
    lv.setUint16(12, 0x5421, true); // Mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + endRecord.length;
  const archive = new Uint8Array(totalLength);
  let cursor = 0;
  for (const part of localParts) {
    archive.set(part, cursor);
    cursor += part.length;
  }
  for (const part of centralParts) {
    archive.set(part, cursor);
    cursor += part.length;
  }
  archive.set(endRecord, cursor);
  return archive;
}
