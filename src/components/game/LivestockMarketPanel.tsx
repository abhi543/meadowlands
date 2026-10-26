'use client';

import { useGameStore } from '@/game/store';
import {
  ANIMALS, TIER_COLORS, TIER_LABELS,
  HABITAT_UPGRADES, BREED_REGISTRY,
  livestockBuyPrice, livestockSellPriceForAnimal,
  type AnimalSpecies, type Tier,
} from '@/game/data';
import { BreedingPanel } from './BreedingPanel';
import { TOTAL_PASTURE_CAPACITY } from '@/types/animals';
import { calculateAnimalResalePrice, getCoatDefinition, getTraitDefinition } from '@/game/livestockGeneticsEngine';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];

export function LivestockMarketPanel() {
  const {
    animals,
    coins,
    animalCapacity,
    buyAnimal,
    sellAnimal,
    livestockReserve = [],
    moveToPasture,
    sellReserveAnimal,
  } = useGameStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
            {'🐄'} Livestock Page
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Total Farm Animals: <span className="font-bold text-stone-800 dark:text-stone-200">{animals.length + livestockReserve.length}</span> ({animals.length} Active in Pastures, {livestockReserve.length} in Holding Reserve)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 font-bold font-mono">
            🐾 {animals.length}/{TOTAL_PASTURE_CAPACITY} Pastures
          </span>
          {livestockReserve.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 font-bold font-mono">
              📦 {livestockReserve.length} Reserve
            </span>
          )}
        </div>
      </div>

      {/* Livestock Breeding & Incubator */}
      <BreedingPanel />

      {/* Livestock Reserve Section (Holding Barn) */}
      <div className="bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50 dark:from-stone-900 dark:via-amber-950/20 dark:to-stone-900 border-2 border-amber-300/80 dark:border-amber-800/50 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <div>
              <h4 className="text-sm font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Livestock Reserve & Holding Barn
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-mono font-bold">
                  {livestockReserve.length} Stored
                </span>
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                When active pastures are full (e.g. Common 4/4), newly bred animals are preserved here for future use. Deploy them anytime!
              </p>
            </div>
          </div>
        </div>

        {livestockReserve.length === 0 ? (
          <div className="bg-white/80 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-center text-xs text-stone-500 dark:text-stone-400">
            No animals currently in reserve. When your Common Pasture is full (4/4), newly hatched common livestock will be safely stored here!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {livestockReserve.map(animal => {
              const def = ANIMALS[animal.species];
              const breedDef = BREED_REGISTRY[animal.breedId];
              const breedName = breedDef?.name || TIER_LABELS[animal.tier];
              const tierCount = animals.filter(a => a.tier === animal.tier).length;
              const canDeploy = tierCount < 4;

              const coatDef = getCoatDefinition(animal.species, animal.coat);
              const traitDef = getTraitDefinition(animal.species, animal.trait);
              const isGen0 = !animal.generation || animal.generation === 0;

              let baseReserveSell: number;
              if (breedDef && animal.age === 'elder') {
                baseReserveSell = breedDef.elderMarketValue;
              } else {
                baseReserveSell = livestockSellPriceForAnimal(animal.species, animal.tier, animal.cyclesRemaining, animal.maxCycles);
              }
              const reserveSellPrice = calculateAnimalResalePrice(animal.species, baseReserveSell, animal.generation, animal.coat);

              return (
                <div
                  key={animal.id}
                  className="rounded-xl border-2 p-2.5 bg-white dark:bg-stone-950/80 flex flex-col justify-between space-y-2 shadow-xs"
                  style={{ borderColor: TIER_COLORS[animal.tier] }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">{def.emoji}</div>
                    <div className="flex items-center justify-center gap-1 flex-wrap mb-1">
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded"
                        style={{
                          color: TIER_COLORS[animal.tier],
                          backgroundColor: `${TIER_COLORS[animal.tier]}20`,
                        }}
                      >
                        {TIER_LABELS[animal.tier]}
                      </span>
                      {isGen0 ? (
                        <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          Shop Stock
                        </span>
                      ) : (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                          Gen {animal.generation}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5" title={breedName}>
                      {breedName}
                    </div>

                    {/* Coat & Trait Badges */}
                    <div className="mt-1 flex flex-col items-center gap-0.5 text-[8.5px]">
                      {coatDef && (
                        <span className="font-semibold text-stone-600 dark:text-stone-300 truncate max-w-full">
                          🎨 {coatDef.name} {coatDef.resaleMultiplier > 1 && <span className="text-amber-600 dark:text-amber-400 font-bold">({coatDef.resaleMultiplier}x)</span>}
                        </span>
                      )}
                      {traitDef && animal.trait !== 'none' && (
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.2 rounded border border-indigo-200 dark:border-indigo-800 truncate max-w-full">
                          ⚡ {traitDef.name}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                      {animal.cyclesRemaining}/{animal.maxCycles} cycles
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-stone-200 dark:border-stone-800/80">
                    <button
                      onClick={() => moveToPasture(animal.id)}
                      disabled={!canDeploy}
                      className="w-full py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-xs"
                      title={canDeploy ? 'Deploy into active pasture' : `${TIER_LABELS[animal.tier]} Pasture is full (4/4)`}
                    >
                      {canDeploy ? 'Deploy to Pasture' : 'Pasture Full (4/4)'}
                    </button>
                    <button
                      onClick={() => sellReserveAnimal(animal.id)}
                      className="w-full py-1 text-[9px] font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                    >
                      Sell (🪙{reserveSellPrice})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Buy Animals</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SPECIES_LIST.map(species => {
            const def = ANIMALS[species];
            const currentCount = animals.filter(a => a.species === species).length;
            const cap = animalCapacity[species] || def.capacity;
            const atCapacity = currentCount >= cap;

            return (
              <div key={species} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{def.emoji}</span>
                  <div>
                    <h5 className="font-semibold text-sm text-stone-800 dark:text-gray-200">{def.name}</h5>
                    <p className="text-xs text-stone-500 dark:text-gray-400">{currentCount}/{cap} owned</p>
                  </div>
                </div>

                {atCapacity ? (
                  <div className="text-[10px] text-red-500 dark:text-red-400 text-center">Habitat full! Upgrade to hold more.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIERS.map(tier => {
                      const price = livestockBuyPrice(species, tier);
                      const canBuy = coins >= price;
                      // Only show common by default, uncommon+ require level
                      const showTier = tier === 'common' || currentCount > 0;
                      const breedId = `${species}_${tier}`;
                      const breedDef = BREED_REGISTRY[breedId];
                      const breedName = breedDef?.name || TIER_LABELS[tier];

                      if (!showTier) return null;

                      return (
                        <button
                          key={tier}
                          onClick={() => buyAnimal(species, tier)}
                          disabled={!canBuy}
                          className="py-1.5 text-xs font-medium rounded-lg border-2 transition-all disabled:opacity-50"
                          style={{
                            borderColor: canBuy ? TIER_COLORS[tier] : '#e5e7eb',
                            backgroundColor: canBuy ? `${TIER_COLORS[tier]}15` : 'transparent',
                            color: canBuy ? TIER_COLORS[tier] : '#9ca3af',
                          }}
                        >
                          <div className="font-bold">{TIER_LABELS[tier]}</div>
                          <div className="text-[9px] opacity-80 truncate">{breedName}</div>
                          <div>{'💰'}{price}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sell Section — Elder Animals Only */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Sell Elder Animals</h4>
        {(() => {
          const elders = animals.filter(a => a.age === 'elder');
          return elders.length === 0 ? (
            <div className="text-center py-4 text-sm text-stone-400 dark:text-gray-500 italic">No elder animals to sell</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
              {elders.map(animal => {
                const def = ANIMALS[animal.species];
                const breedDef = BREED_REGISTRY[animal.breedId];
                const breedName = breedDef?.name || TIER_LABELS[animal.tier];

                // Use breed-specific elder market value
                let sellPrice: number;
                if (breedDef) {
                  const cyclesCompleted = animal.maxCycles - animal.cyclesRemaining;
                  if (cyclesCompleted <= 0) sellPrice = 0;
                  else if (animal.cyclesRemaining <= 0) sellPrice = breedDef.elderMarketValue;
                  else sellPrice = Math.floor(breedDef.elderMarketValue * (cyclesCompleted / animal.maxCycles));
                } else {
                  sellPrice = livestockSellPriceForAnimal(animal.species, animal.tier, animal.cyclesRemaining, animal.maxCycles);
                }
                sellPrice = calculateAnimalResalePrice(animal.species, sellPrice, animal.generation, animal.coat);

                const coatDef = getCoatDefinition(animal.species, animal.coat);
                const traitDef = getTraitDefinition(animal.species, animal.trait);
                const isGen0 = !animal.generation || animal.generation === 0;

                return (
                  <div
                    key={animal.id}
                    className="rounded-lg border-2 p-2 text-center"
                    style={{
                      borderColor: TIER_COLORS[animal.tier],
                      backgroundColor: `${TIER_COLORS[animal.tier]}10`,
                    }}
                  >
                    <div className="text-xl mb-0.5">{def.emoji}</div>
                    <div className="flex items-center justify-center gap-1 flex-wrap mb-1">
                      <span className="text-[10px] font-bold" style={{ color: TIER_COLORS[animal.tier] }}>
                        {TIER_LABELS[animal.tier]}
                      </span>
                      {isGen0 ? (
                        <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          Shop Stock
                        </span>
                      ) : (
                        <span className="text-[7.5px] font-extrabold px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                          Gen {animal.generation}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] font-medium text-stone-600 dark:text-stone-300 truncate">
                      {breedName}
                    </div>

                    {/* Coat & Trait Badges */}
                    <div className="mt-0.5 flex flex-col items-center gap-0.5 text-[8px]">
                      {coatDef && (
                        <span className="font-semibold text-stone-600 dark:text-stone-300 truncate max-w-full">
                          🎨 {coatDef.name} {coatDef.resaleMultiplier > 1 && <span className="text-amber-600 dark:text-amber-400 font-bold">({coatDef.resaleMultiplier}x)</span>}
                        </span>
                      )}
                      {traitDef && animal.trait !== 'none' && (
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.2 rounded border border-indigo-200 dark:border-indigo-800 truncate max-w-full">
                          ⚡ {traitDef.name}
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] text-stone-500 dark:text-gray-400 mt-0.5">
                      {animal.maxCycles} cycles done
                    </div>
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                      {'💰'}{sellPrice}
                    </div>
                    <button
                      onClick={() => sellAnimal(animal.id)}
                      className="w-full mt-1 py-1 text-[10px] font-bold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    >
                      Sell to Market
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {animals.filter(a => a.age !== 'elder').length > 0 && (
          <div className="text-[10px] text-stone-400 dark:text-gray-500 text-center mt-1">
            {animals.filter(a => a.age !== 'elder').length} active animal{animals.filter(a => a.age !== 'elder').length !== 1 ? 's' : ''} still producing — sell when elder
          </div>
        )}
      </div>

      {/* Habitat Upgrades */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Habitat Upgrades</h4>
        <HabitatUpgradeSection />
      </div>
    </div>
  );
}

function HabitatUpgradeSection() {
  const { animalCapacity, habitatUpgradeSteps, coins, upgradeHabitat } = useGameStore();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {SPECIES_LIST.map(species => {
        const def = ANIMALS[species];
        const currentStep = habitatUpgradeSteps[species] || 0;
        const nextUpgrade = HABITAT_UPGRADES.find(u => u.species === species && u.step === currentStep + 1);
        const currentCap = animalCapacity[species] || def.capacity;

        return (
          <div key={species} className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-700 p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{def.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-stone-800 dark:text-gray-200">{def.habitat}</div>
                  <div className="text-xs text-stone-500 dark:text-gray-400">Cap: {currentCap}</div>
                </div>
              </div>
              {nextUpgrade ? (
                <button
                  onClick={() => upgradeHabitat(species)}
                  disabled={coins < nextUpgrade.costCoins}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                >
                  +{nextUpgrade.additionalCapacity} {'💰'}{nextUpgrade.costCoins}
                </button>
              ) : (
                <span className="text-[10px] text-stone-400 dark:text-gray-500">Max</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
