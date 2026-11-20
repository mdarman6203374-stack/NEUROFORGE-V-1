import fs from 'fs';
import path from 'path';
import {
  ActivityExportSnapshot,
  FirestoreExportSnapshot,
  buildNormalizedDatabaseTables,
  serializeTableToCsv,
} from '../src/utils/databaseCsvEngine';

const todayStr = new Date().toISOString().split('T')[0];
const nowIso = new Date().toISOString();

// Seed snapshot aligned with App.tsx defaults & firebase-blueprint.json schema
// so workspace CSV files contain clean headers + realistic initial rows.
const firestoreSeed: FirestoreExportSnapshot = {
  sourceStatus: 'schema-seed',
  users: [
    {
      uid: 'demo-learner-001',
      email: 'learner@tensorplay.local',
      displayName: 'AI Engineering Learner',
      photoURL: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  userProgress: [
    {
      userId: 'demo-learner-001',
      completedConcepts: ['p0-1', 'p0-2'],
      completedDays: [1, 2, 3],
      currentStreak: 3,
      longestStreak: 5,
      lastCompletedDate: todayStr,
      preferredPace: '20-months',
      studyReminder: {
        enabled: false,
        time: '20:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        gentleTone: true,
        lastNotifiedDate: '',
      },
      updatedAt: nowIso,
    },
  ],
  chatSessions: [
    {
      sessionId: 'session-welcome-001',
      userId: 'demo-learner-001',
      title: 'TensorMentor Onboarding Session',
      model: 'gemini-4-hydrogen',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  chatMessages: [
    {
      messageId: 'msg-welcome-001',
      sessionId: 'session-welcome-001',
      userId: 'demo-learner-001',
      role: 'user',
      content: 'Explain how dot-product attention uses linear algebra.',
      sources: [],
      createdAt: nowIso,
    },
    {
      messageId: 'msg-welcome-002',
      sessionId: 'session-welcome-001',
      userId: 'demo-learner-001',
      role: 'model',
      content:
        'Attention computes scaled dot products QK^T / sqrt(d_k), measuring cosine alignment between query and key vectors before softmax weighting.',
      sources: [
        {
          title: 'Attention Is All You Need',
          url: 'https://arxiv.org/abs/1706.03762',
        },
      ],
      createdAt: nowIso,
    },
  ],
  generatedImages: [
    {
      imageId: 'img-sample-001',
      userId: 'demo-learner-001',
      prompt: 'Isometric diagram of Hybrid BM25 + Vector RAG pipeline with Cross-Encoder Reranker',
      aspectRatio: '16:9',
      imageUrl: '',
      createdAt: nowIso,
    },
  ],
};

const activitySeed: ActivityExportSnapshot = {
  userId: 'demo-learner-001',
  pace: '20-months',
  language: 'hinglish',
  completedConcepts: ['p0-1', 'p0-2'],
  completedDays: [1, 2, 3],
  streakState: {
    currentStreak: 3,
    longestStreak: 5,
    lastCompletedDate: todayStr,
    historyDates: [todayStr],
    celebratedMilestones: [3],
  },
  reminderConfig: {
    enabled: false,
    time: '20:00',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    gentleTone: true,
  },
  projectArtifacts: {},
  srsCards: [],
  conceptTimestamps: {
    'p0-1': todayStr,
    'p0-2': todayStr,
  },
  feynmanAttempts: [],
  scratchpads: [],
  pomodoroLogs: [],
  youtubeBookmarks: [],
  rebalancePlan: null,
  bookReadChapterIds: [],
};

const outputRoot = path.resolve(process.cwd(), 'exports/database_csv');
fs.mkdirSync(outputRoot, { recursive: true });

const tables = buildNormalizedDatabaseTables({
  firestore: firestoreSeed,
  activity: activitySeed,
});

tables.forEach((tbl) => {
  const dir = tbl.folder ? path.join(outputRoot, tbl.folder) : outputRoot;
  fs.mkdirSync(dir, { recursive: true });
  const targetPath = path.join(dir, tbl.fileName);
  const csvContent = serializeTableToCsv(tbl.columns, tbl.rows, true);
  fs.writeFileSync(targetPath, csvContent, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), targetPath)} (${tbl.rows.length} rows, ${tbl.columns.length} cols)`);
});

console.log(`\nExported ${tables.length} normalized CSV table files into exports/database_csv/`);
