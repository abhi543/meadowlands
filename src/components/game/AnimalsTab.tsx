'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, type AnimalInstance } from '@/game/store';
import {
  ANIMALS,
  TIER_COLORS,
  TIER_LABELS,
  BREED_REGISTRY,
  type AnimalSpecies,
  type Tier,
} from '@/game/data';
import { TIER_SECTORS, type AnimalTier, type SectorConfig } from '@/types/animals';
import { OverclockActionMenu } from './OverclockActionMenu';
import { BreedingModal } from './BreedingModal';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const COSTS: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };

const SECTOR_ORDER: AnimalTier[] = ['common', 'uncommon', 'rare', 'legendary'];

const SECTOR_EMOJIS: Record<AnimalTier, string> = {
  common: '🟢',
  uncommon: '🔵',
  rare: '🟣',
  legendary: '🟡',
};

const TIER_BORDER_STYLES: Record<AnimalTier, string> = {
  common: 'border-emerald-600/30 shadow-emerald-950/20',
  uncommon: 'border-sky-600/30 shadow-sky-950/20',
  rare: 'border-purple-600/30 shadow-purple-950/20',
  legendary: 'border-amber-600/30 shadow-amber-950/20 ring-1 ring-amber-400/20',
};

export function AnimalsTab() {
  const {
    animals,
    silo,
    coins,
    feedAnimal,
    collectProduct,
    feedAllAnimals,
    collectAllProducts,
    buyAnimal,
    breedingSlots,
    activeBreedings,
  } = useGameStore();

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute global batch action counts
  const feedableAnimals = animals.filter(a => !a.fed && !a.productReady && a.age !== 'elder');
  const collectibleAnimals = animals.filter(a => a.productReady && a.cyclesRemaining > 0);

  let feedSim = silo.feed || 0;
  let canFeedCount = 0;
  for (const a of feedableAnimals) {
    const needed = ANIMALS[a.species].feedPerCycle;
    if (feedSim >= needed) {
      feedSim -= needed;
      canFeedCount++;
    }
  }

  const readyEggsCount = activeBreedings.filter(b => Date.now() - b.startedAt >= b.durationMs).length;
  const commonAnimalsCount = animals.filter(a => a.tier === 'common').length;

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col p-3 box-border overflow-hidden select-none">
      
      {/* COMPACT TOP DASHBOARD CONTROL STRIP (Zero Scroll, fixed height ~38px) */}
      <div className="h-10 shrink-0 flex items-center justify-between gap-2 px-2.5 py-1 mb-2.5 rounded-xl bg-stone-900/90 border border-stone-800/80 shadow-md backdrop-blur-md">
        
        {/* Left: Summary Title & Live Counters */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-black text-xs text-white tracking-wide shrink-0">
            <span className="text-sm">🐾</span>
            <span className="hidden sm:inline">Livestock Sanctuaries</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700/60 font-semibold">
              {animals.length}/16 Animals
            </span>
            <span className="hidden md:inline px-2 py-0.5 rounded-md bg-stone-800/80 text-blue-300 border border-stone-700/50">
              🫗 {silo.feed || 0} Feed
            </span>
          </div>
        </div>

        {/* Center: Compact Batch Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => collectAllProducts()}
            disabled={collectibleAnimals.length === 0}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm ${
              collectibleAnimals.length > 0
                ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950 shadow-yellow-500/20 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed'
            }`}
          >
            <span>🧺</span>
            <span>Collect All</span>
            {collectibleAnimals.length > 0 && (
              <span className="bg-stone-950/20 px-1 rounded text-[10px] font-black">
                {collectibleAnimals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => feedAllAnimals()}
            disabled={canFeedCount === 0}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm ${
              canFeedCount > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed'
            }`}
          >
            <span>🫗</span>
            <span>Feed All</span>
            {canFeedCount > 0 && (
              <span className="bg-white/20 px-1 rounded text-[10px] font-black">
                {canFeedCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick Adopt & Incubator Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowAdoptModal(true)}
            disabled={commonAnimalsCount >= 4}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1 disabled:opacity-40"
            title="Adopt starter livestock into Common Paddock"
          >
            <span>➕</span>
            <span className="hidden sm:inline">Adopt</span>
          </button>

          <button
            onClick={() => setShowBreedingModal(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-md ${
              readyEggsCount > 0
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black animate-pulse shadow-amber-500/30'
                : 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/40'
            }`}
          >
            <span>🧬</span>
            <span>Incubator</span>
            {readyEggsCount > 0 ? (
              <span className="bg-amber-950 text-amber-200 px-1 rounded text-[10px] font-black">
                {readyEggsCount} Ready!
              </span>
            ) : activeBreedings.length > 0 ? (
              <span className="bg-violet-950/60 px-1 rounded text-[10px] font-semibold">
                {activeBreedings.length}/{breedingSlots}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* QUAD GRID CONTAINER (2x2 Equal Screen Real Estate, zero scroll) */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2.5 flex-1 min-h-0">
        {SECTOR_ORDER.map(tier => {
          const config = TIER_SECTORS[tier];
          const sectorAnimals = animals.filter(a => a.tier === tier);
          const maxCapacity = config.maxCapacity; // exactly 4 slots
          const filledSlots = sectorAnimals.slice(0, maxCapacity);
          const emptyCount = Math.max(0, maxCapacity - filledSlots.length);

          return (
            <div
              key={tier}
              className={`rounded-xl border-2 ${config.borderColor} ${TIER_BORDER_STYLES[tier]} bg-gradient-to-b ${config.bgGradient} p-2 flex flex-col h-full min-h-0 overflow-hidden shadow-lg`}
            >
              
              {/* Sector Header (Compact, 1 Line, no overflow) */}
              <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-stone-800/80 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{SECTOR_EMOJIS[tier]}</span>
                  <h3 className={`font-black text-xs sm:text-sm tracking-wide truncate ${config.textColor}`}>
                    {config.title}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-900/90 text-stone-300 border border-stone-700/60 font-bold shrink-0">
                    {sectorAnimals.length}/{maxCapacity}
                  </span>
                </div>

                {/* Passive Perk Badge */}
                <div className="shrink-0">
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border truncate inline-block max-w-[170px] ${config.badgeColor}`}
                    title={config.passivePerk}
                  >
                    {config.passivePerk}
                  </span>
                </div>
              </div>

              {/* 4-Slot Inner Sub-Grid (2x2 sub-grid inside quadrant, 100% fits within height) */}
              <div className="grid grid-cols-2 grid-rows-2 gap-1.5 flex-1 min-h-0 overflow-hidden">
                
                {/* Active Animal Slots */}
                {filledSlots.map(animal => {
                  const def = ANIMALS[animal.species];
                  const canFeed = !animal.fed && !animal.productReady && (silo.feed || 0) >= def.feedPerCycle;
                  const canCollect = animal.productReady;
                  const breedDef = BREED_REGISTRY[animal.breedId];
                  const breedName = breedDef?.name || TIER_LABELS[animal.tier];

                  const prodTimeSec = breedDef ? breedDef.baseIntervalMs / 1000 : def.productionTimeSec;
                  let prodProgress = 0;
                  if (animal.fed && animal.fedAt && !animal.productReady) {
                    prodProgress = Math.min(1, (Date.now() - animal.fedAt) / (prodTimeSec * 1000));
                  }

                  const isMutated = Boolean(animal.isMutated);
                  const isOverclocked = Boolean(
                    animal.isOverclocked && animal.overclockExpiresAt && animal.overclockExpiresAt > Date.now()
                  );
                  const isExhausted = Boolean(
                    animal.isExhausted && animal.exhaustedUntil && animal.exhaustedUntil > Date.now()
                  );

                  return (
                    <div
                      key={animal.id}
                      className={`rounded-lg border p-1.5 flex flex-col justify-between min-h-0 text-center relative overflow-hidden transition-all ${
                        isMutated
                          ? 'border-fuchsia-400/80 bg-fuchsia-950/40 shadow-sm'
                          : isOverclocked
                          ? 'border-amber-400 bg-amber-950/40 animate-pulse'
                          : isExhausted
                          ? 'border-stone-700 bg-stone-900/90 opacity-75'
                          : canCollect
                          ? 'border-yellow-400/90 bg-yellow-950/30 shadow-sm'
                          : animal.fed && !animal.productReady
                          ? 'border-blue-500/50 bg-blue-950/20'
                          : 'border-stone-800 bg-stone-900/80'
                      }`}
                    >
                      {/* Top Row: Emoji + Breed Name + Cycles */}
                      <div className="min-h-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-base shrink-0 leading-none">{def.emoji}</span>
                          <span
                            className="text-[11px] font-bold text-white truncate text-left flex-1"
                            title={breedName}
                          >
                            {breedName}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400 shrink-0">
                            {animal.cyclesRemaining}c
                          </span>
                        </div>

                        {/* Mutated / Apex Banner */}
                        {isMutated && (
                          <div className="text-[8px] font-black text-fuchsia-300 bg-fuchsia-950/80 px-1 py-0.2 rounded border border-fuchsia-500/40 truncate text-left mt-0.5">
                            🧬 Apex (+50%)
                          </div>
                        )}
                      </div>

                      {/* Middle: Production State / Action */}
                      <div className="my-0.5 min-h-0">
                        {canCollect ? (
                          <button
                            onClick={() => collectProduct(animal.id)}
                            className="w-full py-1 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-[11px] rounded transition-transform active:scale-95 shadow"
                          >
                            {def.productEmoji} Collect
                          </button>
                        ) : canFeed && animal.age !== 'elder' && !isExhausted ? (
                          <button
                            onClick={() => feedAnimal(animal.id)}
                            className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded transition-transform active:scale-95"
                          >
                            🫗 Feed
                          </button>
                        ) : animal.fed && !animal.productReady ? (
                          <div className="space-y-0.5">
                            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60">
                              <div
                                className="h-full bg-blue-400 rounded-full transition-all duration-300"
                                style={{ width: `${prodProgress * 100}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-blue-300 font-mono">Producing...</div>
                          </div>
                        ) : animal.age === 'elder' ? (
                          <div className="text-[9px] text-amber-400 font-semibold italic">Market Ready</div>
                        ) : (
                          <div className="text-[9px] text-stone-400 font-medium">Needs Feed 🫗</div>
                        )}
                      </div>

                      {/* Bottom Row: Micro Overclock Menu & Status */}
                      <div className="pt-0.5 border-t border-stone-800/60 flex items-center justify-between text-[9px] text-stone-400 min-h-0">
                        <span className="truncate">
                          {breedDef?.bonusDrop ? '⭐ +proc' : `${def.productYield}x ${def.product}`}
                        </span>

                        {animal.age !== 'elder' && (
                          <div className="shrink-0">
                            <OverclockActionMenu
                              entityId={`animal_${animal.id}`}
                              entityType="animal"
                              name={breedDef?.name || def.name}
                              compact={true}
                              className="scale-90 origin-right"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty Slot Placeholders (Fill remaining slots up to 4) */}
                {Array.from({ length: emptyCount }).map((_, slotIdx) => (
                  <div
                    key={`empty-slot-${tier}-${slotIdx}`}
                    className="rounded-lg border border-dashed border-stone-800/80 bg-stone-950/40 p-1.5 flex flex-col items-center justify-center text-center space-y-1 min-h-0"
                  >
                    <span className="text-sm opacity-50">{SECTOR_EMOJIS[tier]}</span>
                    <div className="text-[10px] font-bold text-stone-400">
                      Slot Available
                    </div>

                    {tier === 'common' ? (
                      <button
                        onClick={() => setShowAdoptModal(true)}
                        className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all active:scale-95"
                      >
                        + Adopt
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBreedingModal(true)}
                        className="px-2 py-0.5 text-[9px] font-bold rounded bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-500/40 transition-all active:scale-95"
                      >
                        + Incubate
                      </button>
                    )}
                  </div>
                ))}

              </div>

            </div>
          );
        })}
      </div>

      {/* QUICK ADOPT MODAL (Modal overlay, does not alter desktop viewport) */}
      {showAdoptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-emerald-500/50 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟢</span>
                <h3 className="font-bold text-sm text-white">Adopt Starter Livestock</h3>
              </div>
              <button
                onClick={() => setShowAdoptModal(false)}
                className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Select livestock to place directly into an available Common Paddock slot ({commonAnimalsCount}/4):
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {SPECIES_LIST.map(species => {
                const def = ANIMALS[species];
                const cost = COSTS[species];
                const canBuy = coins >= cost && commonAnimalsCount < 4;

                return (
                  <button
                    key={species}
                    onClick={() => {
                      if (canBuy) {
                        buyAnimal(species);
                        setShowAdoptModal(false);
                      }
                    }}
                    disabled={!canBuy}
                    className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800 disabled:opacity-40 text-stone-200 border border-stone-800 hover:border-emerald-500/60 flex flex-col items-center justify-center transition-all text-center space-y-1 shadow"
                  >
                    <span className="text-2xl">{def.emoji}</span>
                    <span className="text-xs font-bold capitalize text-white">{def.name}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">🪙 {cost}</span>
                  </button>
                );
              })}
            </div>

            {commonAnimalsCount >= 4 && (
              <div className="text-center text-xs text-amber-400 font-medium">
                Common Paddock is at full capacity (4/4 slots).
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED BREEDING & INCUBATOR MODAL */}
      <BreedingModal isOpen={showBreedingModal} onClose={() => setShowBreedingModal(false)} />
    </div>
  );
}
