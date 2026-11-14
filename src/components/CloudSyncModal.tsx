import React, { useState } from 'react';
import {
  Database,
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  Download,
  LogIn
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import firebaseConfig from '../../firebase-applet-config.json';
import { DatabaseStorageMode, Language } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  completedConceptsCount: number;
  completedDaysCount: number;
  currentStreak: number;
  onSyncNow: () => Promise<void>;
  onOpenExportBackup: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  language,
  completedConceptsCount,
  completedDaysCount,
  currentStreak,
  onSyncNow,
  onOpenExportBackup
}) => {
  const { user, dbMode, setDbMode, syncState, lastSyncedAt, signInWithGoogle } = useAuth();
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectDbMode = (mode: DatabaseStorageMode) => {
    setDbMode(mode);
    setSyncNotice(
      mode === 'firestore-cloud'
        ? 'Switched to Cloud NoSQL (Firebase Firestore) + Local Cache'
        : 'Switched to Local Browser Storage (Offline-Only Mode)'
    );
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleTriggerSync = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setIsManualSyncing(true);
    try {
      await onSyncNow();
      setSyncNotice('Progress, streak, reminders & pace synced to Firebase Firestore!');
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formattedLastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not synced yet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Database Type & Cloud Sync Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hinglish'
                  ? 'Apna database engine aur real-time cloud sync manage karein'
                  : 'Configure storage engine, inspect live sync & back up your data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close database sync panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Database Type Selector Cards */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Active Database Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Firebase Firestore Cloud NoSQL */}
              <button
                type="button"
                onClick={() => handleSelectDbMode('firestore-cloud')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                  dbMode === 'firestore-cloud'
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Firebase Firestore</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                    Cloud NoSQL
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Real-time multi-device cloud database sync (`onSnapshot`) backed up with local cache.
                </p>
              </button>

              {/* Browser Local Storage Offline */}
              <button
                type="button"
                onClick={() => handleSelectDbMode('local-browser')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                  dbMode === 'local-browser'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Browser Storage</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    Local Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Stores all progress, schedules, and tutor history offline on this device only.
                </p>
              </button>
            </div>
          </div>

          {/* Live Cloud Connection & Schema Telemetry */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Sync Status</span>
              <span className="flex items-center gap-1.5 font-semibold">
                {syncState === 'synced' && dbMode === 'firestore-cloud' && user ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Real-Time Cloud Synced</span>
                  </>
                ) : syncState === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                    <span className="text-indigo-600 dark:text-indigo-400">Syncing...</span>
                  </>
                ) : syncState === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">Sync Attention Needed</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      {user ? 'Local-Only Mode Active' : 'Local Cache (Sign In for Cloud Sync)'}
                    </span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
              <span className="font-mono text-[11px] font-semibold text-slate-900 dark:text-white">
                {dbMode === 'firestore-cloud'
                  ? 'Firestore Enterprise (NoSQL Document DB)'
                  : 'Browser WebStorage (Local Key-Value)'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Database Instance</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[260px]">
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cloud Account</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {user ? user.email : 'Not signed in'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Synced Records</span>
              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {completedConceptsCount} Concepts · {completedDaysCount} Days · {currentStreak}d Streak
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Last Cloud Sync</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {formattedLastSync}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Collections protected by Firestore rules: users, userProgress, chatSessions</span>
            </div>
          </div>

          {syncNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {syncNotice}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {user && dbMode === 'firestore-cloud' ? (
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isManualSyncing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Syncing with Cloud...' : 'Sync Now to Cloud'}</span>
              </button>
            ) : !user ? (
              <button
                type="button"
                onClick={handleTriggerSync}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google to Enable Cloud Sync</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExportBackup();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export / Restore JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
