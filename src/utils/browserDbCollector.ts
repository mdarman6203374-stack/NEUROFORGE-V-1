import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  ActivityExportSnapshot,
  CsvTableDef,
  FirestoreExportSnapshot,
  buildNormalizedDatabaseTables,
} from './databaseCsvEngine';
import { loadProjectArtifacts } from './projectArtifacts';
import {
  loadConceptTimestamps,
  loadFeynmanHistory,
  loadSrsCards,
} from './spacedRepetition';
import { loadRebalancePlan, loadYoutubeBookmarks } from './workflowFeatures';
import { collectSavedScratchpadNotes } from './pdfGenerator';
import {
  DatabaseStorageMode,
  Language,
  SchedulePace,
  StreakState,
  StudyReminderConfig,
} from '../types';

export interface CollectLiveDatabaseParams {
  dbMode: DatabaseStorageMode;
  pace: SchedulePace;
  language: Language;
  completedConcepts: string[];
  completedDays: number[];
  streakState: StreakState;
  reminderConfig?: StudyReminderConfig;
}

export interface LiveDatabaseCollectionResult {
  tables: CsvTableDef[];
  firestoreStatus: FirestoreExportSnapshot['sourceStatus'];
  firestoreNotice: string | null;
  collectedAtIso: string;
}

