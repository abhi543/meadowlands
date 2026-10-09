'use client';

import { useGameStore } from '@/game/store';
import { ANIMALS, TIER_COLORS, TIER_LABELS, TIER_MAX_CYCLES, HABITAT_UPGRADES, type AnimalSpecies, type Tier } from '@/game/data';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const COSTS: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };

export function AnimalPanel() {
  const { animals, silo, barn, coins, level, feedAnimal, collectProduct, buyAnimal, animalCapacity, habitatUpgradeSteps, upgradeHabitat } = useGameStore();

  return (
    <div className="space-y-4">
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
                    Buy {'\u{1F4B0}'}{COSTS[species]}
                  </button>
                )}
                {nextUpgrade && (
                  <button
                    onClick={() => upgradeHabitat(species)}
                    disabled={coins < nextUpgrade.costCoins}
                    className="px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                  >
                    +{nextUpgrade.additionalCapacity} {'\u{1F4B0}'}{nextUpgrade.costCoins}
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

                  // Progress bar for production
                  let prodProgress = 0;
                  if (animal.fed && animal.fedAt && !animal.productReady) {
                    prodProgress = Math.min(1, (Date.now() - animal.fedAt) / (def.productionTimeSec * 1000));
                  }

                  return (
                    <div
                      key={animal.id}
                      className={`rounded-lg border-2 p-2 text-center transition-all ${
                        animal.age === 'elder'
                          ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600'
                          : canCollect
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 shadow-sm'
                          : animal.fed && !animal.productReady
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{def.emoji}</div>
                      <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: TIER_COLORS[animal.tier] }}>
                        {TIER_LABELS[animal.tier]}
                      </div>

                      {/* Cycles display */}
                      <div className="text-[9px] text-stone-500 dark:text-gray-400 mt-0.5">
                        {animal.cyclesRemaining}/{animal.maxCycles} cycles
                        {animal.age === 'elder' && ' (elder)'}
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
                      <div className="mt-1.5">
                        {canCollect && (
                          <button
                            onClick={() => collectProduct(animal.id)}
                            className="w-full py-1 text-xs font-bold rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition-colors animate-pulse"
                          >
                            {def.productEmoji} Collect
                          </button>
                        )}
                        {!canCollect && canFeed && animal.age !== 'elder' && (
                          <button
                            onClick={() => feedAnimal(animal.id)}
                            className="w-full py-1 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            {'\u{1FAD9}'} Feed ({def.feedPerCycle})
                          </button>
                        )}
                        {!canCollect && !canFeed && !animal.fed && animal.age !== 'elder' && (
                          <div className="text-[10px] text-stone-400 dark:text-gray-500">Need feed {'\u{1FAD9}'}</div>
                        )}
                        {animal.fed && !animal.productReady && (
                          <div className="text-[10px] text-blue-500 dark:text-blue-400">Producing...</div>
                        )}
                        {animal.age === 'elder' && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 italic">Retired</div>
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
            egg: '\u{1F95A}', milk: '\u{1F95B}', wool: '\u{1F9F6}', truffle: '\u{1F344}',
            bread: '\u{1F35E}', cheese: '\u{1F9C0}', pie: '\u{1F967}', sweater: '\u{1F9E5}',
            truffle_oil: '\u{1FAD2}', fish: '\u{1F41F}', yarn: '\u{1F9F5}',
            quilted_blanket: '\u{1F9F4}', savory_fish_pie: '\u{1F967}',
            crab_bisque: '\u{1F352}', honey: '\u{1F36F}', silk: '\u{1F9F5}',
          };
          return (
            <span key={k} className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full text-stone-700 dark:text-stone-300">
              {emojiMap[k] || '\u{1F4E6}'} {v}
            </span>
          );
        })}
      </div>
    </div>
  );
}
