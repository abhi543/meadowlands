'use client';

import { useGameStore } from '@/game/store';
import { ANIMALS, TIER_COLORS, TIER_LABELS, HABITAT_UPGRADES, BREED_REGISTRY, type AnimalSpecies, type Tier } from '@/game/data';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const COSTS: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };

// Tier-specific border/bg classes per PRD spec
const TIER_CARD_STYLES: Record<Tier, string> = {
  common: 'border-stone-400 dark:border-stone-500 bg-stone-900/60',
  uncommon: 'border-emerald-500 dark:border-emerald-400 bg-emerald-950/40 shadow-emerald-950/30',
  rare: 'border-sky-500 dark:border-sky-400 bg-sky-950/40 shadow-sky-950/30',
  legendary: 'border-amber-400 dark:border-amber-300 bg-amber-950/60 shadow-amber-500/30 ring-1 ring-amber-300',
};

import { useState, useEffect } from 'react';
import { OverclockActionMenu } from './OverclockActionMenu';
import { BreedingModal } from './BreedingModal';

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
    toggleAnimalOverclock,
    cureAnimalExhaustion,
    breedingSlots,
    activeBreedings,
  } = useGameStore();

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute batch action counts
  const feedableAnimals = animals.filter(a => !a.fed && !a.productReady && a.age !== 'elder');
  const collectibleAnimals = animals.filter(a => a.productReady && a.cyclesRemaining > 0);

  // Count how many can actually be fed with available feed
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

  return (
    <div className="space-y-4">
      {/* Livestock Breeding & Incubator Entrypoint */}
      {(() => {
        const readyEggsCount = activeBreedings.filter(b => Date.now() - b.startedAt >= b.durationMs).length;
        return (
          <div className="bg-gradient-to-r from-violet-950/80 via-purple-950/80 to-stone-900 border-2 border-violet-500/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-2xl shadow-inner relative">
                🧬
                {readyEggsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Livestock Breeding & Incubator</h3>
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
                  Combine purebred livestock to trigger upward mutations into Rare & Legendary breeds.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBreedingModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 via-fuchsia-600 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>🥚</span>
              Open Incubator & Breeding
            </button>
          </div>
        );
      })()}

      {/* Batch Action Buttons */}
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
            <span className="text-lg">{'🧺'}</span>
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
            <span className="text-lg">{'🫗'}</span>
            Feed All
            {canFeedCount > 0 && (
              <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">
                {canFeedCount}
              </span>
            )}
            <span className="text-xs opacity-80">{'🫗'}{totalFeedNeeded > 0 ? Math.min(silo.feed || 0, totalFeedNeeded) : 0}</span>
          </button>
        </div>
      )}

      {/* Habitats */}
      {SPECIES_LIST.map(species => {
        const def = ANIMALS[species];
        const myAnimals = animals.filter(a => a.species === species);
        const cap = animalCapacity[species] || def.capacity;
        const currentStep = habitatUpgradeSteps[species] || 0;
        const nextUpgrade = HABITAT_UPGRADES.find(u => u.species === species && u.step === currentStep + 1);

        return (
          <div key={species} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
            {/* Habitat Header */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-4 py-2.5 flex items-center justify-between border-b border-stone-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xl">{def.emoji}</span>
                <div>
                  <h3 className="font-semibold text-sm text-green-900 dark:text-green-200">{def.habitat}</h3>
                  <p className="text-xs text-green-700 dark:text-green-400">{myAnimals.length}/{cap} animals</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myAnimals.length < cap && (
                  <button
                    onClick={() => buyAnimal(species)}
                    disabled={coins < COSTS[species]}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                  >
                    Buy {'💰'}{COSTS[species]}
                  </button>
                )}
                {nextUpgrade && (
                  <button
                    onClick={() => upgradeHabitat(species)}
                    disabled={coins < nextUpgrade.costCoins}
                    className="px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                  >
                    +{nextUpgrade.additionalCapacity} {'💰'}{nextUpgrade.costCoins}
                  </button>
                )}
              </div>
            </div>

            {/* Animal Cards */}
            {myAnimals.length === 0 ? (
              <div className="p-4 text-center text-sm text-stone-400 dark:text-gray-500 italic">
                No {def.name.toLowerCase()}s yet. Buy one to get started!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                {myAnimals.map(animal => {
                  const canFeed = !animal.fed && !animal.productReady && (silo.feed || 0) >= def.feedPerCycle;
                  const canCollect = animal.productReady;
                  const breedDef = BREED_REGISTRY[animal.breedId];
                  const breedName = breedDef?.name || TIER_LABELS[animal.tier];
                  const visualTheme = breedDef?.visualTheme;

                  // Production time - use breed-specific if available
                  const prodTimeSec = breedDef ? breedDef.baseIntervalMs / 1000 : def.productionTimeSec;

                  // Progress bar for production
                  let prodProgress = 0;
                  if (animal.fed && animal.fedAt && !animal.productReady) {
                    prodProgress = Math.min(1, (Date.now() - animal.fedAt) / (prodTimeSec * 1000));
                  }

                  // Determine yield info for display
                  const yieldInfo = breedDef
                    ? `${breedDef.baseYieldAmount}x ${breedDef.primaryProductKey.replace(/_/g, ' ')}`
                    : `${def.productYield}x ${def.product}`;

                  const isMutated = Boolean(animal.isMutated);
                  const isOverclocked = Boolean(animal.isOverclocked && animal.overclockExpiresAt && animal.overclockExpiresAt > Date.now());
                  const isExhausted = Boolean(animal.isExhausted && animal.exhaustedUntil && animal.exhaustedUntil > Date.now());
                  const overclockRemaining = isOverclocked ? Math.max(0, Math.ceil(((animal.overclockExpiresAt || 0) - Date.now()) / 1000)) : 0;
                  const exhaustedRemaining = isExhausted ? Math.max(0, Math.ceil(((animal.exhaustedUntil || 0) - Date.now()) / 1000)) : 0;

                  return (
                    <div
                      key={animal.id}
                      className={`rounded-lg border-2 p-2 text-center transition-all ${
                        isMutated
                          ? 'border-purple-400 dark:border-purple-300 bg-purple-950/60 shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-400'
                          : isOverclocked
                          ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-300 animate-pulse'
                          : isExhausted
                          ? 'border-stone-600 bg-stone-900/90 opacity-80'
                          : animal.age === 'elder'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500'
                          : canCollect
                          ? `bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 shadow-sm ${animal.tier === 'legendary' ? 'animate-pulse' : ''}`
                          : animal.fed && !animal.productReady
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : TIER_CARD_STYLES[animal.tier]
                      }`}
                    >
                      {/* Breed name + Tier badge */}
                      <div className="text-2xl mb-0.5">{def.emoji}</div>
                      <div className="text-[10px] font-bold leading-tight" style={{ color: TIER_COLORS[animal.tier] }}>
                        {animal.tier === 'legendary' && '✨ '}{TIER_LABELS[animal.tier]}
                      </div>
                      <div className="text-[9px] font-medium text-stone-700 dark:text-stone-300 mt-0.5 leading-tight truncate" title={breedName}>
                        {breedName}
                      </div>

                      {/* Mutant Tag */}
                      {isMutated && (
                        <div className="text-[8px] font-black text-purple-200 bg-purple-900/80 px-1 py-0.5 rounded mt-0.5 border border-purple-400/50 truncate">
                          🧬 {animal.mutationVariant || 'Apex Mutant'} (+50%)
                        </div>
                      )}

                      {visualTheme && (
                        <div className="text-[8px] text-stone-400 dark:text-stone-500 italic truncate" title={visualTheme}>
                          {visualTheme}
                        </div>
                      )}

                      {/* Cycles display */}
                      <div className="text-[9px] text-stone-500 dark:text-gray-400 mt-0.5">
                        {animal.cyclesRemaining}/{animal.maxCycles} cycles
                        {animal.age === 'elder' && ' (elder)'}
                      </div>

                      {/* Yield info */}
                      <div className="text-[8px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {yieldInfo}
                        {breedDef?.bonusDrop && <span className="text-emerald-500"> +proc</span>}
                        {breedDef?.gemMilestoneEveryN && <span className="text-amber-400"> +gems</span>}
                      </div>

                      {/* Production Progress */}
                      {animal.fed && !animal.productReady && (
                        <div className="w-full h-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-blue-400 dark:bg-blue-500 rounded-full transition-all"
                            style={{ width: `${prodProgress * 100}%` }}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-1.5 space-y-1">
                        {canCollect && (
                          <button
                            onClick={() => collectProduct(animal.id)}
                            className={`w-full py-1 text-xs font-bold rounded-md text-white transition-colors ${
                              animal.tier === 'legendary'
                                ? 'bg-amber-500 hover:bg-amber-600 animate-pulse'
                                : 'bg-yellow-500 hover:bg-yellow-600'
                            }`}
                          >
                            {def.productEmoji} Collect
                          </button>
                        )}
                        {!canCollect && canFeed && animal.age !== 'elder' && !isExhausted && (
                          <button
                            onClick={() => feedAnimal(animal.id)}
                            className="w-full py-1 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            {'🫗'} Feed ({def.feedPerCycle})
                          </button>
                        )}
                        {!canCollect && !canFeed && !animal.fed && animal.age !== 'elder' && !isExhausted && (
                          <div className="text-[10px] text-stone-400 dark:text-gray-500">Need feed {'🫗'}</div>
                        )}
                        {animal.fed && !animal.productReady && !isExhausted && (
                          <div className="text-[10px] text-blue-500 dark:text-blue-400">Producing...</div>
                        )}
                        {animal.age === 'elder' && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">Ready for Livestock Market</div>
                        )}

                        {/* Unified Overclock & Exhaustion Action Menu */}
                        {animal.age !== 'elder' && (
                          <div className="pt-1">
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
              </div>
            )}
          </div>
        );
      })}

      {/* Barn Summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="font-semibold text-stone-600 dark:text-stone-400">Barn:</span>
        {Object.entries(barn).filter(([, v]) => v > 0).map(([k, v]) => {
          const emojiMap: Record<string, string> = {
            egg: '🥚', milk: '🥛', wool: '🧶', truffle: '🍄',
            bread: '🍞', cheese: '🧀', pie: '🥧', sweater: '🧥',
            truffle_oil: '🫒', fish: '🐟', yarn: '🧵',
            quilted_blanket: '🧴', savory_fish_pie: '🥧',
            crab_bisque: '🍒', honey: '🍯', silk: '🧵',
            // Breed-specific products
            egg_blue: '🥚', egg_obsidian: '🥚', egg_golden: '🥚',
            milk_rich_cream: '🥛', milk_alpine: '🥛', milk_starlight: '🥛',
            wool_patterned: '🧶', wool_merino: '🧶', wool_gilded: '🧶',
            truffle_white: '🍄', truffle_alba: '🍄', truffle_diamond: '🍄',
            soft_down_feather: '🪶', glossy_quill: '🪶',
            churned_butter: '🧈', yak_wool: '🧶',
            horn_shavings: '🦴', lanolin_balm: '🧴',
            ancient_coin: '🪙', foraged_nut: '🥜', ancient_hoard: '💰',
            // Crafted from breed-specific products
            golden_shawl: '🧥', merino_sweater: '🧥', rich_butter: '🧈',
            alpine_cheese: '🧀', golden_cake: '🎂',
          };
          return (
            <span key={k} className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full text-stone-700 dark:text-stone-300">
              {emojiMap[k] || '📦'} {v}
            </span>
          );
        })}
      </div>

      {/* Dedicated Breeding & Incubator Modal */}
      <BreedingModal isOpen={showBreedingModal} onClose={() => setShowBreedingModal(false)} />
    </div>
  );
}