function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function collectLiveNormalizedDatabaseTables(
  params: CollectLiveDatabaseParams
): Promise<LiveDatabaseCollectionResult> {
  const currentUser = auth.currentUser;
  const activeUid = currentUser?.uid || 'local-browser-user';
  const activeEmail = currentUser?.email || 'local-session@tensorplay.local';

  let firestoreStatus: FirestoreExportSnapshot['sourceStatus'] = 'local-fallback';
  let firestoreNotice: string | null = null;

  const usersRows: FirestoreExportSnapshot['users'] = [];
  const progressRows: FirestoreExportSnapshot['userProgress'] = [];
  const sessionRows: FirestoreExportSnapshot['chatSessions'] = [];
  const messageRows: FirestoreExportSnapshot['chatMessages'] = [];
  const imageRows: FirestoreExportSnapshot['generatedImages'] = [];

  if (currentUser && params.dbMode === 'firestore-cloud') {
    try {
      // 1. /users/{userId} (owner get only per firestore.rules)
      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          const u = userSnap.data();
          usersRows.push({
            uid: String(u.uid || currentUser.uid),
            email: String(u.email || activeEmail),
            displayName: String(u.displayName || currentUser.displayName || ''),
            photoURL: String(u.photoURL || currentUser.photoURL || ''),
            createdAt: String(u.createdAt || ''),
            updatedAt: String(u.updatedAt || ''),
          });
        }
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        } catch (wrappedErr: any) {
          firestoreNotice = `Users read notice: ${wrappedErr?.message || 'Fallback used.'}`;
        }
      }

      // 2. /userProgress/{userId} (owner get only per firestore.rules)
      try {
        const progSnap = await getDoc(doc(db, 'userProgress', currentUser.uid));
        if (progSnap.exists()) {
          const p = progSnap.data();
          progressRows.push({
            userId: String(p.userId || currentUser.uid),
            completedConcepts: Array.isArray(p.completedConcepts)
              ? p.completedConcepts.map(String)
              : params.completedConcepts,
            completedDays: Array.isArray(p.completedDays)
              ? p.completedDays.map(Number)
              : params.completedDays,
            currentStreak: Number(p.currentStreak ?? params.streakState.currentStreak),
            longestStreak: Number(p.longestStreak ?? params.streakState.longestStreak),
            lastCompletedDate: String(
              p.lastCompletedDate ?? params.streakState.lastCompletedDate ?? ''
            ),
            preferredPace: String(p.preferredPace || params.pace),
            studyReminder: p.studyReminder || params.reminderConfig,
            updatedAt: String(p.updatedAt || ''),
          });
        }
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.GET, `userProgress/${currentUser.uid}`);
        } catch (wrappedErr: any) {
          firestoreNotice = `UserProgress read notice: ${wrappedErr?.message || 'Fallback used.'}`;
        }
      }

      // 3. /chatSessions filtered strictly by userId == request.auth.uid
      try {
        const sessionsSnap = await getDocs(
          query(
            collection(db, 'chatSessions'),
            where('userId', '==', currentUser.uid),
            limit(30)
          )
        );
        for (const sDoc of sessionsSnap.docs) {
          const s = sDoc.data();
          const sessionId = String(s.sessionId || sDoc.id);
          sessionRows.push({
            sessionId,
            userId: String(s.userId || currentUser.uid),
            title: String(s.title || 'AI Tutor Session'),
            model: String(s.model || 'gemini-4-hydrogen'),
            createdAt: String(s.createdAt || ''),
            updatedAt: String(s.updatedAt || ''),
          });

          // 4. /chatSessions/{sessionId}/messages filtered by userId == request.auth.uid
          try {
            const msgSnap = await getDocs(
              query(
                collection(db, 'chatSessions', sessionId, 'messages'),
                where('userId', '==', currentUser.uid),
                limit(100)
              )
            );
            msgSnap.docs.forEach((mDoc) => {
              const m = mDoc.data();
              messageRows.push({
                messageId: String(m.messageId || mDoc.id),
                sessionId,
                userId: String(m.userId || currentUser.uid),
                role: String(m.role || 'user'),
                content: String(m.content || ''),
                sources: Array.isArray(m.sources) ? m.sources : [],
                createdAt: String(m.createdAt || ''),
              });
            });
          } catch (msgErr) {
            try {
              handleFirestoreError(
                msgErr,
                OperationType.LIST,
                `chatSessions/${sessionId}/messages`
              );
            } catch {
              // Individual session subcollection errors don't abort remaining tables
            }
          }
        }
      } catch (sessErr) {
        try {
          handleFirestoreError(sessErr, OperationType.LIST, 'chatSessions');
        } catch (wrappedErr: any) {
          firestoreNotice = `ChatSessions read notice: ${wrappedErr?.message || 'Fallback used.'}`;
        }
      }

      // 5. /generatedImages filtered by userId == request.auth.uid
      try {
        const imgSnap = await getDocs(
          query(
            collection(db, 'generatedImages'),
            where('userId', '==', currentUser.uid),
            limit(50)
          )
        );
        imgSnap.docs.forEach((iDoc) => {
          const img = iDoc.data();
          imageRows.push({
            imageId: String(img.imageId || iDoc.id),
            userId: String(img.userId || currentUser.uid),
            prompt: String(img.prompt || ''),
            aspectRatio: String(img.aspectRatio || '16:9'),
            imageUrl: String(img.imageUrl || ''),
            createdAt: String(img.createdAt || ''),
          });
        });
      } catch (imgErr) {
        try {
          handleFirestoreError(imgErr, OperationType.LIST, 'generatedImages');
        } catch {
          // Non-fatal; fallback reads local gallery below if empty
        }
      }

      firestoreStatus = 'live-firestore';
    } catch {
      firestoreStatus = 'local-fallback';
    }
  } else {
    firestoreNotice =
      currentUser && params.dbMode === 'local-browser'
        ? 'Currently set to Local Browser DB mode; Firestore rows reflect active local progress mirror.'
        : 'Not signed in to Firebase Auth; user-scoped Firestore tables reflect active local study state.';
  }

  // Merge active local state if Firestore doc wasn't present yet
  if (usersRows.length === 0) {
    usersRows.push({
      uid: activeUid,
      email: activeEmail,
      displayName: currentUser?.displayName || 'Local Learner',
      photoURL: currentUser?.photoURL || '',
      createdAt: '',
      updatedAt: new Date().toISOString(),
    });
  }

  if (progressRows.length === 0) {
    progressRows.push({
      userId: activeUid,
      completedConcepts: params.completedConcepts,
      completedDays: params.completedDays,
      currentStreak: params.streakState.currentStreak,
      longestStreak: params.streakState.longestStreak,
      lastCompletedDate: params.streakState.lastCompletedDate,
      preferredPace: params.pace,
      studyReminder: params.reminderConfig,
      updatedAt: new Date().toISOString(),
    });
  }

  // Fallback for local chat & image history if user hasn't synced any cloud messages/images
  if (sessionRows.length === 0) {
    const localChat = safeJsonParse<
      Array<{
        id?: string;
        role?: string;
        content?: string;
        timestamp?: string;
        sources?: Array<{ title?: string; url?: string }>;
      }>
    >('neuroforge_chat_history', []);
    if (Array.isArray(localChat) && localChat.length > 0) {
      const localSessId = 'local-tutor-session';
      sessionRows.push({
        sessionId: localSessId,
        userId: activeUid,
        title: 'Local 24/7 AI Tutor Session',
        model: 'gemini-4-hydrogen',
        createdAt: '',
        updatedAt: new Date().toISOString(),
      });
      localChat.forEach((m, idx) => {
        messageRows.push({
          messageId: String(m.id || `local-msg-${idx + 1}`),
          sessionId: localSessId,
          userId: activeUid,
          role: String(m.role || 'user'),
          content: String(m.content || ''),
          sources: Array.isArray(m.sources) ? m.sources : [],
          createdAt: String(m.timestamp || ''),
        });
      });
    }
  }

  if (imageRows.length === 0) {
    const localImgs = safeJsonParse<
      Array<{
        id?: string;
        prompt?: string;
        imageUrl?: string;
        url?: string;
        aspectRatio?: string;
        createdAt?: string;
      }>
    >('neuroforge_image_gallery', []);
    if (Array.isArray(localImgs) && localImgs.length > 0) {
      localImgs.forEach((img, idx) => {
        imageRows.push({
          imageId: String(img.id || `local-img-${idx + 1}`),
          userId: activeUid,
          prompt: String(img.prompt || ''),
          aspectRatio: String(img.aspectRatio || '16:9'),
          imageUrl: String(img.imageUrl || img.url || ''),
          createdAt: String(img.createdAt || ''),
        });
      });
    }
  }

  // Collect all browser activity stores
  const rawScratchpads = collectSavedScratchpadNotes();
  const rawPomodoro = safeJsonParse<
    Array<{
      id?: string;
      date?: string;
      durationMins?: number;
      mode?: string;
      completedAt?: string;
    }>
  >('ai_mastery_pomodoro_logs', []);
  const rawBookRead = safeJsonParse<string[]>('ai_mastery_python_book_read_v1', []);

  const activitySnapshot: ActivityExportSnapshot = {
    userId: activeUid,
    pace: params.pace,
    language: params.language,
    completedConcepts: params.completedConcepts,
    completedDays: params.completedDays,
    streakState: params.streakState,
    reminderConfig: params.reminderConfig,
    projectArtifacts: loadProjectArtifacts(),
    srsCards: loadSrsCards(),
    conceptTimestamps: loadConceptTimestamps(),
    feynmanAttempts: loadFeynmanHistory(),
    scratchpads: rawScratchpads.map((s) => ({
      dayNumber: s.dayNumber,
      wordCount: s.wordCount,
      content: s.note,
    })),
    pomodoroLogs: Array.isArray(rawPomodoro) ? rawPomodoro : [],
    youtubeBookmarks: loadYoutubeBookmarks(),
    rebalancePlan: loadRebalancePlan(),
    bookReadChapterIds: Array.isArray(rawBookRead) ? rawBookRead : [],
  };

  const firestoreSnapshot: FirestoreExportSnapshot = {
    sourceStatus: firestoreStatus,
    authEmail: currentUser?.email || null,
    users: usersRows,
    userProgress: progressRows,
    chatSessions: sessionRows,
    chatMessages: messageRows,
    generatedImages: imageRows,
  };

  const tables = buildNormalizedDatabaseTables({
    firestore: firestoreSnapshot,
    activity: activitySnapshot,
  });

  return {
    tables,
    firestoreStatus,
    firestoreNotice,
    collectedAtIso: new Date().toISOString(),
  };
}
