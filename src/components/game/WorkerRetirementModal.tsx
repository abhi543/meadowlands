'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { WORKER_REGISTRY, type WorkerRole } from '@/game/data';
import {
  calculateRetirementSeverance,
  getGenerationalSpeedMultiplier,
  toRomanNumeral,
  RETIREMENT_REQUIRED_LEVEL,
} from '@/game/workerGenetics';

interface WorkerRetirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: WorkerRole | null;
}

export function WorkerRetirementModal({
  isOpen,
  onClose,
  role,
}: WorkerRetirementModalProps) {
  const { unifiedWorkers, retireWorker } = useGameStore();

  if (!isOpen || !role) return null;

  const worker = unifiedWorkers[role];
  const cfg = WORKER_REGISTRY[role];

  if (!worker || !cfg) return null;

  const currentGen = worker.generation || 1;
  const nextGen = currentGen + 1;
  const currentSpeedMult = getGenerationalSpeedMultiplier(currentGen);
  const nextSpeedMult = getGenerationalSpeedMultiplier(nextGen);
  const severance = calculateRetirementSeverance(currentGen);
  const genetics = worker.genetics;

  const handleRetire = () => {
    const result = retireWorker(role);
    if (result && result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-stone-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-950/50 overflow-hidden flex flex-col max-h-[92vh] text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-yellow-950/70 to-amber-950 border-b border-amber-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 animate-pulse">
              👑
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider">
                  Honorable Retirement Ceremony
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 border border-amber-400/50">
                  Gen {toRomanNumeral(currentGen)} Pioneer
                </span>
              </div>
              <p className="text-xs text-amber-200/70 mt-0.5">
                Bestow a lifetime pension and pass the dynastic torch to Generation {toRomanNumeral(nextGen)}!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Worker Hero Profile */}
          <div className="p-3.5 rounded-xl bg-stone-950/80 border border-amber-500/30 flex items-center gap-4">
            <div className="text-4xl sm:text-5xl p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/40 shadow-inner">
              {cfg.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white truncate">
                  {cfg.name}
                </h3>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  Level {worker.level} / {RETIREMENT_REQUIRED_LEVEL} (Max)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {cfg.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-300 font-medium">
                <span>⚡ Baseline Speed: <b className="text-amber-400">{currentSpeedMult}x</b></span>
                <span>👑 Dynastic Era: <b className="text-amber-400">Gen {toRomanNumeral(currentGen)}</b></span>
              </div>
            </div>
          </div>

          {/* Genetic Profile Matrix */}
          {genetics && (
            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <span>🧬</span>
                  <span>Inherited Genetic Aptitude</span>
                </h4>
                <span className="text-[10px] text-amber-400/90 font-medium">
                  +1 to +5 Mentorship Drift on Transition
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>🏋️ Strength</span>
                    <span className="font-bold text-stone-200">{genetics.strength}</span>
                  </div>
                  <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${genetics.strength}%` }} />
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>⚡ Stamina</span>
                    <span className="font-bold text-stone-200">{genetics.stamina}</span>
                  </div>
                  <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${genetics.stamina}%` }} />
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>🌱 Farming</span>
                    <span className="font-bold text-stone-200">{genetics.farmingAptitude}</span>
                  </div>
                  <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${genetics.farmingAptitude}%` }} />
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>🧠 Learning</span>
                    <span className="font-bold text-stone-200">{genetics.learningAbility}</span>
                  </div>
                  <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-sky-400 rounded-full" style={{ width: `${genetics.learningAbility}%` }} />
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-stone-900 border border-stone-800 col-span-2 sm:col-span-1">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>⚙️ Efficiency</span>
                    <span className="font-bold text-stone-200">{genetics.workEfficiency}</span>
                  </div>
                  <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${genetics.workEfficiency}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lifetime Career Accomplishments */}
          <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <span>📜</span>
              <span>Career Achievements (Inducted into Hall of Fame)</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-base">🪙</span>
                <div className="font-black text-sm text-amber-400 mt-0.5">
                  {worker.stats.totalCoinsEarned.toLocaleString()}
                </div>
                <div className="text-[10px] text-stone-400">Coins Earned</div>
              </div>

              <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-base">📦</span>
                <div className="font-black text-sm text-emerald-400 mt-0.5">
                  {worker.stats.totalItemsProduced.toLocaleString()}
                </div>
                <div className="text-[10px] text-stone-400">Items Harvested</div>
              </div>

              <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-base">💎</span>
                <div className="font-black text-sm text-cyan-400 mt-0.5">
                  {worker.stats.totalGemsEarned.toLocaleString()}
                </div>
                <div className="text-[10px] text-stone-400">Gems Found</div>
              </div>
            </div>
          </div>

          {/* Generational Upgrade Guarantee */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/40 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>🚀</span>
              <span>Generation {toRomanNumeral(nextGen)} Successor Breakthrough</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-900/90 border border-amber-500/30 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-bold text-amber-300">
                    2x Faster Work Speed!
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Runs at <b className="text-amber-400">{nextSpeedMult}x Base Speed</b> (Interval cut in half permanently).
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-900/90 border border-amber-500/30 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-bold text-amber-300">
                    Golden Pension Payout
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Estate receives <b className="text-amber-400">+🪙{severance.pensionCoins.toLocaleString()}</b> & <b className="text-cyan-400">+💎{severance.pensionGems}</b>!
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-amber-200/80 italic pt-1">
              ⚠️ Note: Automation level resets back to Level 1, allowing you to re-ascend the mastery tiers with newly supercharged base velocity!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRetire}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 border border-amber-300 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>👑</span>
            <span>Bestow Pension & Welcome Gen {toRomanNumeral(nextGen)}</span>
            <span>✨</span>
          </button>
        </div>
      </div>
    </div>
  );
}
