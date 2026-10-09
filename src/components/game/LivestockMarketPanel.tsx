'use client';

import { useGameStore } from '@/game/store';
import {
  ANIMALS, TIER_COLORS, TIER_LABELS, TIER_MAX_CYCLES,
  HABITAT_UPGRADES,
  livestockBuyPrice, livestockSellPriceForAnimal,
  type AnimalSpecies, type Tier,
} from '@/game/data';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];

export function LivestockMarketPanel() {
  const { animals, coins, animalCapacity, buyAnimal, sellAnimal } = useGameStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F3EA}'} Livestock Market
        </h3>
      </div>

      {/* Buy Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Buy Animals</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          {TIER_LABELS[tier]}
                          <br />
                          {'\u{1F4B0}'}{price}
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

      {/* Sell Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Sell Animals</h4>
        {animals.length === 0 ? (
          <div className="text-center py-4 text-sm text-stone-400 dark:text-gray-500 italic">No animals to sell</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {animals.map(animal => {
              const def = ANIMALS[animal.species];
              const sellPrice = livestockSellPriceForAnimal(animal.species, animal.tier, animal.cyclesRemaining, animal.maxCycles);
              const canSell = sellPrice > 0;

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
                  <div className="text-[10px] font-bold" style={{ color: TIER_COLORS[animal.tier] }}>
                    {TIER_LABELS[animal.tier]}
                  </div>
                  <div className="text-[9px] text-stone-500 dark:text-gray-400">
                    {animal.cyclesRemaining}/{animal.maxCycles} cycles
                    {animal.age === 'elder' && ' (elder)'}
                  </div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    {'\u{1F4B0}'}{sellPrice}
                  </div>
                  {canSell && (
                    <button
                      onClick={() => sellAnimal(animal.id)}
                      className={`w-full mt-1 py-1 text-[10px] font-bold rounded-md text-white transition-colors ${
                        animal.age === 'elder'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {animal.age === 'elder' ? 'Sell' : 'Market Sell'}
                    </button>
                  )}
                </div>
              );
            })}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  +{nextUpgrade.additionalCapacity} {'\u{1F4B0}'}{nextUpgrade.costCoins}
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
