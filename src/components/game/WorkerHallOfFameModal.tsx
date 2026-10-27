'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import { WORKER_REGISTRY, type WorkerRole } from '@/game/data';
import {
  toRomanNumeral,
  getGenerationalSpeedMultiplier,
  RETIREMENT_REQUIRED_LEVEL,
} from '@/game/workerGenetics';

interface WorkerHallOfFameViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function WorkerHallOfFameView({ onClose, isModal = false }: WorkerHallOfFameViewProps) {
  const { workerAncestors = [] } = useGameStore();
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const totalAncestors = workerAncestors.length;
  const totalCoinsPaid = workerAncestors.reduce((acc, a) => acc + (a.pensionCoinsPaid || 0), 0);
  const totalGemsPaid = workerAncestors.reduce((acc, a) => acc + (a.pensionGemsPaid || 0), 0);
  const totalCareerCoins = workerAncestors.reduce((acc, a) => acc + (a.totalCoinsEarned || 0), 0);
  const totalCareerItems = workerAncestors.reduce((acc, a) => acc + (a.totalItemsProduced || 0), 0);

  const filteredAncestors = roleFilter === 'all'
    ? workerAncestors
    : workerAncestors.filter((a) => a.role === roleFilter);

  const uniqueRoles = Array.from(new Set(workerAncestors.map((a) => a.role)));

  return (
    <div className={`w-full bg-stone-900 border-2 border-amber-500/70 rounded-2xl shadow-xl overflow-hidden flex flex-col text-stone-100 ${isModal ? 'max-h-[92vh]' : ''}`}>
      {/* Header Ribbon */}
      <div className="p-4 bg-gradient-to-r from-amber-950 via-yellow-950/70 to-amber-950 border-b border-amber-500/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
            🏛️
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider">
                Dynastic Hall of Fame
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-200 border border-amber-400/40">
                {totalAncestors} Honored Pioneers
              </span>
            </div>
            <p className="text-xs text-amber-200/70 mt-0.5">
              The grand memorial of retired master artisans and guild foremen whose lineage powers our farm.
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Global Summary Bar */}
      {totalAncestors > 0 && (
        <div className="px-5 py-3 bg-stone-950/90 border-b border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <span className="text-stone-400 text-[11px]">Retired Masters</span>
            <div className="font-black text-base text-amber-400 mt-0.5">{totalAncestors}</div>
          </div>
          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <span className="text-stone-400 text-[11px]">Pensions Distributed</span>
            <div className="font-black text-base text-amber-300 mt-0.5">🪙{totalCoinsPaid.toLocaleString()}</div>
          </div>
          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <span className="text-stone-400 text-[11px]">Pioneer Career Earnings</span>
            <div className="font-black text-base text-emerald-400 mt-0.5">🪙{totalCareerCoins.toLocaleString()}</div>
          </div>
          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <span className="text-stone-400 text-[11px]">Lifetime Items Produced</span>
            <div className="font-black text-base text-sky-400 mt-0.5">📦{totalCareerItems.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Role Filter Tabs */}
      {uniqueRoles.length > 1 && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-stone-800 bg-stone-950/60 overflow-x-auto text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200'
            }`}
          >
            All Guilds ({totalAncestors})
          </button>
          {uniqueRoles.map((r) => {
            const cfg = WORKER_REGISTRY[r as WorkerRole];
            const count = workerAncestors.filter((a) => a.role === r).length;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>{cfg?.emoji || '👤'}</span>
                <span>{cfg?.name || r}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Ancestor Record Cards */}
      <div className={`p-5 space-y-3.5 flex-1 text-xs ${isModal ? 'overflow-y-auto' : ''}`}>
        {filteredAncestors.length === 0 ? (
          <div className="py-12 text-center space-y-3 text-stone-400">
            <span className="text-5xl block">🏛️</span>
            <h4 className="text-base font-bold text-stone-200">The Hall Awaits Its First Legend</h4>
            <p className="max-w-md mx-auto text-xs text-stone-400">
              When a worker reaches <b>Level {RETIREMENT_REQUIRED_LEVEL} (Max Level)</b>, you can hold an honorable retirement ceremony.
              They will receive a golden pension, be immortalized here, and their successor will work at <b>2x speed</b>!
            </p>
          </div>
        ) : (
          filteredAncestors.map((ancestor) => {
            const speedMult = getGenerationalSpeedMultiplier(ancestor.generation);
            const retiredDate = new Date(ancestor.retiredAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={ancestor.id}
                className="p-4 rounded-xl bg-stone-950/80 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                      {ancestor.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-stone-100">
                          {ancestor.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/25 text-amber-300 border border-amber-400/40">
                          👑 Gen {toRomanNumeral(ancestor.generation)} Ancestor
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                          Retired at Lv. {ancestor.finalLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                        <span>Honored on {retiredDate}</span>
                        <span>·</span>
                        <span className="text-amber-400 font-semibold">{speedMult}x Base Velocity Era</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-stone-400">Pension Bestowed</div>
                    <div className="font-black text-amber-300 text-xs">
                      +🪙{ancestor.pensionCoinsPaid.toLocaleString()}
                      {ancestor.pensionGemsPaid > 0 && (
                        <span className="text-cyan-400 ml-1.5">+💎{ancestor.pensionGemsPaid}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Career Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-850 text-center">
                  <div className="p-1.5 rounded bg-stone-900 border border-stone-800">
                    <span className="text-stone-400 text-[10px]">Lifetime Coins</span>
                    <div className="font-bold text-amber-400">🪙 {ancestor.totalCoinsEarned.toLocaleString()}</div>
                  </div>
                  <div className="p-1.5 rounded bg-stone-900 border border-stone-800">
                    <span className="text-stone-400 text-[10px]">Total Harvest</span>
                    <div className="font-bold text-emerald-400">📦 {ancestor.totalItemsProduced.toLocaleString()}</div>
                  </div>
                  <div className="p-1.5 rounded bg-stone-900 border border-stone-800">
                    <span className="text-stone-400 text-[10px]">Gems Found</span>
                    <div className="font-bold text-cyan-400">💎 {ancestor.totalGemsEarned.toLocaleString()}</div>
                  </div>
                </div>

                {/* Genetic Blueprint Display */}
                {ancestor.genetics && (
                  <div className="pt-1 border-t border-stone-850 flex items-center justify-between text-[11px] text-stone-400 flex-wrap gap-2">
                    <span className="text-stone-500 font-medium">🧬 Genetic Blueprint:</span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span>STR <b className="text-stone-200">{ancestor.genetics.strength}</b></span>
                      <span>STM <b className="text-stone-200">{ancestor.genetics.stamina}</b></span>
                      <span>FRM <b className="text-stone-200">{ancestor.genetics.farmingAptitude}</b></span>
                      <span>LRN <b className="text-stone-200">{ancestor.genetics.learningAbility}</b></span>
                      <span>EFF <b className="text-stone-200">{ancestor.genetics.workEfficiency}</b></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
        <span className="text-[11px] text-stone-500">
          Each retired generation passes a <b>2x Speed multiplier</b> and genetic mentorship to future generations.
        </span>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Hall
          </button>
        )}
      </div>
    </div>
  );
}

interface WorkerHallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkerHallOfFameModal({
  isOpen,
  onClose,
}: WorkerHallOfFameModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <WorkerHallOfFameView onClose={onClose} isModal={true} />
      </div>
    </div>
  );
}
