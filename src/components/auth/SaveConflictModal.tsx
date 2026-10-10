'use client';

import { useConflictStore } from '@/lib/syncManager';

export function SaveConflictModal() {
  const { conflict, resolveChoice } = useConflictStore();

  if (!conflict || !conflict.isOpen) return null;

  const { localSave, cloudSave } = conflict;

  const localIsHigher = localSave.level > cloudSave.level || (localSave.level === cloudSave.level && localSave.xp > cloudSave.xp);
  const cloudIsHigher = cloudSave.level > localSave.level || (cloudSave.level === localSave.level && cloudSave.xp > localSave.xp);

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-700">
            <span>⚠️</span>
            <span>Cloud Save Conflict Detected</span>
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Which Farm Do You Want to Keep?
          </h3>
          <p className="text-xs text-stone-500 dark:text-gray-400 max-w-sm mx-auto">
            We noticed different progress between this device and your cloud backup. Select the version you wish to continue playing with.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Card 1: Local Device */}
          <div
            className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
              localIsHigher
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
                : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <span>📱</span> This Device
                </span>
                {localIsHigher && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    Higher Level
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300 py-1">
                <div className="flex justify-between">
                  <span className="text-stone-400 dark:text-stone-500">Level:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-100">Lv. {localSave.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 dark:text-stone-500">Coins:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">🪙 {localSave.coins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 dark:text-stone-500">Gems:</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">💎 {localSave.gems}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-stone-200/50 dark:border-stone-800">
                  <span className="text-stone-400 dark:text-stone-500">Saved:</span>
                  <span className="text-stone-500 dark:text-stone-400">{formatDate(localSave.timestamp)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => resolveChoice('local')}
              className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                localIsHigher
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
            >
              Keep This Device
            </button>
          </div>

          {/* Card 2: Cloud Backup */}
          <div
            className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
              cloudIsHigher
                ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 ring-1 ring-sky-500/30'
                : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <span>☁️</span> Cloud Backup
                </span>
                {cloudIsHigher && (
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300 py-1">
                <div className="flex justify-between">
                  <span className="text-stone-400 dark:text-stone-500">Level:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-100">Lv. {cloudSave.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 dark:text-stone-500">Coins:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">🪙 {cloudSave.coins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 dark:text-stone-500">Gems:</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">💎 {cloudSave.gems}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-stone-200/50 dark:border-stone-800">
                  <span className="text-stone-400 dark:text-stone-500">Saved:</span>
                  <span className="text-stone-500 dark:text-stone-400">{formatDate(cloudSave.timestamp)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => resolveChoice('cloud')}
              className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                cloudIsHigher
                  ? 'bg-sky-600 hover:bg-sky-700 text-white'
                  : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
              }`}
            >
              Load Cloud Progress
            </button>
          </div>
        </div>

        <div className="text-[11px] text-stone-400 dark:text-stone-500 text-center pt-1">
          Whichever version you choose will immediately sync across your account.
        </div>
      </div>
    </div>
  );
}
