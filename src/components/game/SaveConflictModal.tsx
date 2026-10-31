'use client';

import { PartitionedGameSave } from '@/lib/firebase/types';

interface SaveConflictModalProps {
  isOpen: boolean;
  localSave: {
    level: number;
    coins: number;
    gems: number;
    updatedAt: number;
  };
  cloudSave: PartitionedGameSave;
  onSelectLocal: () => void;
  onSelectCloud: () => void;
}

export function SaveConflictModal({
  isOpen,
  localSave,
  cloudSave,
  onSelectLocal,
  onSelectCloud,
}: SaveConflictModalProps) {
  if (!isOpen) return null;

  const localDate = new Date(localSave.updatedAt).toLocaleString();
  const cloudDate = new Date(cloudSave.updatedAt).toLocaleString();

  const cloudLevel = cloudSave.clientMetadata?.level || cloudSave.state?.level || 1;
  const cloudCoins = cloudSave.clientMetadata?.coins || cloudSave.state?.coins || 0;
  const cloudGems = cloudSave.clientMetadata?.gems || cloudSave.state?.gems || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
          <span className="text-3xl">⚖️</span>
          <div>
            <h3 className="font-bold text-lg text-amber-300">Save State Conflict Detected</h3>
            <p className="text-xs text-stone-400">Choose which estate progress version to keep</p>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          Your browser has offline save data that differs from your cloud save. Please select the version you wish to load. The other version will be replaced.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option A: Local Browser Save */}
          <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-700 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-sky-400">💻 Local Device</span>
                <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                  Newer
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mb-2">Saved: {localDate}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">Level:</span>
                  <span className="font-bold text-white">Lvl {localSave.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Coins:</span>
                  <span className="font-bold text-amber-300">🪙 {localSave.coins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Gems:</span>
                  <span className="font-bold text-emerald-400">💎 {localSave.gems}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSelectLocal}
              className="w-full py-2 bg-sky-700 hover:bg-sky-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              Keep Local Progress
            </button>
          </div>

          {/* Option B: Cloud Save */}
          <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-700 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400">☁️ Cloud Save</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                  Cloud
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mb-2">Saved: {cloudDate}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">Level:</span>
                  <span className="font-bold text-white">Lvl {cloudLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Coins:</span>
                  <span className="font-bold text-amber-300">🪙 {cloudCoins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Gems:</span>
                  <span className="font-bold text-emerald-400">💎 {cloudGems}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSelectCloud}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              Restore Cloud Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
