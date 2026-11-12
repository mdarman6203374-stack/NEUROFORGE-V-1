import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProgress: (data: {
    completedConcepts: string[];
    completedDays: number[];
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string;
  }) => Promise<void>;
  loadProgress: () => Promise<{
    completedConcepts?: string[];
    completedDays?: number[];
    currentStreak?: number;
    longestStreak?: number;
    lastCompletedDate?: string;
  } | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  saveProgress: async () => {},
  loadProgress: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Upsert user profile document in /users/{uid}
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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
    } catch (error: any) {
      console.error('Sign Out failed:', error);
      throw error;
    }
  };

  const saveProgress = async (data: {
    completedConcepts: string[];
    completedDays: number[];
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string;
  }) => {
    if (!auth.currentUser) return;
    const progressRef = doc(db, 'userProgress', auth.currentUser.uid);
    try {
      await setDoc(
        progressRef,
        {
          userId: auth.currentUser.uid,
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `userProgress/${auth.currentUser.uid}`);
    }
  };

  const loadProgress = async () => {
    if (!auth.currentUser) return null;
    const progressRef = doc(db, 'userProgress', auth.currentUser.uid);
    try {
      const snap = await getDoc(progressRef);
      if (snap.exists()) {
        return snap.data() as any;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `userProgress/${auth.currentUser.uid}`);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        saveProgress,
        loadProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
