'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, type AnimalInstance } from '@/game/store';
import {
  ANIMALS,
  TIER_COLORS,
  TIER_LABELS,
  HABITAT_UPGRADES,
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

const TIER_CARD_STYLES: Record<Tier, string> = {
  common: 'border-emerald-500/40 bg-stone-900/80 shadow-emerald-950/20',
  uncommon: 'border-sky-500/40 bg-stone-900/80 shadow-sky-950/20',
  rare: 'border-purple-500/40 bg-stone-900/80 shadow-purple-950/20',
  legendary: 'border-amber-400/50 bg-stone-900/90 shadow-amber-500/20 ring-1 ring-amber-300/40',
};

const SECTOR_EMOJIS: Record<AnimalTier, string> = {
  common: '🟢',
  uncommon: '🔵',
  rare: '🟣',
  legendary: '🟡',
};

export function AnimalPanel() {
  const {
    animals,
    silo,
    barn,
    coins,
    level,
    feedAnimal,
    collectProduct,
    feedAllAnimals,
    collectAllProducts,
    buyAnimal,
    animalCapacity,
    habitatUpgradeSteps,
    upgradeHabitat,
    breedingSlots,
    activeBreedings,
  } = useGameStore();

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [showAdoptMenu, setShowAdoptMenu] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute batch action counts
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
  const totalFeedNeeded = feedableAnimals.reduce((sum, a) => sum + ANIMALS[a.species].feedPerCycle, 0);
  const readyEggsCount = activeBreedings.filter(b => Date.now() - b.startedAt >= b.durationMs).length;

  return (
    <div className="space-y-4">
      
      {/* 1. HERO BANNER: BREEDING & INCUBATOR LAB */}
      <div className="bg-gradient-to-r from-violet-950/90 via-purple-950/80 to-stone-900 border-2 border-violet-500/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-2xl shadow-inner relative">
            🧬
            {readyEggsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Livestock Breeding &amp; Incubator</h3>
              {readyEggsCount > 0 ? (
                <span className="bg-amber-400 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
                  ✨ {readyEggsCount} Egg Ready to Hatch!
                </span>
              ) : activeBreedings.length > 0 ? (
                <span className="bg-violet-500/30 text-violet-300 text-xs font-bold px-2 py-0.5 rounded-full border border-violet-400/30">
                  🥚 {activeBreedings.length}/{breedingSlots} Incubating
                </span>
              ) : null}
            </div>
            <p className="text-xs text-violet-200 mt-0.5">
              Crossbreed livestock to mutate upwards into Uncommon, Rare &amp; Legendary breeds.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBreedingModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 via-fuchsia-600 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>🥚</span>
          Open Incubator &amp; Breeding
        </button>
      </div>

      {/* 2. BATCH ACTION BUTTONS */}
      {(canFeedCount > 0 || collectibleAnimals.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {/* Collect All */}
          <button
            onClick={() => collectAllProducts()}
            disabled={collectibleAnimals.length === 0}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
              collectibleAnimals.length > 0
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600 shadow-lg shadow-yellow-200/50 active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
            }`}
          >
            <span className="text-lg">🧺</span>
            Collect All
            {collectibleAnimals.length > 0 && (
              <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">
                {collectibleAnimals.length}
              </span>
            )}
          </button>

          {/* Feed All */}
          <button
            onClick={() => feedAllAnimals()}
            disabled={canFeedCount === 0}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
              canFeedCount > 0
                ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/50 active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
            }`}
          >
            <span className="text-lg">🫗</span>
            Feed All
            {canFeedCount > 0 && (
              <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">
                {canFeedCount}
              </span>
            )}
            <span className="text-xs opacity-80">
              🫗{totalFeedNeeded > 0 ? Math.min(silo.feed || 0, totalFeedNeeded) : 0}
            </span>
          </button>
        </div>
      )}

      {/* 3. FOUR EQUAL-SPACE RARITY SECTORS (2x2 GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {SECTOR_ORDER.map(tier => {
          const config = TIER_SECTORS[tier];
          const sectorAnimals = animals.filter(a => a.tier === tier);
          const maxCap = config.maxCapacity;
          const displayCap = Math.max(maxCap, sectorAnimals.length);
          const emptySlotCount = Math.max(0, displayCap - sectorAnimals.length);
          const isSectorFull = sectorAnimals.length >= maxCap;

          return (
            <div
              key={tier}
              className={`rounded-2xl border-2 ${config.borderColor} bg-gradient-to-b ${config.bgGradient} p-4 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden`}
            >
              
              {/* Sector Header */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{SECTOR_EMOJIS[tier]}</span>
                    <div>
                      <h3 className="font-black text-white text-base tracking-wide">
                        {config.title}
                      </h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mt-0.5 ${config.badgeColor}`}>
                        {config.roleDescription}
                      </span>
                    </div>
                  </div>

                  {/* Independent Sector Capacity Badge */}
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      isSectorFull
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-stone-900/80 text-stone-300 border-stone-700'
                    }`}>
                      {sectorAnimals.length} / {displayCap} Slots
                    </span>
                  </div>
                </div>

                {/* Passive Perk Callout Banner */}
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5 truncate">
                    {config.passivePerk}
                  </span>
                  
                  {/* Sector Action Quick Shortcuts */}
                  {tier === 'common' && (
                    <button
                      onClick={() => setShowAdoptMenu(!showAdoptMenu)}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded transition-all whitespace-nowrap ml-2"
                    >
                      {showAdoptMenu ? 'Close Adopt' : '+ Adopt Livestock'}
                    </button>
                  )}
                  {tier !== 'common' && (
                    <button
                      onClick={() => setShowBreedingModal(true)}
                      className="text-[10px] font-bold text-violet-300 hover:text-violet-200 bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/40 px-2 py-0.5 rounded transition-all whitespace-nowrap ml-2"
                    >
                      🧬 Breed Tier
                    </button>
                  )}
                </div>

                {/* Common Tier Livestock Adoption Drawer */}
                {tier === 'common' && showAdoptMenu && (
                  <div className="bg-stone-950/90 border border-emerald-500/40 rounded-xl p-2.5 space-y-2 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-emerald-300">
                      Adopt Starter Livestock into Common Pasture:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {SPECIES_LIST.map(species => {
                        const def = ANIMALS[species];
                        const cost = COSTS[species];
                        const canBuy = coins >= cost;

                        return (
                          <button
                            key={species}
                            onClick={() => buyAnimal(species)}
                            disabled={!canBuy}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-200 border border-stone-700 hover:border-emerald-500/50 flex flex-col items-center justify-center transition-all text-center"
                          >
                            <span className="text-lg">{def.emoji}</span>
                            <span className="text-[10px] font-bold capitalize">{def.name}</span>
                            <span className="text-[9px] text-amber-400 font-mono">🪙{cost}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sector Animals Grid */}
              <div className="flex-1 space-y-2">
                {sectorAnimals.length === 0 && emptySlotCount === 0 ? (
                  <div className="h-44 rounded-xl border-2 border-dashed border-stone-800 bg-stone-950/40 p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-3xl opacity-50">{SECTOR_EMOJIS[tier]}</span>
                    <span className="text-xs font-bold text-stone-400">Paddock Empty</span>
                    <span className="text-[10px] text-stone-500 max-w-xs">
                      {tier === 'common'
                        ? 'Adopt livestock above to start gathering raw agricultural commodities!'
                        : `Incubate eggs with mutation rolls to awaken ${config.title} livestock!`}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Active Animal Cards */}
                    {sectorAnimals.map(animal => {
                      const def = ANIMALS[animal.species];
                      const canFeed = !animal.fed && !animal.productReady && (silo.feed || 0) >= def.feedPerCycle;
                      const canCollect = animal.productReady;
                      const breedDef = BREED_REGISTRY[animal.breedId];
                      const breedName = breedDef?.name || TIER_LABELS[animal.tier];
                      const visualTheme = breedDef?.visualTheme;

                      const prodTimeSec = breedDef ? breedDef.baseIntervalMs / 1000 : def.productionTimeSec;

                      let prodProgress = 0;
                      if (animal.fed && animal.fedAt && !animal.productReady) {
                        prodProgress = Math.min(1, (Date.now() - animal.fedAt) / (prodTimeSec * 1000));
                      }

                      const yieldInfo = breedDef
                        ? `${breedDef.baseYieldAmount}x ${breedDef.primaryProductKey.replace(/_/g, ' ')}`
                        : `${def.productYield}x ${def.product}`;

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
                          className={`rounded-xl border-2 p-2.5 text-center transition-all flex flex-col justify-between ${
                            isMutated
                              ? 'border-fuchsia-400 bg-fuchsia-950/60 shadow-[0_0_15px_rgba(217,70,239,0.3)] ring-1 ring-fuchsia-400'
                              : isOverclocked
                              ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-300 animate-pulse'
                              : isExhausted
                              ? 'border-stone-600 bg-stone-900/90 opacity-80'
                              : animal.age === 'elder'
                              ? 'bg-amber-950/40 border-amber-500/60'
                              : canCollect
                              ? 'bg-yellow-950/40 border-yellow-400/80 shadow-md shadow-yellow-500/20'
                              : animal.fed && !animal.productReady
                              ? 'bg-blue-950/30 border-blue-400/50'
                              : TIER_CARD_STYLES[animal.tier]
                          }`}
                        >
                          <div>
                            {/* Emoji + Species Badge */}
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-2xl">{def.emoji}</span>
                              <span
                                className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  color: TIER_COLORS[animal.tier],
                                  backgroundColor: `${TIER_COLORS[animal.tier]}20`,
                                }}
                              >
                                {animal.tier === 'legendary' && '✨ '}{TIER_LABELS[animal.tier]}
                              </span>
                            </div>

                            {/* Breed Name */}
                            <div
                              className="text-xs font-bold text-white truncate text-left"
                              title={breedName}
                            >
                              {breedName}
                            </div>

                            {/* Apex Mutant Badge */}
                            {isMutated && (
                              <div className="text-[8px] font-black text-fuchsia-200 bg-fuchsia-950/80 px-1 py-0.5 rounded mt-0.5 border border-fuchsia-400/50 truncate text-left">
                                🧬 {animal.mutationVariant || 'Apex Mutant'} (+50%)
                              </div>
                            )}

                            {/* Visual Theme */}
                            {visualTheme && (
                              <div
                                className="text-[8px] text-stone-400 italic truncate text-left mt-0.5"
                                title={visualTheme}
                              >
                                {visualTheme}
                              </div>
                            )}

                            {/* Yield info */}
                            <div className="text-[9px] text-stone-300 text-left mt-1">
                              Yield: <span className="font-semibold">{yieldInfo}</span>
                            </div>

                            {/* Cycles Display */}
                            <div className="text-[9px] text-stone-400 text-left">
                              Cycles: {animal.cyclesRemaining}/{animal.maxCycles}
                              {animal.age === 'elder' && ' (elder)'}
                            </div>

                            {/* Production Progress Bar */}
                            {animal.fed && !animal.productReady && (
                              <div className="w-full h-1.5 bg-stone-800 rounded-full mt-1.5 overflow-hidden border border-stone-700">
                                <div
                                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                                  style={{ width: `${prodProgress * 100}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-2 pt-1 border-t border-stone-800/80 space-y-1">
                            {canCollect && (
                              <button
                                onClick={() => collectProduct(animal.id)}
                                className={`w-full py-1 text-xs font-bold rounded-lg text-stone-950 transition-colors shadow ${
                                  animal.tier === 'legendary'
                                    ? 'bg-amber-400 hover:bg-amber-300 animate-pulse'
                                    : 'bg-yellow-400 hover:bg-yellow-300'
                                }`}
                              >
                                {def.productEmoji} Collect
                              </button>
                            )}

                            {!canCollect && canFeed && animal.age !== 'elder' && !isExhausted && (
                              <button
                                onClick={() => feedAnimal(animal.id)}
                                className="w-full py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                              >
                                🫗 Feed ({def.feedPerCycle})
                              </button>
                            )}

                            {!canCollect && !canFeed && !animal.fed && animal.age !== 'elder' && !isExhausted && (
                              <div className="text-[10px] text-stone-400 py-0.5">Need feed 🫗</div>
                            )}

                            {animal.fed && !animal.productReady && !isExhausted && (
                              <div className="text-[10px] text-blue-400 py-0.5 font-medium">Producing...</div>
                            )}

                            {animal.age === 'elder' && (
                              <div className="text-[10px] text-amber-400 font-medium italic py-0.5">
                                Ready for Market
                              </div>
                            )}

                            {/* Overclock Action Menu */}
                            {animal.age !== 'elder' && (
                              <div className="pt-0.5">
                                <OverclockActionMenu
                                  entityId={`animal_${animal.id}`}
                                  entityType="animal"
                                  name={breedDef?.name || def.name}
                                  compact={true}
                                  className="w-full flex justify-center"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Slot Placeholders for Visual Symmetry */}
                    {Array.from({ length: emptySlotCount }).map((_, slotIdx) => (
                      <div
                        key={`empty-slot-${tier}-${slotIdx}`}
                        className="rounded-xl border-2 border-dashed border-stone-800/80 bg-stone-950/30 p-3 flex flex-col items-center justify-center text-center space-y-1.5 min-h-[160px]"
                      >
                        <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-sm text-stone-500">
                          {SECTOR_EMOJIS[tier]}
                        </div>
                        <div className="text-[11px] font-bold text-stone-400">
                          Empty {config.title} Slot
                        </div>
                        <div className="text-[9px] text-stone-500 max-w-[120px]">
                          {tier === 'common' ? 'Available for starter adoption' : 'Available for mutation incubator'}
                        </div>
                        {tier === 'common' ? (
                          <button
                            onClick={() => setShowAdoptMenu(true)}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all"
                          >
                            + Adopt
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowBreedingModal(true)}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-500/40 transition-all"
                          >
                            + Incubate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 4. BARN INVENTORY SUMMARY */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 space-y-1.5">
        <div className="text-xs font-bold text-stone-400">Barn Storage:</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(barn)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => {
              const emojiMap: Record<string, string> = {
                egg: '🥚', milk: '🥛', wool: '🧶', truffle: '🍄',
                bread: '🍞', cheese: '🧀', pie: '🥧', sweater: '🧥',
                truffle_oil: '🫒', fish: '🐟', yarn: '🧵',
                quilted_blanket: '🧴', savory_fish_pie: '🥧',
                crab_bisque: '🍒', honey: '🍯', silk: '🧵',
                egg_blue: '🥚', egg_obsidian: '🥚', egg_golden: '🥚',
                milk_rich_cream: '🥛', milk_alpine: '🥛', milk_starlight: '🥛',
                wool_patterned: '🧶', wool_merino: '🧶', wool_gilded: '🧶',
                truffle_white: '🍄', truffle_alba: '🍄', truffle_diamond: '🍄',
                soft_down_feather: '🪶', glossy_quill: '🪶',
                churned_butter: '🧈', yak_wool: '🧶',
                horn_shavings: '🦴', lanolin_balm: '🧴',
                ancient_coin: '🪙', foraged_nut: '🥜', ancient_hoard: '💰',
                golden_shawl: '🧥', merino_sweater: '🧥', rich_butter: '🧈',
                alpine_cheese: '🧀', golden_cake: '🎂',
              };
              return (
                <span
                  key={k}
                  className="bg-stone-800 px-2 py-0.5 rounded-full text-stone-300 border border-stone-700/60"
                >
                  {emojiMap[k] || '📦'} {v}
                </span>
              );
            })}
        </div>
      </div>

      {/* 5. DEDICATED BREEDING MODAL */}
      <BreedingModal isOpen={showBreedingModal} onClose={() => setShowBreedingModal(false)} />
    </div>
  );
}
