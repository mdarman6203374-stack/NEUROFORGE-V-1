import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './config';
import { DatabaseStorageMode, SyncStatusState } from '../types';

export interface CloudProgressPayload {
  completedConcepts: string[];
  completedDays: number[];
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  preferredPace?: string;
  studyReminder?: {
    enabled: boolean;
    time: string;
    daysOfWeek: number[];
    lastNotifiedDate?: string;
    gentleTone: boolean;
  };
}

export interface TutorCloudMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  sources?: Array<{ title: string; url: string }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  dbMode: DatabaseStorageMode;
  setDbMode: (mode: DatabaseStorageMode) => void;
  syncState: SyncStatusState;
  lastSyncedAt: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProgress: (data: CloudProgressPayload) => Promise<void>;
  loadProgress: () => Promise<Partial<CloudProgressPayload> | null>;
  subscribeProgress: (onUpdate: (data: Partial<CloudProgressPayload>) => void) => () => void;
  saveTutorMessage: (sessionId: string, msg: TutorCloudMessage) => Promise<void>;
  loadTutorMessages: (sessionId: string) => Promise<TutorCloudMessage[]>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  dbMode: 'firestore-cloud',
  setDbMode: () => {},
  syncState: 'local-only',
  lastSyncedAt: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  saveProgress: async () => {},
  loadProgress: async () => null,
  subscribeProgress: () => () => {},
  saveTutorMessage: async () => {},
  loadTutorMessages: async () => []
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbMode, setDbModeState] = useState<DatabaseStorageMode>(() => {
    try {
      const saved = localStorage.getItem('ai_mastery_db_mode');
      return saved === 'local-browser' ? 'local-browser' : 'firestore-cloud';
    } catch {
      return 'firestore-cloud';
    }
  });
  const [syncState, setSyncState] = useState<SyncStatusState>('local-only');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ai_mastery_last_synced_at');
    } catch {
      return null;
    }
  });

  const setDbMode = useCallback((mode: DatabaseStorageMode) => {
    setDbModeState(mode);
    try {
      localStorage.setItem('ai_mastery_db_mode', mode);
    } catch {}
    if (mode === 'local-browser') {
      setSyncState('local-only');
    } else if (auth.currentUser) {
      setSyncState('synced');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser && dbMode === 'firestore-cloud') {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          setSyncState('synced');
        } catch (error) {
          setSyncState('error');
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setSyncState('local-only');
      }
    });

    return () => unsubscribe();
  }, [dbMode]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setSyncState('local-only');
    } catch (error: any) {
      console.error('Sign Out failed:', error);
      throw error;
    }
  };

  const saveProgress = useCallback(
    async (data: CloudProgressPayload) => {
      if (!auth.currentUser || dbMode === 'local-browser') {
        setSyncState('local-only');
        return;
      }
      setSyncState('syncing');
      const progressRef = doc(db, 'userProgress', auth.currentUser.uid);
      const nowIso = new Date().toISOString();
      try {
        await setDoc(
          progressRef,
          {
            userId: auth.currentUser.uid,
            ...data,
            updatedAt: nowIso
          },
          { merge: true }
        );
        setSyncState('synced');
        setLastSyncedAt(nowIso);
        try {
          localStorage.setItem('ai_mastery_last_synced_at', nowIso);
        } catch {}
      } catch (error) {
        setSyncState('error');
        handleFirestoreError(error, OperationType.WRITE, `userProgress/${auth.currentUser.uid}`);
      }
    },
    [dbMode]
  );

  const loadProgress = useCallback(async () => {
    if (!auth.currentUser || dbMode === 'local-browser') return null;
    const progressRef = doc(db, 'userProgress', auth.currentUser.uid);
    try {
      const snap = await getDoc(progressRef);
      if (snap.exists()) {
        return snap.data() as Partial<CloudProgressPayload>;
      }
      return null;
    } catch (error) {
      setSyncState('error');
      handleFirestoreError(error, OperationType.GET, `userProgress/${auth.currentUser.uid}`);
      return null;
    }
  }, [dbMode]);

  const subscribeProgress = useCallback(
    (onUpdate: (data: Partial<CloudProgressPayload>) => void) => {
      if (!auth.currentUser || dbMode === 'local-browser') {
        return () => {};
      }
      const path = `userProgress/${auth.currentUser.uid}`;
      const progressRef = doc(db, 'userProgress', auth.currentUser.uid);
      const unsub = onSnapshot(
        progressRef,
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data() as Partial<CloudProgressPayload>);
            setSyncState('synced');
            const nowIso = new Date().toISOString();
            setLastSyncedAt(nowIso);
          }
        },
        (error) => {
          setSyncState('error');
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
      return unsub;
    },
    [dbMode]
  );

  const saveTutorMessage = useCallback(
    async (sessionId: string, msg: TutorCloudMessage) => {
      if (!auth.currentUser || dbMode === 'local-browser') return;
      const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
      const safeMsgId = msg.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
      const uid = auth.currentUser.uid;
      const nowIso = new Date().toISOString();

      const sessionRef = doc(db, 'chatSessions', safeSessionId);
      try {
        await setDoc(
          sessionRef,
          {
            sessionId: safeSessionId,
            userId: uid,
            title: '24/7 AI Tutor Session',
            model: msg.modelUsed || 'gemini-4-hydrogen',
            updatedAt: nowIso
          },
          { merge: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `chatSessions/${safeSessionId}`);
      }

      const msgRef = doc(db, 'chatSessions', safeSessionId, 'messages', safeMsgId);
      try {
        await setDoc(msgRef, {
          messageId: safeMsgId,
          sessionId: safeSessionId,
          userId: uid,
          role: msg.role,
          content: msg.content.slice(0, 90000),
          sources: (msg.sources || []).slice(0, 10),
          createdAt: nowIso
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `chatSessions/${safeSessionId}/messages/${safeMsgId}`
        );
      }
    },
    [dbMode]
  );

  const loadTutorMessages = useCallback(
    async (sessionId: string): Promise<TutorCloudMessage[]> => {
      if (!auth.currentUser || dbMode === 'local-browser') return [];
      const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
      const path = `chatSessions/${safeSessionId}/messages`;
      try {
        const sessionSnap = await getDoc(doc(db, 'chatSessions', safeSessionId));
        if (!sessionSnap.exists()) {
          return [];
        }
        const snap = await getDocs(
          query(
            collection(db, 'chatSessions', safeSessionId, 'messages'),
            where('userId', '==', auth.currentUser.uid),
            limit(60)
          )
        );
        const mapped = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.messageId || d.id),
            role: (data.role === 'user' ? 'user' : 'model') as 'user' | 'model',
            content: String(data.content || ''),
            createdAtIso: String(data.createdAt || ''),
            timestamp: data.createdAt
              ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            sources: Array.isArray(data.sources) ? data.sources : []
          };
        });
        mapped.sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
        return mapped.map(({ createdAtIso: _ignored, ...rest }) => rest);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          return [];
        }
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    [dbMode]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        dbMode,
        setDbMode,
        syncState,
        lastSyncedAt,
        signInWithGoogle,
        signOut,
        saveProgress,
        loadProgress,
        subscribeProgress,
        saveTutorMessage,
        loadTutorMessages
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
