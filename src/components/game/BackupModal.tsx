'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';
import {
  getRawSaveData,
  downloadBackupFile,
  importBackupString,
  requestPersistentStorage,
} from '@/lib/idbStorage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const { loadBackupSave, resetGame, level, coins, gems } = useGameStore();

  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && navigator.storage?.persisted) {
        navigator.storage.persisted().then(res => setIsPersisted(res)).catch(() => setIsPersisted(false));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportFile = async () => {
    try {
      const raw = await getRawSaveData();
      if (!raw) {
        setStatusMessage({ text: 'No saved game data found to export.', type: 'error' });
        return;
      }
      downloadBackupFile(raw);
      setStatusMessage({ text: 'Backup downloaded successfully! Keep it safe.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to export backup.', type: 'error' });
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const raw = await getRawSaveData();
      if (!raw) {
        setStatusMessage({ text: 'No saved game data found to copy.', type: 'error' });
        return;
      }
      await navigator.clipboard.writeText(raw);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setStatusMessage({ text: 'Save JSON copied to clipboard!', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Could not access clipboard.', type: 'error' });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importBackupString(text);
      if (res.success && res.state) {
        loadBackupSave(res.state);
        setStatusMessage({ text: 'Farm restored successfully from backup file!', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ text: res.error || 'Failed to import backup.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Error reading backup file.', type: 'error' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePastedImport = async () => {
    if (!pastedJson.trim()) return;
    try {
      const res = await importBackupString(pastedJson.trim());
      if (res.success && res.state) {
        loadBackupSave(res.state);
        setStatusMessage({ text: 'Farm restored successfully from pasted JSON!', type: 'success' });
        setPastedJson('');
        setShowPasteArea(false);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ text: res.error || 'Invalid backup JSON string.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to load pasted save.', type: 'error' });
    }
  };

  const handleRequestLock = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
    if (granted) {
      setStatusMessage({ text: 'Browser Storage Lock granted! Your farm will never be evicted.', type: 'success' });
    } else {
      setStatusMessage({ text: 'Storage Lock could not be guaranteed by browser.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-sm">
            <span>💾</span>
            <span>100% Local-First Storage (IndexedDB)</span>
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Backup & Storage Manager
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
            Zero logins, zero email rate limits. Your farm is saved directly on your device in high-capacity IndexedDB.
          </p>
        </div>

        {/* Status messages */}
        {statusMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs font-medium text-center ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Current Farm Summary Box */}
        <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-stone-800 dark:text-stone-200">Current Farm Status</div>
            <div className="text-stone-500 dark:text-stone-400 text-[11px]">
              Level {level} • {coins.toLocaleString()} Coins • {gems} Gems
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Saved
            </span>
          </div>
        </div>

        {/* Storage Persistence Lock Info */}
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200">Browser Storage Lock</span>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                {isPersisted ? 'Storage protected from browser cleanup' : 'Prevent browser from clearing save'}
              </p>
            </div>
          </div>
          {isPersisted ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Locked ✓</span>
          ) : (
            <button
              onClick={handleRequestLock}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Lock Save
            </button>
          )}
        </div>

        {/* Export & Import Actions */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Manual Backup & Transfer
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportFile}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>📥</span>
              <span>Export Save (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-stone-200 dark:border-stone-700"
            >
              <span>📤</span>
              <span>Import File</span>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json,application/json"
            className="hidden"
          />

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopyClipboard}
              className="flex-1 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800/60 rounded-lg transition-colors"
            >
              {copySuccess ? 'Copied ✓' : '📋 Copy JSON'}
            </button>
            <button
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="flex-1 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800/60 rounded-lg transition-colors"
            >
              {showPasteArea ? 'Hide Paste Area' : '📝 Paste JSON'}
            </button>
          </div>

          {/* Paste JSON Form */}
          {showPasteArea && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-150">
              <textarea
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder="Paste exported Meadowlands JSON backup here..."
                rows={3}
                className="w-full p-2 text-xs font-mono rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handlePastedImport}
                disabled={!pastedJson.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Apply Pasted Save
              </button>
            </div>
          )}
        </div>

        {/* Reset Game Section */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-1.5 text-[11px] text-stone-400 hover:text-red-500 transition-colors"
            >
              Start New Farm (Reset Progress)
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-2 text-center">
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                Are you sure? This permanently deletes local farm data.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    resetGame();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
