'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import { BreedingModal } from './BreedingModal';
import { ANIMALS, BREED_REGISTRY, TIER_LABELS } from '@/game/data';

export function BreedingPanel() {
  const [modalOpen, setModalOpen] = useState(false);
  const { breedingSlots, activeBreedings, animals, claimHatchedAnimal, speedUpBreeding, coins } = useGameStore();
  const now = Date.now();

  const readyEggs = activeBreedings.filter(b => now - b.startedAt >= b.durationMs);

  return (
    <div className="space-y-4">
      {/* Hero Banner / Open Modal CTA */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-950 to-stone-900 border-2 border-violet-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-2xl shadow-inner relative">
            🧬
            {readyEggs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Livestock Breeding & Incubator</h3>
              {readyEggs.length > 0 && (
                <span className="bg-amber-400 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                  {readyEggs.length} Ready!
                </span>
              )}
            </div>
            <p className="text-xs text-violet-200 mt-0.5">
              Combine parents to trigger upward mutations into Rare & Legendary breeds.
              {activeBreedings.length > 0 && ` • ${activeBreedings.length}/${breedingSlots} eggs incubating`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 via-fuchsia-600 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🥚</span>
          Open Breeding Lab
        </button>
      </div>

      {/* Quick Summary of Active Incubations if any */}
      {activeBreedings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeBreedings.map(b => {
            const elapsed = now - b.startedAt;
            const remainingSec = Math.max(0, Math.ceil((b.durationMs - elapsed) / 1000));
            const progress = Math.min(1, elapsed / b.durationMs);
            const isReady = remainingSec <= 0;
            const speedUpCost = Math.max(5, Math.ceil(remainingSec * 0.5));
            const spDef = ANIMALS[b.species];

            const parent1Obj = animals.find(a => a.id === b.parent1Id);
            const parent2Obj = animals.find(a => a.id === b.parent2Id);
            const p1Name = parent1Obj ? (BREED_REGISTRY[parent1Obj.breedId]?.name || TIER_LABELS[parent1Obj.tier]) : 'Parent 1';
            const p2Name = parent2Obj ? (BREED_REGISTRY[parent2Obj.breedId]?.name || TIER_LABELS[parent2Obj.tier]) : 'Parent 2';

            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex flex-col justify-between ${
                  isReady
                    ? 'border-amber-400 bg-amber-950/40 shadow-md shadow-amber-500/20'
                    : 'border-violet-900/50 bg-stone-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{spDef?.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {p1Name} × {p2Name}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {isReady ? '✨ Ready to Hatch!' : `${remainingSec}s remaining`}
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl animate-[wiggle_2s_ease-in-out_infinite]">🥚</span>
                </div>

                {!isReady && (
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {isReady ? (
                    <button
                      onClick={() => {
                        setModalOpen(true);
                        claimHatchedAnimal(b.id);
                      }}
                      className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-all"
                    >
                      🎉 Hatch Egg!
                    </button>
                  ) : (
                    <button
                      onClick={() => speedUpBreeding(b.id)}
                      disabled={coins < speedUpCost}
                      className="flex-1 py-1 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 font-bold text-xs rounded-lg border border-stone-700 transition-all flex items-center justify-center gap-1"
                    >
                      ⚡ Speed Up (🪙{speedUpCost})
                    </button>
                  )}
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-3 py-1 bg-violet-600/50 hover:bg-violet-600 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dedicated Breeding Modal */}
      <BreedingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
