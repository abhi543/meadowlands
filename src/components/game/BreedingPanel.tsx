'use client';

import { useGameStore } from '@/game/store';
import { ANIMALS, TIER_COLORS, TIER_LABELS, TIER_MAX_CYCLES, BREEDING_SLOT_UPGRADES, type AnimalSpecies, type Tier } from '@/game/data';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];

export function BreedingPanel() {
  const { animals, level, gems, breedingSlots, activeBreedings, breedAnimals, upgradeBreedingSlot, animalCapacity } = useGameStore();
  const now = Date.now();

  const nextSlotUpgrade = BREEDING_SLOT_UPGRADES.find(u => u.slotIndex === breedingSlots + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F43E}'} Breeding
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">
          {breedingSlots} slot{breedingSlots > 1 ? 's' : ''} {'\u2022'} {activeBreedings.length} active
        </span>
      </div>

      {/* Breeding Slot Upgrade */}
      {nextSlotUpgrade && (
        <button
          onClick={upgradeBreedingSlot}
          disabled={level < nextSlotUpgrade.unlockLevel || gems < nextSlotUpgrade.costGems}
          className="w-full py-2 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
        >
          Unlock Slot {nextSlotUpgrade.slotIndex} {'\u{1F48E}'}{nextSlotUpgrade.costGems}
          {level < nextSlotUpgrade.unlockLevel && ` (Lv.${nextSlotUpgrade.unlockLevel})`}
        </button>
      )}

      {/* Active Breedings */}
      {activeBreedings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Active Breedings</h4>
          {activeBreedings.map(b => {
            const elapsed = now - b.startedAt;
            const progress = Math.min(1, elapsed / b.durationMs);
            const remaining = Math.max(0, Math.ceil((b.durationMs - elapsed) / 1000));
            const speciesDef = ANIMALS[b.species];

            return (
              <div key={b.id} className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{speciesDef.emoji}</span>
                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                      {speciesDef.name} breeding
                    </span>
                  </div>
                  <span className="text-[10px] text-violet-500 dark:text-violet-400">{remaining}s</span>
                </div>
                <div className="w-full h-2 bg-violet-100 dark:bg-violet-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 dark:bg-violet-500 rounded-full transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Breeding Pairs by Species */}
      <div className="space-y-3">
        {SPECIES_LIST.map(species => {
          const def = ANIMALS[species];
          const myAnimals = animals.filter(a => a.species === species && !a.fed && !a.productReady);
          const cap = animalCapacity[species] || def.capacity;

          return (
            <div key={species} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 px-4 py-2.5 border-b border-stone-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{def.emoji}</span>
                  <div>
                    <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-200">{def.name} Breeding</h4>
                    <p className="text-xs text-violet-700 dark:text-violet-400">{animals.filter(a => a.species === species).length}/{cap} animals</p>
                  </div>
                </div>
              </div>

              <div className="p-3">
                {myAnimals.length < 2 ? (
                  <div className="text-center text-xs text-stone-400 dark:text-gray-500 italic py-2">
                    Need at least 2 available {def.name.toLowerCase()}s to breed
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {myAnimals.slice(0, 6).map(animal => (
                        <div
                          key={animal.id}
                          className="rounded-lg border p-1.5 text-center"
                          style={{
                            borderColor: TIER_COLORS[animal.tier],
                            backgroundColor: `${TIER_COLORS[animal.tier]}10`,
                          }}
                        >
                          <div className="text-sm">{def.emoji}</div>
                          <div className="text-[9px] font-bold" style={{ color: TIER_COLORS[animal.tier] }}>
                            {TIER_LABELS[animal.tier]}
                          </div>
                          <div className="text-[8px] text-stone-500 dark:text-gray-400">
                            {animal.cyclesRemaining}/{animal.maxCycles} cycles
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Breed buttons for pairs */}
                    {activeBreedings.length < breedingSlots && (
                      <div className="space-y-1">
                        {myAnimals.slice(0, 4).map((a1, i) =>
                          myAnimals.slice(i + 1, i + 2).map(a2 => (
                            <button
                              key={`${a1.id}-${a2.id}`}
                              onClick={() => breedAnimals(a1.id, a2.id)}
                              className="w-full py-1.5 text-xs font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors flex items-center justify-center gap-2"
                            >
                              {def.emoji} {TIER_LABELS[a1.tier]} {'\u00D7'} {TIER_LABELS[a2.tier]} {'\u2192'} Breed
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
